import { neon } from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
try {
 const rows=await sql.query(`select y.academic_year as year,r.tcas_round_code as round,
 count(distinct f.student_key) filter(where s.tcas_status='ผ่านการคัดเลือก')::int as passed,
 count(distinct f.student_key) filter(where s.tcas_status='ไม่เข้าระบบมาดำเนินการใดๆ')::int as inactive,
 count(distinct f.student_key) filter(where s.tcas_status='ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2')::int as passed_no_reprocess,
 count(distinct f.student_key) filter(where s.tcas_status in ('ผ่านการคัดเลือก','ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'))::int as passed_combined,
 count(distinct f.student_key) filter(where s.tcas_status='ไม่ใช้สิทธิ์')::int as unused,
 count(distinct f.student_key)::int as applicants
 from admissions_dw.fact_admission f
 join admissions_dw.dim_year y using(year_key)
 join admissions_dw.dim_tcas_round r using(round_key)
 join admissions_dw.dim_tcas_status s using(status_key)
 group by y.academic_year,r.tcas_round_code order by year,round`);
 console.log(JSON.stringify(rows,null,2));
 const fields=await sql.query(`select table_name,column_name from information_schema.columns where table_schema='admissions_dw' and (table_name='fact_admission' or table_name like '%source%') order by table_name,ordinal_position`);
 console.log('SOURCE_FIELDS',JSON.stringify(fields));
} catch(e){console.error(e.message);process.exitCode=1}
