import { neon } from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
try {
const rows=await sql.query(`with b as (
 select y.academic_year as year,m.major_key,m.major_name,m.major_type,f.student_key,
 case when s.tcas_status='ยืนยันสิทธิ์' then 'confirmed'
 when s.tcas_status in ('สละสิทธิ์','สละสิทธิ์ในรอบ 2') then 'resigned'
 when s.tcas_status='ไม่ใช้สิทธิ์' then 'unused'
 when s.tcas_status='ไม่เข้าระบบมาดำเนินการใดๆ' then 'inactive'
 when s.tcas_status='ยืนยันที่อื่นแล้ว' then 'elsewhere' else 'other' end as category
 from admissions_dw.fact_admission f
 join admissions_dw.dim_year y using(year_key) join admissions_dw.dim_major m using(major_key)
 join admissions_dw.dim_tcas_status s using(status_key)
 where s.tcas_status in ('ยืนยันสิทธิ์','สละสิทธิ์','สละสิทธิ์ในรอบ 2','ไม่ใช้สิทธิ์','ไม่เข้าระบบมาดำเนินการใดๆ','ยืนยันที่อื่นแล้ว','ผ่านการคัดเลือก','ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2')
), p as (
 select year,major_key,major_name,major_type,student_key,count(distinct category) as groups,
 bool_or(category='confirmed') as confirmed,array_agg(distinct category order by category) as categories
 from b group by year,major_key,major_name,major_type,student_key
)
select year,major_name,major_type,count(*)::int as eligible_normal,
 count(*) filter(where groups=1)::int as eligible_rights_chart,
 count(*) filter(where confirmed)::int as confirmed_normal,
 count(*) filter(where confirmed and groups=1)::int as confirmed_rights_chart,
 count(*) filter(where groups>1)::int as hidden_multiple,
 jsonb_agg(distinct categories) filter(where groups>1) as conflicting_groups
 from p group by year,major_key,major_name,major_type
 having count(*) filter(where groups>1)>0 order by year,major_name,major_type`);
console.log(JSON.stringify(rows,null,2));
} catch(e){console.error(e.message);process.exitCode=1}
