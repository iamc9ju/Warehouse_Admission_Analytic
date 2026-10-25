import { neon } from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
try {
 const rows=await sql.query(`with base as (
 select f.student_key,y.academic_year as year,r.tcas_round_code as round,r.tcas_round_name as round_name,
 m.major_name,m.major_type,s.tcas_status as status,f.source_file,f.source_row_number,
 case when s.tcas_status='ยืนยันสิทธิ์' then 'confirmed'
 when s.tcas_status in ('สละสิทธิ์','สละสิทธิ์ในรอบ 2') then 'resigned'
 when s.tcas_status='ไม่ใช้สิทธิ์' then 'unused'
 when s.tcas_status='ไม่เข้าระบบมาดำเนินการใดๆ' then 'inactive'
 when s.tcas_status='ยืนยันที่อื่นแล้ว' then 'elsewhere'
 when s.tcas_status in ('ผ่านการคัดเลือก','ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2') then 'other' end as category
 from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key)
 join admissions_dw.dim_tcas_round r using(round_key) join admissions_dw.dim_major m using(major_key)
 join admissions_dw.dim_tcas_status s using(status_key)
 where y.academic_year=2569 and m.major_name='วิศวกรรมเครื่องกล' and m.major_type='ภาคปกติ'
 ), targets as (
 select student_key from base group by student_key having count(distinct category)>1
 ) select b.year,b.round,b.round_name,b.major_name,b.major_type,b.status,b.source_file,b.source_row_number
 from base b join targets t using(student_key) order by b.round,b.source_file,b.source_row_number`);
 console.log(JSON.stringify(rows,null,2));
} catch(e){console.error(e.message);process.exitCode=1}
