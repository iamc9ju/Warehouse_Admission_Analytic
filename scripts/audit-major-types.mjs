import pg from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows: counts } = await client.query(`select count(*) as facts,
    count(*) filter (where p.program_type is distinct from m.major_type) as mismatches
    from admissions_dw.fact_admission f
    join admissions_dw.dim_major m using (major_key)
    left join admissions_dw.dim_program_type p using (program_type_key)`);
  const { rows: majors } = await client.query(`select m.major_key, m.major_id, m.major_name, m.major_type,
    array_agg(distinct p.program_type) as fact_types, count(f.admission_key) as records
    from admissions_dw.dim_major m left join admissions_dw.fact_admission f using (major_key)
    left join admissions_dw.dim_program_type p using (program_type_key)
    group by m.major_key order by m.major_key`);
  const { rows: views } = await client.query(`select viewname, definition from pg_views where schemaname='admissions_dw'`);
  await mkdir('outputs/migrations', { recursive: true });
  await writeFile('outputs/migrations/major-types-before.json', JSON.stringify({ counts, majors, views }, null, 2));
  console.log(JSON.stringify({ counts, majors, dependentViews: views.filter(v => /dim_program_type|program_type_key/.test(v.definition)).map(v => v.viewname) }, null, 2));
} finally { await client.end(); }
