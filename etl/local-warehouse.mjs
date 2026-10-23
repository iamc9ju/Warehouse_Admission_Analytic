import { DatabaseSync } from 'node:sqlite';

// Local test adapter only. No pg import, DATABASE_URL, network or production mode.
export function openWarehouse(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS etl_meta (id INTEGER PRIMARY KEY CHECK(id=1), salt_fingerprint TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS dim_student (student_key INTEGER PRIMARY KEY, student_token TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS dim_year (year_key INTEGER PRIMARY KEY, academic_year INTEGER NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS dim_tcas_round (round_key INTEGER PRIMARY KEY, tcas_round_code TEXT NOT NULL UNIQUE, tcas_round_name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS dim_faculty (faculty_key INTEGER PRIMARY KEY, fac_id TEXT NOT NULL UNIQUE, fac_name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS dim_major (major_key INTEGER PRIMARY KEY, major_id TEXT NOT NULL, major_name TEXT NOT NULL, major_type TEXT NOT NULL, UNIQUE(major_id,major_name,major_type));
    CREATE TABLE IF NOT EXISTS dim_tcas_status (status_key INTEGER PRIMARY KEY, tcas_status TEXT NOT NULL, applicant_status INTEGER);
    CREATE UNIQUE INDEX IF NOT EXISTS status_identity ON dim_tcas_status(tcas_status,COALESCE(applicant_status,2147483648));
    CREATE TABLE IF NOT EXISTS fact_admission (
      admission_key INTEGER PRIMARY KEY, application_token TEXT NOT NULL UNIQUE,
      student_key INTEGER NOT NULL REFERENCES dim_student, year_key INTEGER NOT NULL REFERENCES dim_year,
      round_key INTEGER NOT NULL REFERENCES dim_tcas_round, faculty_key INTEGER NOT NULL REFERENCES dim_faculty,
      major_key INTEGER NOT NULL REFERENCES dim_major, status_key INTEGER NOT NULL REFERENCES dim_tcas_status,
      source_file TEXT NOT NULL, source_row_number INTEGER NOT NULL CHECK(source_row_number>=2),
      priority NUMERIC, score NUMERIC NOT NULL, application_count INTEGER NOT NULL DEFAULT 1 CHECK(application_count=1), loaded_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS etl_runs (run_key INTEGER PRIMARY KEY, source_file TEXT NOT NULL, checksum TEXT NOT NULL, row_count INTEGER NOT NULL, inserted INTEGER NOT NULL, updated INTEGER NOT NULL, loaded_at TEXT NOT NULL);
  `);
  return db;
}

export function loadLocal(db, batch, fingerprint) {
  if (batch.report.errors.length || !batch.rows.length) throw new Error('Validation must pass before loading');
  if (!fingerprint) throw new Error('Salt fingerprint is required');
  let inserted = 0, updated = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    const meta = db.prepare('SELECT salt_fingerprint FROM etl_meta WHERE id=1').get();
    if (meta && meta.salt_fingerprint !== fingerprint) throw new Error('Salt changed: refusing to duplicate student identities');
    db.prepare('INSERT OR IGNORE INTO etl_meta VALUES(1,?)').run(fingerprint);
    // Pseudonymous staging exists only inside the transaction.
    db.exec('CREATE TEMP TABLE stage_admission_fact (payload TEXT NOT NULL)');
    const stage = db.prepare('INSERT INTO stage_admission_fact VALUES(?)');
    for (const row of batch.rows) stage.run(JSON.stringify(row));
    const dimension = (table, key, values) => {
      const columns = Object.keys(values), params = Object.values(values);
      db.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...params);
      return db.prepare(`SELECT ${key} AS id FROM ${table} WHERE ${columns.map(c => `${c} IS ?`).join(' AND ')}`).get(...params).id;
    };
    for (const { payload } of db.prepare('SELECT payload FROM stage_admission_fact').all()) {
      const r = JSON.parse(payload);
      // Allow faculty/round labels to be corrected without breaking their unique identifiers.
      db.prepare('INSERT INTO dim_faculty(fac_id,fac_name) VALUES(?,?) ON CONFLICT(fac_id) DO UPDATE SET fac_name=excluded.fac_name').run(r.fac_id, r.fac_name);
      db.prepare('INSERT INTO dim_tcas_round(tcas_round_code,tcas_round_name) VALUES(?,?) ON CONFLICT(tcas_round_code) DO UPDATE SET tcas_round_name=excluded.tcas_round_name').run(r.tcas_round_code, r.tcas_round_name);
      const fact = {
        application_token: r.application_token,
        student_key: dimension('dim_student', 'student_key', { student_token: r.student_token }),
        year_key: dimension('dim_year', 'year_key', { academic_year: r.academic_year }),
        round_key: dimension('dim_tcas_round', 'round_key', { tcas_round_code: r.tcas_round_code, tcas_round_name: r.tcas_round_name }),
        faculty_key: dimension('dim_faculty', 'faculty_key', { fac_id: r.fac_id, fac_name: r.fac_name }),
        major_key: dimension('dim_major', 'major_key', { major_id: r.major_id, major_name: r.major_name, major_type: r.major_type }),
        status_key: dimension('dim_tcas_status', 'status_key', { tcas_status: r.tcas_status, applicant_status: r.applicant_status }),
        source_file: r.source_file, source_row_number: r.source_row_number, priority: r.priority, score: r.score, loaded_at: new Date().toISOString(),
      };
      if (db.prepare('SELECT 1 FROM fact_admission WHERE application_token=?').get(r.application_token)) updated++; else inserted++;
      const keys = Object.keys(fact);
      db.prepare(`INSERT INTO fact_admission (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON CONFLICT(application_token) DO UPDATE SET ${keys.slice(1).map(k => `${k}=excluded.${k}`).join(',')}`).run(...Object.values(fact));
    }
    db.prepare('INSERT INTO etl_runs(source_file,checksum,row_count,inserted,updated,loaded_at) VALUES(?,?,?,?,?,?)').run(batch.report.source, batch.report.checksum, batch.rows.length, inserted, updated, new Date().toISOString());
    db.exec('DROP TABLE stage_admission_fact; COMMIT');
    return { inserted, updated, totalFacts: db.prepare('SELECT count(*) AS n FROM fact_admission').get().n };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
