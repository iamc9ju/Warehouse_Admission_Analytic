import pg from 'pg';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const names = ['vw_admission_year_overview', 'vw_admission_round_overview', 'mart_major_conversion'];
const oldToken = "'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'::text";
const newToken = `${oldToken}, 'ไม่เข้าระบบมาดำเนินการใดๆ'::text`;
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '10s'");
  const views = (await client.query("select viewname, definition from pg_views where schemaname = 'admissions_dw' and viewname = ANY($1::text[])", [names])).rows;
  assert.equal(views.length, names.length);
  const before = {};
  for (const { viewname } of views) before[viewname] = (await client.query(`select * from admissions_dw.${viewname}`)).rows;
  await mkdir('outputs/migrations', { recursive: true });
  await writeFile('outputs/migrations/eligible-inactive-before.json', JSON.stringify({ views, before }, null, 2));
  for (const { viewname, definition } of views) {
    if (definition.includes(newToken)) continue;
    assert.equal(definition.split(oldToken).length, 2);
    await client.query(`CREATE OR REPLACE VIEW admissions_dw.${viewname} AS ${definition.replace(oldToken, newToken)}`);
  }
  // Every field except eligible counts must remain unchanged.
  const canonical = rows => rows.map(row => JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('eligible')).sort(([a], [b]) => a.localeCompare(b))))).sort();
  for (const name of names) {
    const after = (await client.query(`select * from admissions_dw.${name}`)).rows;
    assert.deepEqual(canonical(after), canonical(before[name]), `Unexpected metric change: ${name}`);
  }
  const actual = (await client.query('select academic_year, eligible_applicants from admissions_dw.mart_admissions_executive_summary order by academic_year')).rows;
  const expected = (await client.query(`select y.academic_year, count(distinct f.student_key) as eligible_applicants
    from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key)
    join admissions_dw.dim_tcas_status s using(status_key)
    where s.tcas_status = ANY($1::text[]) group by y.academic_year order by y.academic_year`, [[
    'ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2', 'ยืนยันที่อื่นแล้ว', 'ไม่ใช้สิทธิ์',
    'ผ่านการคัดเลือก', 'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2', 'ไม่เข้าระบบมาดำเนินการใดๆ',
  ]])).rows;
  assert.deepEqual(actual, expected);
  await client.query('COMMIT');
  console.log(JSON.stringify({ result: 'committed', years: actual }));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
