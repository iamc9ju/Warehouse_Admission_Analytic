import { build } from 'esbuild';
import { neon } from '@neondatabase/serverless';
import assert from 'node:assert/strict';
const built=await build({entryPoints:['app/data/repositories/rounds-repository.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {getRightsOutcomes}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const sql=neon(process.env.DATABASE_URL,{fullResults:true});
try {
 const client={query:(q,v=[])=>sql.query(q,v)};
 const [major,round]=await Promise.all([getRightsOutcomes(client,'major'),getRightsOutcomes(client,'round')]);
 const m=(await sql.query(`select major_key::text as code,academic_year as year,major_name,applicant_count,eligible_count,confirmed_count from admissions_dw.mart_major_conversion`)).rows;
 const r=(await sql.query(`select tcas_round_code as code,academic_year as year,eligible_applicants as eligible,confirmed_applicants as confirmed from admissions_dw.vw_admission_round_overview`)).rows;
 for(const row of major){const expected=m.find(x=>x.code===row.code&&Number(x.year)===row.year);assert.equal(row.eligible,Number(expected.eligible_count));assert.equal(row.confirmed,Number(expected.confirmed_count));}
 for(const row of round){const expected=r.find(x=>x.code===row.code&&Number(x.year)===row.year);assert.equal(row.eligible,Number(expected.eligible));assert.equal(row.confirmed,Number(expected.confirmed));}
 const mechanical=m.find(x=>x.major_name==='วิศวกรรมเครื่องกล'&&Number(x.year)===2569);
 const example=major.find(x=>x.code===mechanical.code&&x.year===2569);
 assert.equal(example.eligible,79);assert.equal(example.confirmed,51);assert.equal(example.multiple,1);
 console.log(JSON.stringify({verifiedMajorGroups:major.length,verifiedRoundGroups:round.length,mechanical2569:example},null,2));
} catch(e){console.error(e.message);process.exitCode=1}
