import {build} from 'esbuild';
import {neon} from '@neondatabase/serverless';
import assert from 'node:assert/strict';
const sql=neon(process.env.DATABASE_URL,{fullResults:true});
globalThis.__rightsAuditDb={query:(q,v=[])=>sql.query(q,v)};
const built=await build({stdin:{contents:"export {readWarehouse} from './app/ai-analysis/data.ts'; export {getRightsOutcomes} from './app/data/repositories/rounds-repository.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'read-only-client',setup(p){p.onResolve({filter:/neon-client$/},()=>({path:'db',namespace:'audit'}));p.onLoad({filter:/.*/,namespace:'audit'},()=>({contents:'export async function connectNeon(){return globalThis.__rightsAuditDb;}'}));}}]});
try {
 const {readWarehouse,getRightsOutcomes}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
 const warehouse=await readWarehouse();
 let checked=0;
 for(const grain of ['major','round']){
 const chart=await getRightsOutcomes(globalThis.__rightsAuditDb,grain);
 for(const row of chart){
  const fact=warehouse.facts.find(f=>f.grain===grain&&f.year===row.year&&f.key===row.code);
  assert.ok(fact);
  for(const key of ['eligible','confirmed','resigned','unused','inactive','elsewhere','other','multiple'])assert.equal(fact.rightsOutcomes[key],row[key]);
  checked++;
 }}
 const example=warehouse.facts.find(f=>f.grain==='major'&&f.year===2569&&f.name==='วิศวกรรมเครื่องกล'&&f.programType==='ภาคปกติ');
 assert.equal(example.rightsOutcomes.eligible,79);assert.equal(example.rightsOutcomes.confirmed,51);
 console.log(JSON.stringify({factsValidated:warehouse.facts.length,chartGroupsMatched:checked,mechanical2569:example.rightsOutcomes},null,2));
} catch(e){console.error(e.message);process.exitCode=1} finally {delete globalThis.__rightsAuditDb;}
