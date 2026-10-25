import { neon } from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
try {
 const counts=await sql.query(`with b as (
 select f.student_key,y.academic_year as year,r.tcas_round_code as round,f.major_key,s.tcas_status as status
 from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key)
 join admissions_dw.dim_tcas_round r using(round_key) join admissions_dw.dim_tcas_status s using(status_key)
 ), p as (select year,round,student_key,count(distinct status) as statuses from b group by year,round,student_key)
 select year,count(*) filter(where statuses>1)::int as people_rounds_multiple_statuses from p group by year order by year`);
 console.log('MULTIPLE_STATUSES',JSON.stringify(counts));
 const totals=await sql.query(`select y.academic_year as year,count(*)::int as rows,count(distinct f.student_key)::int as distinct_people from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) group by y.academic_year order by year`);
 const all=await sql.query(`select count(distinct student_key)::int as all_year_distinct from admissions_dw.fact_admission`);
 console.log('TOTALS',JSON.stringify({totals,all}));
 const checks=await sql.query(`with b as (
 select y.academic_year,f.major_key,r.tcas_round_code,f.student_key,s.tcas_status
 from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) join admissions_dw.dim_tcas_round r using(round_key) join admissions_dw.dim_tcas_status s using(status_key)
 ), expected as (
 select academic_year,tcas_round_code,count(distinct student_key) as applicants,count(*) as choices from b group by academic_year,tcas_round_code
 ) select count(*)::int as groups_checked,count(*) filter(where e.applicants<>v.unique_applicants or e.choices<>v.choices)::int as mismatches
 from expected e join admissions_dw.vw_admission_round_overview v using(academic_year,tcas_round_code)`);
 console.log('ROUND_CHECK',JSON.stringify(checks));
 const rights=await sql.query(`with b as (
 select y.academic_year as year,r.tcas_round_code as round,f.major_key,f.student_key,
 case when s.tcas_status='ยืนยันสิทธิ์' then 'confirmed'
 when s.tcas_status in ('สละสิทธิ์','สละสิทธิ์ในรอบ 2') then 'resigned'
 when s.tcas_status='ไม่ใช้สิทธิ์' then 'unused'
 when s.tcas_status='ไม่เข้าระบบมาดำเนินการใดๆ' then 'inactive'
 when s.tcas_status='ยืนยันที่อื่นแล้ว' then 'elsewhere' else 'other' end as category
 from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) join admissions_dw.dim_tcas_round r using(round_key) join admissions_dw.dim_tcas_status s using(status_key)
 where s.tcas_status in ('ยืนยันสิทธิ์','สละสิทธิ์','สละสิทธิ์ในรอบ 2','ไม่ใช้สิทธิ์','ไม่เข้าระบบมาดำเนินการใดๆ','ยืนยันที่อื่นแล้ว','ผ่านการคัดเลือก','ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2')
 ), expanded as (select b.*,g.grain,g.entity from b cross join lateral(values ('round',round),('major',major_key::text))g(grain,entity)), p as (
 select year,grain,entity,student_key,count(distinct category) as categories,bool_or(category='confirmed') as confirmed from expanded group by year,grain,entity,student_key
 )select year,grain,count(*)::int as eligible_group_memberships,count(*) filter(where categories>1)::int as excluded_multiple,count(*) filter(where categories>1 and confirmed)::int as confirmed_excluded from p group by year,grain order by year,grain`);
 console.log('RIGHTS_EXCLUSIONS',JSON.stringify(rights));
 const defs=await sql.query(`select viewname,definition from pg_views where schemaname='admissions_dw' and viewname='vw_admission_year_overview'`);
 console.log('YEAR_DEFINITION',JSON.stringify(defs));
 const majorCheck=await sql.query(`with e as (select y.academic_year,f.major_key,count(distinct student_key) as applicants,count(*) as choices from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) group by y.academic_year,f.major_key)
 select count(*)::int as groups_checked,count(*) filter(where e.applicants<>m.applicant_count or e.choices<>m.application_choices)::int as mismatches from e join admissions_dw.mart_major_conversion m using(academic_year,major_key)`);
 console.log('MAJOR_CHECK',JSON.stringify(majorCheck));
} catch(e){console.error(e.message);process.exitCode=1}
