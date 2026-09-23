import pg from 'pg';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const mode = process.argv[2];
if (!['expand', 'finalize'].includes(mode)) throw new Error('Use expand or finalize');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const canonical = rows => rows.map(row => JSON.stringify(Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'major_key').sort(([a], [b]) => a.localeCompare(b))))).sort();
const quote = value => '"' + value.replaceAll('"', '""') + '"';
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query('LOCK TABLE admissions_dw.fact_admission, admissions_dw.dim_major, admissions_dw.dim_program_type IN SHARE ROW EXCLUSIVE MODE');
  const check = await client.query(`select count(*) as facts, count(*) filter (where p.program_type is distinct from m.major_type) as mismatches
    from admissions_dw.fact_admission f join admissions_dw.dim_major m using(major_key)
    left join admissions_dw.dim_program_type p using(program_type_key)`);
  assert.equal(check.rows[0].mismatches, '0', 'Conflicting program types: abort');
  const views = (await client.query("select viewname from pg_views where schemaname='admissions_dw' order by viewname")).rows;
  const before = {};
  for (const { viewname } of views) before[viewname] = canonical((await client.query(`select * from admissions_dw.${quote(viewname)}`)).rows);
  if (mode === 'expand') {
    const types = (await client.query('select * from admissions_dw.dim_program_type order by program_type_key')).rows;
    await writeFile('outputs/migrations/program-types-backup.json', JSON.stringify(types, null, 2));
    await client.query(await readFile('outputs/sql/migrate_major_identity.sql', 'utf8'));
  } else {
    const dependencies = (await client.query("select viewname from pg_views where schemaname='admissions_dw' and (definition like '%dim_program_type%' or definition like '%program_type_key%')")).rows;
    assert.equal(dependencies.length, 0, 'Views still depend on program type dimension');
    // RESTRICT is intentional: unknown dependencies must abort, never cascade.
    await client.query('ALTER TABLE admissions_dw.fact_admission DROP COLUMN program_type_key RESTRICT');
    await client.query('DROP TABLE admissions_dw.dim_program_type RESTRICT');
  }
  for (const { viewname } of views) assert.deepEqual(canonical((await client.query(`select * from admissions_dw.${quote(viewname)}`)).rows), before[viewname], `Metrics changed in ${viewname}`);
  const duplicates = await client.query('select major_key, academic_year from admissions_dw.mart_major_conversion group by major_key, academic_year having count(*) > 1');
  assert.equal(duplicates.rows.length, 0);
  const factsAfter = (await client.query('select count(*) as facts from admissions_dw.fact_admission')).rows[0].facts;
  assert.equal(factsAfter, check.rows[0].facts);
  await client.query('COMMIT');
  console.log(JSON.stringify({ mode, facts: factsAfter, unchangedViews: views.length, result: 'committed' }));
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
