// Run after build and ai:migrate. --generate explicitly spends one Gemini request.
// Only prints aggregate validation metadata, never credentials or provider error bodies.
import assert from "node:assert/strict";
import pg from "pg";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const { default: app } = await import("../dist/server/index.js");
const call = (path, options) => app(new Request(`http://localhost${path}`, options));
const yearArgument=process.argv.indexOf("--years");
const selection=yearArgument<0 ? "" : `?startYear=${Number(process.argv[yearArgument+1])}&endYear=${Number(process.argv[yearArgument+2])}`;
const initialResponse = await call(`/api/ai-analysis${selection}`);
const initial = await initialResponse.json();
assert.equal(initialResponse.status,200,JSON.stringify(initial));
console.log(JSON.stringify({ phase:"read", years:initial.availableYears, configured:initial.configured, existingReport:initial.report?.id??null }));
let id=initial.report?.id;
if(process.argv.includes("--generate")){
  const start=Date.now();
  const response=await call("/api/ai-analysis",{method:"POST",headers:{"Content-Type":"application/json",origin:"http://localhost"},body:JSON.stringify(initial.scope)});
  const generated=await response.json();
  assert.equal(response.status,201,JSON.stringify(generated));
  id=generated.report.id;
  assert.equal(generated.report.content.sections.length,7);
  const expectedYears=generated.report.input.facts.filter(f=>f.grain==="year").map(f=>f.year).sort();
  for(const section of generated.report.content.sections){assert.deepEqual(section.yearSummaries.map(s=>s.year).sort(),expectedYears);}
  console.log(JSON.stringify({phase:"coverage",sections:generated.report.content.sections.map(s=>({title:s.title,years:s.yearSummaries.map(y=>y.year)}))}));
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
  try{
    const {rows}=await pool.query("select academic_year,unique_applicants,eligible_applicants,confirmed_applicants from admissions_dw.mart_admissions_executive_summary order by academic_year");
    for(const f of generated.report.input.facts.filter(f=>f.grain==="year")){
      const row=rows.find(r=>Number(r.academic_year)===f.year);assert.ok(row);
      assert.equal(f.applicants,Number(row.unique_applicants));assert.equal(f.eligible,Number(row.eligible_applicants));assert.equal(f.confirmed,Number(row.confirmed_applicants));
    }
    const bundled=await build({entryPoints:[fileURLToPath(new URL("../app/data/repositories/rounds-repository.ts",import.meta.url))],bundle:true,platform:"node",format:"esm",write:false});
    const {getRightsOutcomes}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
    for(const grain of ["round","major"]){
      const expected=await getRightsOutcomes(pool,grain);
      for(const f of generated.report.input.facts.filter(f=>f.grain===grain)){
        const original=expected.find(r=>r.year===f.year && r.code===f.key);
        if(f.eligible===0){assert.equal(f.rightsOutcomes.eligible,0);continue;}
        assert.ok(original);
        for(const [key,value] of Object.entries(f.rightsOutcomes))assert.equal(value,original[key],`${f.id}:${key}`);
      }
    }
    for(const f of generated.report.input.facts){assert.ok(f.statuses.length>0);assert.equal(Object.entries(f.rightsOutcomes).filter(([key])=>key!=="eligible").reduce((sum,[,n])=>sum+n,0),f.eligible);}
  }finally{await pool.end();}
  console.log(JSON.stringify({phase:"generated",id,model:generated.report.model,sections:7,seconds:Math.round((Date.now()-start)/100)/10,facts:generated.report.input.facts.length,signals:generated.report.input.signals.length,yearTotalsMatchDashboard:true,rightsMatchExistingRepository:true}));
}
if(id){
  const second=await call(`/api/ai-analysis?startYear=${initial.scope.startYear}&endYear=${initial.scope.endYear}`);
  const persisted=await second.json();assert.equal(persisted.report.id,id);
  const originalFetch=globalThis.fetch;
  globalThis.fetch=(url,...args)=>{if(String(url).includes("generativelanguage.googleapis.com"))throw Error("Read unexpectedly called Gemini");return originalFetch(url,...args);};
  try{const readAgain=await call(`/api/ai-analysis?startYear=${initial.scope.startYear}&endYear=${initial.scope.endYear}&reportId=${id}`);assert.equal((await readAgain.json()).report.id,id);}finally{globalThis.fetch=originalFetch;}
  console.log(JSON.stringify({phase:"persisted",id,readWithoutGemini:true}));
}
const page=await call("/ai-analysis");assert.equal(page.status,200);const html=await page.text();assert.match(html,/AI Analysis/);assert.ok(!html.includes("TCAS DW AI Assistant"));
const retired=await call("/api/chat");assert.equal(retired.status,404);
console.log(JSON.stringify({phase:"routes",analysis:200,oldChat:404}));
