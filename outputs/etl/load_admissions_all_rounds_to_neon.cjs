const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const processedDir = path.join(rootDir, "outputs", "processed");
const factPath = path.join(processedDir, "admissions_fact_2567_2569.csv");
const qualityPath = path.join(processedDir, "admissions_source_quality_2567_2569.csv");
const coreSchemaPath = path.join(rootDir, "outputs", "sql", "admissions_all_rounds_warehouse.sql");
const governanceSchemaPath = path.join(rootDir, "outputs", "sql", "warehouse_governance_marts.sql");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = (rows.shift() ?? []).map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );
  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`Invalid CSV row ${rowIndex + 2}: expected ${headers.length} columns, got ${values.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing processed input: ${filePath}. Run aggregate_admissions_all_rounds.py first.`);
  }
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function nullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected numeric value, received ${value}`);
  return parsed;
}

function normalizeFact(row) {
  return {
    application_token: row.application_token,
    student_token: row.student_token,
    academic_year: Number(row.academic_year),
    tcas_round_code: row.tcas_round_code,
    tcas_round_name: row.tcas_round_name,
    project_id: row.project_id,
    fac_id: row.fac_id,
    fac_name: row.fac_name,
    major_id: row.major_id,
    major_name: row.major_name,
    program_type: row.program_type,
    tcas_status: row.tcas_status,
    applicant_status: nullableNumber(row.applicant_status),
    source_file: row.source_file,
    source_row_number: Number(row.source_row_number),
    priority: nullableNumber(row.priority),
    score: nullableNumber(row.score),
  };
}

function normalizeQuality(row) {
  return {
    source_file: row.source_file,
    academic_year: Number(row.academic_year),
    tcas_round_code: row.tcas_round_code,
    tcas_round_name: row.tcas_round_name,
    source_rows: Number(row.source_rows),
    unique_students: Number(row.unique_students),
    duplicate_application_rows: Number(row.duplicate_application_rows),
    missing_score_rows: Number(row.missing_score_rows),
    missing_priority_rows: Number(row.missing_priority_rows),
    missing_major_rows: Number(row.missing_major_rows),
    pii_exported_columns: Number(row.pii_exported_columns),
  };
}

async function preserveExistingTokens(client, rows) {
  const existing = await client.query(`
    SELECT
      fact.application_token,
      student.student_token,
      source.source_file,
      fact.source_row_number
    FROM admissions_dw.fact_admission fact
    JOIN admissions_dw.dim_student student USING (student_key)
    JOIN admissions_dw.dim_source_file source USING (source_file_key)
  `);

  const stagedBySourceRow = new Map(
    rows.map((row) => [`${row.source_file}\u0000${row.source_row_number}`, row])
  );
  const studentTokenContinuity = new Map();
  let preservedApplications = 0;

  for (const prior of existing.rows) {
    const key = `${prior.source_file}\u0000${prior.source_row_number}`;
    const staged = stagedBySourceRow.get(key);
    if (!staged) continue;

    const preservedStudentToken = studentTokenContinuity.get(staged.student_token);
    if (preservedStudentToken && preservedStudentToken !== prior.student_token) {
      throw new Error(`Student token continuity conflict at ${prior.source_file}:${prior.source_row_number}`);
    }

    studentTokenContinuity.set(staged.student_token, prior.student_token);
    staged.application_token = prior.application_token;
    preservedApplications += 1;
  }

  let preservedStudents = 0;
  for (const staged of rows) {
    const priorStudentToken = studentTokenContinuity.get(staged.student_token);
    if (!priorStudentToken) continue;
    staged.student_token = priorStudentToken;
    preservedStudents += 1;
  }

  return {
    existingApplications: existing.rows.length,
    preservedApplications,
    preservedStudents,
  };
}

async function stageFacts(client, rows) {
  await client.query(`
    CREATE TEMP TABLE stage_admission_fact (
      application_token TEXT NOT NULL,
      student_token TEXT NOT NULL,
      academic_year INTEGER NOT NULL,
      tcas_round_code TEXT NOT NULL,
      tcas_round_name TEXT NOT NULL,
      project_id TEXT NOT NULL,
      fac_id TEXT NOT NULL,
      fac_name TEXT NOT NULL,
      major_id TEXT NOT NULL,
      major_name TEXT NOT NULL,
      program_type TEXT NOT NULL,
      tcas_status TEXT NOT NULL,
      applicant_status INTEGER,
      source_file TEXT NOT NULL,
      source_row_number INTEGER NOT NULL,
      priority NUMERIC,
      score NUMERIC NOT NULL
    ) ON COMMIT DROP
  `);

  const chunkSize = 500;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    await client.query(
      `
        INSERT INTO stage_admission_fact
        SELECT *
        FROM jsonb_to_recordset($1::jsonb) AS x(
          application_token TEXT,
          student_token TEXT,
          academic_year INTEGER,
          tcas_round_code TEXT,
          tcas_round_name TEXT,
          project_id TEXT,
          fac_id TEXT,
          fac_name TEXT,
          major_id TEXT,
          major_name TEXT,
          program_type TEXT,
          tcas_status TEXT,
          applicant_status INTEGER,
          source_file TEXT,
          source_row_number INTEGER,
          priority NUMERIC,
          score NUMERIC
        )
      `,
      [JSON.stringify(chunk)]
    );
  }
}

async function loadDimensions(client) {
  await client.query(`
    INSERT INTO admissions_dw.dim_student (student_token)
    SELECT DISTINCT student_token FROM stage_admission_fact
    ON CONFLICT (student_token) DO NOTHING;

    INSERT INTO admissions_dw.dim_year (academic_year)
    SELECT DISTINCT academic_year FROM stage_admission_fact
    ON CONFLICT (academic_year) DO NOTHING;

    INSERT INTO admissions_dw.dim_tcas_round (tcas_round_code, tcas_round_name)
    SELECT DISTINCT tcas_round_code, tcas_round_name FROM stage_admission_fact
    ON CONFLICT (tcas_round_code) DO UPDATE SET tcas_round_name = EXCLUDED.tcas_round_name;

    INSERT INTO admissions_dw.dim_project (project_id)
    SELECT DISTINCT project_id FROM stage_admission_fact
    ON CONFLICT (project_id) DO NOTHING;

    INSERT INTO admissions_dw.dim_faculty (fac_id, fac_name)
    SELECT DISTINCT fac_id, fac_name FROM stage_admission_fact
    ON CONFLICT (fac_id) DO UPDATE SET fac_name = EXCLUDED.fac_name;

    INSERT INTO admissions_dw.dim_major (major_id, major_name, major_type)
    SELECT DISTINCT major_id, major_name, program_type FROM stage_admission_fact
    ON CONFLICT (major_id, major_name, major_type) DO NOTHING;

    INSERT INTO admissions_dw.dim_program_type (program_type)
    SELECT DISTINCT program_type FROM stage_admission_fact
    ON CONFLICT (program_type) DO NOTHING;

    INSERT INTO admissions_dw.dim_tcas_status (tcas_status, applicant_status)
    SELECT DISTINCT tcas_status, applicant_status FROM stage_admission_fact
    ON CONFLICT (tcas_status, applicant_status) DO NOTHING;

    INSERT INTO admissions_dw.dim_source_file (source_file)
    SELECT DISTINCT source_file FROM stage_admission_fact
    ON CONFLICT (source_file) DO NOTHING;
  `);
}

async function loadFact(client) {
  await client.query(`
    INSERT INTO admissions_dw.fact_admission (
      application_token,
      student_key,
      year_key,
      round_key,
      project_key,
      faculty_key,
      major_key,
      program_type_key,
      status_key,
      source_file_key,
      source_row_number,
      priority,
      score,
      loaded_at
    )
    SELECT
      st.application_token,
      ds.student_key,
      dy.year_key,
      dr.round_key,
      dp.project_key,
      df.faculty_key,
      dm.major_key,
      dpt.program_type_key,
      dts.status_key,
      dsf.source_file_key,
      st.source_row_number,
      st.priority,
      st.score,
      now()
    FROM stage_admission_fact st
    JOIN admissions_dw.dim_student ds ON ds.student_token = st.student_token
    JOIN admissions_dw.dim_year dy ON dy.academic_year = st.academic_year
    JOIN admissions_dw.dim_tcas_round dr ON dr.tcas_round_code = st.tcas_round_code
    JOIN admissions_dw.dim_project dp ON dp.project_id = st.project_id
    JOIN admissions_dw.dim_faculty df ON df.fac_id = st.fac_id
    JOIN admissions_dw.dim_major dm
      ON dm.major_id = st.major_id
     AND dm.major_name = st.major_name
     AND dm.major_type = st.program_type
    JOIN admissions_dw.dim_program_type dpt ON dpt.program_type = st.program_type
    JOIN admissions_dw.dim_tcas_status dts
      ON dts.tcas_status = st.tcas_status
     AND dts.applicant_status IS NOT DISTINCT FROM st.applicant_status
    JOIN admissions_dw.dim_source_file dsf ON dsf.source_file = st.source_file
    ON CONFLICT (application_token) DO UPDATE SET
      student_key = EXCLUDED.student_key,
      year_key = EXCLUDED.year_key,
      round_key = EXCLUDED.round_key,
      project_key = EXCLUDED.project_key,
      faculty_key = EXCLUDED.faculty_key,
      major_key = EXCLUDED.major_key,
      program_type_key = EXCLUDED.program_type_key,
      status_key = EXCLUDED.status_key,
      source_file_key = EXCLUDED.source_file_key,
      source_row_number = EXCLUDED.source_row_number,
      priority = EXCLUDED.priority,
      score = EXCLUDED.score,
      loaded_at = now();

    DELETE FROM admissions_dw.fact_admission fact
    WHERE NOT EXISTS (
      SELECT 1 FROM stage_admission_fact stage
      WHERE stage.application_token = fact.application_token
    );
  `);
}

async function loadQuality(client, rows) {
  await client.query(
    `
      INSERT INTO admissions_dw.admission_round_source_data_quality (
        source_file, academic_year, tcas_round_code, tcas_round_name,
        source_rows, unique_students, duplicate_application_rows,
        missing_score_rows, missing_priority_rows, missing_major_rows,
        pii_exported_columns, loaded_at
      )
      SELECT
        source_file, academic_year, tcas_round_code, tcas_round_name,
        source_rows, unique_students, duplicate_application_rows,
        missing_score_rows, missing_priority_rows, missing_major_rows,
        pii_exported_columns, now()
      FROM jsonb_to_recordset($1::jsonb) AS x(
        source_file TEXT,
        academic_year INTEGER,
        tcas_round_code TEXT,
        tcas_round_name TEXT,
        source_rows INTEGER,
        unique_students INTEGER,
        duplicate_application_rows INTEGER,
        missing_score_rows INTEGER,
        missing_priority_rows INTEGER,
        missing_major_rows INTEGER,
        pii_exported_columns INTEGER
      )
      ON CONFLICT (source_file) DO UPDATE SET
        academic_year = EXCLUDED.academic_year,
        tcas_round_code = EXCLUDED.tcas_round_code,
        tcas_round_name = EXCLUDED.tcas_round_name,
        source_rows = EXCLUDED.source_rows,
        unique_students = EXCLUDED.unique_students,
        duplicate_application_rows = EXCLUDED.duplicate_application_rows,
        missing_score_rows = EXCLUDED.missing_score_rows,
        missing_priority_rows = EXCLUDED.missing_priority_rows,
        missing_major_rows = EXCLUDED.missing_major_rows,
        pii_exported_columns = EXCLUDED.pii_exported_columns,
        loaded_at = now()
    `,
    [JSON.stringify(rows)]
  );
  await client.query(
    `
      DELETE FROM admissions_dw.admission_round_source_data_quality q
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_to_recordset($1::jsonb) AS active(source_file TEXT)
        WHERE active.source_file = q.source_file
      )
    `,
    [JSON.stringify(rows)]
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const facts = readCsv(factPath).map(normalizeFact);
  const quality = readCsv(qualityPath).map(normalizeQuality);
  if (facts.some((row) => row.score === null)) throw new Error("fact_admission.score cannot be null");

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(fs.readFileSync(coreSchemaPath, "utf8"));
    const continuity = await preserveExistingTokens(client, facts);
    await client.query("BEGIN");
    await stageFacts(client, facts);
    await loadDimensions(client);
    await loadFact(client);
    await loadQuality(client, quality);
    const validation = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM stage_admission_fact)::INTEGER AS staged_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission)::INTEGER AS fact_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission WHERE score IS NULL)::INTEGER AS missing_score_rows
    `);
    const result = validation.rows[0];
    if (result.staged_rows !== result.fact_rows || result.missing_score_rows !== 0) {
      throw new Error(`Fact validation failed: ${JSON.stringify(result)}`);
    }
    await client.query("COMMIT");
    await client.query(fs.readFileSync(governanceSchemaPath, "utf8"));
    console.log(
      `Preserved ${continuity.preservedApplications.toLocaleString()} existing application tokens ` +
      `and student identity on ${continuity.preservedStudents.toLocaleString()} staged rows`
    );
    console.log(`Loaded ${result.fact_rows.toLocaleString()} rows into admissions_dw.fact_admission`);
    console.log(`Loaded ${quality.length} source quality rows`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
