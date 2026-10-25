import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const base = `with base as (
 select f.student_key, y.academic_year as year, r.tcas_round_code as round, s.tcas_status as status
 from admissions_dw.fact_admission f
 join admissions_dw.dim_year y using(year_key)
 join admissions_dw.dim_tcas_round r using(round_key)
 join admissions_dw.dim_tcas_status s using(status_key)
), targets as (
 select distinct student_key, year, round from base where status = 'ผ่านการคัดเลือก'
)`;
try {
 const summary = await sql.query(base + `, people as (
 select t.student_key,t.year,t.round,
 bool_or(b.status <> 'ผ่านการคัดเลือก') as other_same_round,
 bool_or(b.status = 'ไม่เข้าระบบมาดำเนินการใดๆ') as inactive_same_round,
 bool_or(b.status = 'ยืนยันสิทธิ์') as confirmed_same_round
 from targets t join base b using(student_key,year,round) group by t.student_key,t.year,t.round
 ) select year,round,count(*)::int as passed_people,
 count(*) filter(where other_same_round)::int as with_other_same_round,
 count(*) filter(where not other_same_round)::int as only_passed_same_round,
 count(*) filter(where inactive_same_round)::int as with_inactive,
 count(*) filter(where confirmed_same_round)::int as with_confirmed
 from people group by year,round order by year,round`);
 const combinations = await sql.query(base + `, people as (
 select t.student_key,t.year,t.round,array_agg(distinct b.status order by b.status) as statuses
 from targets t join base b using(student_key,year,round) group by t.student_key,t.year,t.round
 ) select year,round,statuses,count(*)::int as people from people group by year,round,statuses order by year,round,people desc`);
 const cross = await sql.query(base + `, only_passed as (
 select t.* from targets t where not exists(select 1 from base b where b.student_key=t.student_key and b.year=t.year and b.round=t.round and b.status <> 'ผ่านการคัดเลือก')
 ) select t.year,t.round,count(*)::int as only_passed_same_round,
 count(*) filter(where exists(select 1 from base b where b.student_key=t.student_key and b.year=t.year and b.round<>t.round and b.status<>'ผ่านการคัดเลือก'))::int as with_other_status_in_other_round_same_year,
 count(*) filter(where not exists(select 1 from base b where b.student_key=t.student_key and b.status<>'ผ่านการคัดเลือก'))::int as only_passed_across_all_data
 from only_passed t group by t.year,t.round order by t.year,t.round`);
 console.log(JSON.stringify({summary,combinations,cross},null,2));
} catch(e) { console.error(e.message);process.exitCode=1; }
