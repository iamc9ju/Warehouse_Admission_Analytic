import {build} from 'esbuild';
import {neon} from '@neondatabase/serverless';
import assert from 'node:assert/strict';
const built=await build({entryPoints:['app/data/repositories/majors-repository.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {getTcas3Scores}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const sql=neon(process.env.DATABASE_URL,{fullResults:true});
try {
 const rows=await getTcas3Scores({query:(q,v=[])=>sql.query(q,v)});
 const check=(await sql.query(`select y.academic_year as year,f.major_key::text as key,count(distinct f.student_key)::int as applicants,count(distinct f.student_key) filter(where s.tcas_status='ยืนยันสิทธิ์')::int as confirmed,avg(f.score)::float8 as applicant_avg,avg(f.score) filter(where s.tcas_status='ยืนยันสิทธิ์')::float8 as confirmed_avg from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) join admissions_dw.dim_tcas_round r using(round_key) join admissions_dw.dim_tcas_status s using(status_key) where r.tcas_round_code='TCAS3' group by y.academic_year,f.major_key`)).rows;
 for(const row of rows){const expected=check.find(x=>Number(x.year)===row.year&&x.key===row.majorKey);assert.ok(expected);assert.equal(row.applicants,expected.applicants);assert.equal(row.confirmed,expected.confirmed);for(const [a,b] of [['applicantAvgScore','applicant_avg'],['confirmedAvgScore','confirmed_avg']]){if(row[a]===null)assert.equal(expected[b],null);else assert.ok(Math.abs(row[a]-expected[b])<0.00001);}}
 console.log(JSON.stringify({groupsVerified:rows.length,example:rows.find(r=>r.name==='วิศวกรรมเครื่องกล'&&r.year===2569&&r.type==='ภาคปกติ')},null,2));
} catch(e){console.error(e.message);process.exitCode=1}
