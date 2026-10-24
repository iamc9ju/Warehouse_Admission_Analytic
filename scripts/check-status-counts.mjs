import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import pg from "pg";

const bundled = await build({entryPoints:[fileURLToPath(new URL("../app/ai-analysis/status-metrics.ts",import.meta.url))],bundle:true,platform:"node",format:"esm",write:false});
const {statusMetrics} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
const {default:app} = await import("../dist/server/index.js");
const response=await app(new Request("http://localhost/api/ai-analysis?startYear=2567&endYear=2569"));
assert.equal(response.status,200);
const state=await response.json();
assert.ok(state.report,"A saved three-year report is required");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
try{
  const {rows}=await pool.query("select academic_year,resigned_applicants from admissions_dw.mart_admissions_executive_summary order by academic_year");
  const checked=[];
  for(const row of rows){
    const fact=state.report.input.facts.find(f=>f.grain==="year" && f.year===Number(row.academic_year));
    assert.ok(fact?.statuses,"Saved report needs status details");
    const count=statusMetrics(fact).resigned;
    assert.equal(count,Number(row.resigned_applicants));
    checked.push({year:fact.year,displayedResigned:count,matchesDashboard:true});
  }
  console.log(JSON.stringify({checked,geminiCalls:0}));
}finally{await pool.end();}
