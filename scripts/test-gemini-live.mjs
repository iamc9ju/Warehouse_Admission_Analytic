import {build} from 'esbuild';
import {neon} from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL,{fullResults:true});
globalThis.__geminiSmokeDb={query:(q,v=[])=>sql.query(q,v)};
const built=await build({stdin:{contents:"export {readWarehouse} from './app/ai-analysis/data.ts'; export {prepareInput} from './app/ai-analysis/analysis.ts'; export {generateWithGemini} from './app/ai-analysis/gemini.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'live-db',setup(p){p.onResolve({filter:/neon-client$/},()=>({path:'db',namespace:'audit'}));p.onLoad({filter:/.*/,namespace:'audit'},()=>({contents:'export async function connectNeon(){return globalThis.__geminiSmokeDb;}'}));}}]});
const started=Date.now();
const originalFetch=globalThis.fetch;
try {
 const api=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
 const warehouse=await api.readWarehouse();
 const scope={startYear:Math.min(...warehouse.availableYears),endYear:Math.max(...warehouse.availableYears)};
 const input=api.prepareInput(warehouse.facts,warehouse.dataLoadedAt,scope);
 console.log(JSON.stringify({stage:'input-ready',scope,facts:input.facts.length}));
 let calls=0;
 globalThis.fetch=async(...args)=>{
  const response=await originalFetch(...args);
  if(String(args[0]).startsWith('https://generativelanguage.googleapis.com/'))console.log(JSON.stringify({stage:'provider-response',attempt:++calls,httpStatus:response.status,seconds:Math.round((Date.now()-started)/1000)}));
  return response;
 };
 const report=await api.generateWithGemini(input);
 console.log(JSON.stringify({stage:'success',model:report.model,sections:report.content.sections.length,seconds:Math.round((Date.now()-started)/1000),savedToDatabase:false}));
} catch(e){console.error(JSON.stringify({stage:'failed',message:e.message,seconds:Math.round((Date.now()-started)/1000)}));process.exitCode=1}finally{globalThis.fetch=originalFetch;delete globalThis.__geminiSmokeDb;}
