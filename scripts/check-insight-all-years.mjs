import { build } from 'esbuild';
import { neon } from '@neondatabase/serverless';
import assert from 'node:assert/strict';
const built=await build({entryPoints:['app/data/repositories/insights-repository.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {getAllYearInsights}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const sql=neon(process.env.DATABASE_URL,{fullResults:true});
try {
 const result=await getAllYearInsights({query:(q,v=[])=>sql.query(q,v)});
 const overall=(await sql.query('select count(distinct student_key)::int as people from admissions_dw.fact_admission')).rows[0].people;
 for(const row of [...result.majors,...result.rounds]) {
  assert.ok(row.confirmed<=row.eligible); assert.ok(row.eligible<=row.applicants);
  const condition='majorKey' in row?'f.major_key::text=$1':'r.tcas_round_code=$1';
  const expected=(await sql.query(`select count(distinct (y.academic_year,f.student_key))::int as people from admissions_dw.fact_admission f join admissions_dw.dim_year y using(year_key) join admissions_dw.dim_tcas_round r using(round_key) where ${condition}`,['majorKey' in row?row.majorKey:row.code])).rows[0].people;
  assert.equal(row.applicants,expected);
 }
 const old=(await sql.query('select tcas_round_code as code,sum(unique_applicants)::int as annual_sum from admissions_dw.vw_admission_round_overview group by tcas_round_code order by code')).rows;
 console.log(JSON.stringify({verifiedMajorGroups:result.majors.length,verifiedRoundGroups:result.rounds.length,roundComparison:result.rounds.map(r=>({code:r.code,annualSum:old.find(x=>x.code===r.code).annual_sum,annualDistinctTotal:r.applicants,confirmed:r.confirmed,eligible:r.eligible}))},null,2));
} catch(e) {console.error(e.message);process.exitCode=1;}
