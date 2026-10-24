import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const result = await build({
  stdin: { contents: `export * from './app/ai-analysis/analysis'; export * from './app/ai-analysis/gemini'; export * from './app/ai-analysis/report-types'; export * from './app/ai-analysis/report-service'; export * from './app/ai-analysis/status-metrics'; export {GET,POST} from './app/api/ai-analysis/route';`, resolveDir: fileURLToPath(new URL("..", import.meta.url)) },
  bundle: true, platform: "node", format: "esm", write: false,
  plugins: [{ name: "fake-database", setup(p) {
    p.onResolve({ filter: /^next\/server$/ }, () => ({ path: "next", namespace: "next-mock" }));
    p.onLoad({ filter: /.*/, namespace: "next-mock" }, () => ({ contents: `export const NextResponse = {json: (value, init) => Response.json(value, init)};` }));
    p.onResolve({ filter: /neon-client$/ }, () => ({ path: "db", namespace: "mock" }));
    p.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: `export async function connectNeon() { return globalThis.__aiTestDb; }` }));
  } }],
});
const api = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

function fact(year, grain = "year", key = "all", applicants = 100, confirmed = 20) {
  return { id: `${grain}:${year}:${key}`, grain, year, key, name: key, programType: "ปกติ", applicants, choices: applicants + 10, eligible: 50, confirmed, rate: confirmed / applicants * 100, eligibleRate: confirmed * 2, avgScore: 60,
    resigned: 5, statuses: [{label:"สละสิทธิ์",applicants:5,choices:6},{label:"ไม่เข้าระบบมาดำเนินการใดๆ",applicants:3,choices:3}],
    rightsOutcomes: {eligible:50,confirmed:20,resigned:5,unused:4,inactive:3,elsewhere:6,other:7,multiple:5},
  };
}
const facts = [fact(2567), fact(2568), fact(2569), fact(2568,"major","A",100,20), fact(2569,"major","A",80,8), fact(2568,"major","B",10,2), fact(2569,"major","B",20,4), fact(2569,"round","TCAS1")];
const scope = { startYear: 2569, endYear: 2569 };
const input = api.prepareInput(facts, "2026-10-24T00:00:00.000Z", scope);
const content = (source=input) => ({ sections: api.SECTION_TITLES.map(title => ({ title,
  yearSummaries: source.facts.filter(f=>f.grain==="year").map(f=>({year:f.year,observation:`ปี ${f.year} ไม่พบข้อสรุปนอกเหนือจากข้อมูลตามเกณฑ์`,evidenceIds:source.facts.filter(row=>row.year===f.year).map(row=>row.id)})),
  items: [{ observation: `ภาพรวมช่วง ${source.scope.startYear}–${source.scope.endYear}`, interpretation: "ต้องตรวจข้อมูลเพิ่มก่อนสรุปสาเหตุ", recommendation: "ตรวจนิยามข้อมูล", evidenceIds: source.facts.filter(f=>f.grain==="year").map(f=>f.id) }] })) });

test("single-year input excludes prior years and cross-year signals; fingerprint detects selected data changes", () => {
  assert.equal(input.baselineYear,null);
  assert.ok(input.facts.every(f => f.year === 2569));
  assert.ok(input.signals.every(s => s.applicantChangePct === undefined && s.rateChangePp === undefined));
  assert.ok(input.signals.flatMap(s => s.evidenceIds).every(id => input.facts.some(f => f.id === id)));
  assert.equal(api.prepareInput([...facts].reverse(), "2026-10-25T00:00:00Z",scope).fingerprint,input.fingerprint,"reload without a content change should not invalidate reports");
  const changed = facts.map(f => f.id === "year:2569:all" ? {...f, applicants:101} : f);
  assert.notEqual(api.prepareInput(changed,input.dataLoadedAt,scope).fingerprint,input.fingerprint);
  const outsideChanged = facts.map(f => f.year === 2568 ? {...f, applicants:999} : f);
  assert.equal(api.prepareInput(outsideChanged,input.dataLoadedAt,scope).fingerprint,input.fingerprint,"changes outside the selection cannot affect this report");
  assert.throws(() => api.prepareInput(facts,input.dataLoadedAt,{startYear:2570,endYear:2570}));
});

test("signals use adjacent years, matching major keys and a minimum sample", () => {
  const multi = api.prepareInput(facts,input.dataLoadedAt,{startYear:2568,endYear:2569});
  assert.ok(multi.facts.every(f => f.year >= 2568 && f.year <= 2569));
  assert.equal(multi.baselineYear,null);
  const change = multi.signals.find(s => s.name.startsWith("A") && s.applicantChangePct !== undefined);
  assert.equal(change.applicantChangePct,-20);
  assert.equal(change.rateChangePp,-24);
  assert.ok(!multi.signals.some(s => s.name.startsWith("B")),"small bases cannot become growth alerts");
  assert.ok(!api.computeSignals(facts,scope).some(s => s.applicantChangePct !== undefined),"even direct signal calls cannot compare outside scope");
  const gap = api.computeSignals([fact(2567,"major","A"),fact(2569,"major","A",50,5)],scope);
  assert.equal(gap.length,0,"missing prior year cannot be labelled year-over-year");
});

test("conversion alerts use eligible denominators and skip zero-denominator rates",()=>{
  const scoped={startYear:2568,endYear:2569};
  const older={...fact(2568,"major","A"),rate:10,eligibleRate:80};
  const newer={...fact(2569,"major","A"),rate:90,eligibleRate:60};
  const signals=api.computeSignals([older,newer],scoped);
  assert.equal(signals.find(s=>s.kind==="watch").rateChangePp,-20);
  assert.ok(!signals.some(s=>s.kind==="positive"));
  assert.equal(api.computeSignals([{...older,eligibleRate:null},{...newer,eligibleRate:null}],scoped).length,0);
  const wrong=content();wrong.sections[0].items[0].observation="คิดเป็นอัตรายืนยันต่อผู้สมัคร 15.63%";
  assert.throws(()=>api.validateContent(wrong,input),/ต่อผู้มีสิทธิ์/);
});

test("definitions include inactive rights holders and warn about overlapping people", () => {
  assert.ok(api.ELIGIBLE_STATUSES.includes("ไม่เข้าระบบมาดำเนินการใดๆ"));
  assert.equal(api.ELIGIBLE_STATUSES.length,8);
  assert.match(api.DEFINITIONS.overlap,/ห้ามบวก/);
  assert.match(api.DEFINITIONS.rate,/ผู้สมัคร/);
});

test("status counts use dashboard totals, never exclusive buckets or sums of overlapping statuses", () => {
  for(const [year,total,exclusive] of [[2567,30,28],[2568,32,31],[2569,32,31]]){
    const f={...fact(year),resigned:total,statuses:[{label:"สละสิทธิ์",applicants:total,choices:total},{label:"สละสิทธิ์ในรอบ 2",applicants:2,choices:2},{label:"ไม่ใช้สิทธิ์",applicants:30,choices:30}],rightsOutcomes:{...fact(year).rightsOutcomes,resigned:exclusive,unused:27}};
    assert.equal(api.statusMetrics(f).resigned,total);
    assert.equal(api.statusMetrics(f).unused,30);
  }
  assert.ok(!api.STATUS_COLUMNS.some(([,label])=>label === "ผ่านคัดเลือกอื่น"));
  const old={...fact(2569)};delete old.statuses;delete old.resigned;
  assert.equal(api.statusMetrics(old).resigned,undefined);
  assert.equal(api.statusMetrics(old).unused,undefined);
});

test("status data reaches Gemini unchanged, changes invalidate reports, removed section cannot return", () => {
  assert.ok(api.SECTION_TITLES.includes("การใช้สิทธิ์และสถานะที่ควรติดตาม"));
  assert.ok(!api.SECTION_TITLES.includes("ข้อจำกัดและข้อมูลที่ควรเก็บเพิ่ม"));
  assert.equal(input.facts[0].rightsOutcomes.multiple,5);
  const changed=facts.map(f=>({...f,statuses:f.statuses.map(s=>({...s,applicants:s.applicants+1}))}));
  assert.notEqual(api.prepareInput(changed,input.dataLoadedAt,scope).fingerprint,input.fingerprint);
  const multi=api.prepareInput(facts,input.dataLoadedAt,{startYear:2568,endYear:2569});
  assert.throws(()=>api.validateContent(content(),multi),/ไม่ครบทุกปี/);
});

test("API rejects invalid requests and cross-origin generation before contacting providers", async () => {
  const request = (body, origin="http://localhost") => new Request("http://localhost/api/ai-analysis", {method:"POST",headers:{"Content-Type":"application/json",origin},body});
  assert.equal((await api.POST(request("{}","https://other.example"))).status,403);
  for(const body of ["{", "null", JSON.stringify({startYear:2569,endYear:2567}), JSON.stringify({startYear:"2569",endYear:2569})]) {
    assert.equal((await api.POST(request(body))).status,400);
  }
  const response=await api.GET(new Request("http://localhost/api/ai-analysis?reportId=not-a-uuid"));
  assert.equal(response.status,400);
  assert.equal(response.headers.get("cache-control"),"no-store");
});

test("every section must summarize each selected year with matching evidence, not just cite earlier years",()=>{
  const multi=api.prepareInput(facts,input.dataLoadedAt,{startYear:2567,endYear:2569});
  assert.equal(api.validateContent(content(multi),multi).sections.length,7);
  for(let section=0;section<7;section++){
    const latestOnly=content(multi);latestOnly.sections[section].yearSummaries=latestOnly.sections[section].yearSummaries.filter(s=>s.year===2569);
    assert.throws(()=>api.validateContent(latestOnly,multi),/ไม่ครบทุกปี/);
  }
  const mislabeled=content(multi);mislabeled.sections[0].yearSummaries[0].observation="ปี 2569 มีผู้สมัคร";
  assert.throws(()=>api.validateContent(mislabeled,multi),/ต้องอธิบายปี/);
  const wrongEvidence=content(multi);wrongEvidence.sections[0].yearSummaries[0].evidenceIds=["year:2569:all"];
  assert.throws(()=>api.validateContent(wrongEvidence,multi),/หลักฐานรายปี/);
  const duplicate=content(multi);duplicate.sections[0].yearSummaries[0]=duplicate.sections[0].yearSummaries[1];
  assert.throws(()=>api.validateContent(duplicate,multi),/ไม่ครบทุกปี/);
  const latestNarrative=content(multi);latestNarrative.sections[0].items[0].observation="ปี 2569 มีผู้สมัคร";
  assert.throws(()=>api.validateContent(latestNarrative,multi),/ภาพรวมทั้งช่วงปี/);
});

test("rejects incomplete reports and unknown evidence instead of saving fake sources", () => {
  assert.equal(api.validateContent(content(),input).sections.length,7);
  const invalid = content(); invalid.sections[0].items[0].evidenceIds=["made-up"];
  assert.throws(() => api.validateContent(invalid,input),/อ้างอิง/);
  assert.throws(() => api.validateContent({sections:[]},input),/ไม่ครบ/);
  const noEvidence=content();noEvidence.sections[0].items[0].evidenceIds=[];
  assert.throws(() => api.validateContent(noEvidence,input),/หลักฐาน/);
  const claim=content();claim.sections[2].items[0].interpretation="ลดลงอย่างมีนัยสำคัญ";
  assert.throws(()=>api.validateContent(claim,input),/นัยสำคัญ/);
  const scoreClaim=content();scoreClaim.sections[4].items[0].recommendation="เปรียบเทียบคะแนนเฉลี่ยแต่ละรอบ";
  assert.throws(()=>api.validateContent(scoreClaim,input),/คะแนนต่างเกณฑ์/);
  const outsideYear=content();outsideYear.sections[0].items[0].interpretation="เพิ่มขึ้นจากปี 2568";
  assert.throws(()=>api.validateContent(outsideYear,input),/ปีนอกช่วง/);
});

test("Gemini uses server key in header, includes definitions, rejects truncation and provider errors", async () => {
  const original = globalThis.fetch;
  const originalKey=process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY="test-only-never-real";
  try {
    globalThis.fetch = async (url, options) => {
      assert.ok(!url.includes("test-only"));
      assert.equal(options.headers["x-goog-api-key"],"test-only-never-real");
      const body=JSON.parse(options.body);
      const sent=JSON.parse(body.contents[0].parts[0].text.slice("INPUT:\n".length));
      assert.ok(sent.facts.every(f=>f.year===2569));
      assert.equal(sent.baselineYear,null);
      assert.ok(sent.facts.every(f=>f.statuses.length > 0 && f.rightsOutcomes === undefined));
      assert.equal(sent.definitions.rightsOutcomes,undefined);
      assert.equal(sent.definitions.rate,undefined);
      assert.ok(sent.facts.every(f=>f.rate===undefined && f.eligibleRate!==undefined));
      assert.equal(sent.coveragePlan.length,7);
      assert.ok(sent.coveragePlan.every(s=>s.yearSummaries.length===1 && s.yearSummaries[0].year===2569));
      assert.match(body.contents[0].parts[0].text,/ไม่เข้าระบบมาดำเนินการใดๆ/);
      assert.equal(body.generationConfig.responseMimeType,"application/json");
      return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(content())}]}}]});
    };
    assert.equal((await api.generateWithGemini(input)).content.sections.length,7);
    const missingYear=content();missingYear.sections[0].yearSummaries=[];
    let failedAttempts=0;
    globalThis.fetch=async()=>{failedAttempts++;return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(missingYear)}]}}]});};
    await assert.rejects(api.generateWithGemini(input),/ไม่ครบทุกปี/);
    assert.equal(failedAttempts,2,"invalid content has a bounded repair attempt");
    let repairedAttempts=0;
    globalThis.fetch=async(_url,options)=>{
      repairedAttempts++;
      const sent=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text.slice("INPUT:\n".length));
      if(repairedAttempts===2)assert.match(sent.validationFeedback,/ไม่ครบทุกปี/);
      return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(repairedAttempts===1?missingYear:content())}]}}]});
    };
    assert.equal((await api.generateWithGemini(input)).content.sections.length,7);
    assert.equal(repairedAttempts,2);
    globalThis.fetch=async()=>Response.json({candidates:[{finishReason:"MAX_TOKENS"}]});
    await assert.rejects(api.generateWithGemini(input),/ไม่ครบ/);
    globalThis.fetch=async()=>Response.json({error:{message:"secret-provider-detail"}},{status:429});
    await assert.rejects(api.generateWithGemini(input),e=>e.status===502 && !e.message.includes("secret-provider-detail") && /โควตา/.test(e.message));
  } finally { globalThis.fetch=original; if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey; }
});

test("generation lease prevents duplicate calls, failure retains old report, GET never calls AI", async () => {
  const oldFetch=globalThis.fetch;
  const oldDb=process.env.DATABASE_URL;
  const oldKey=process.env.GEMINI_API_KEY;
  process.env.DATABASE_URL="test-db";process.env.GEMINI_API_KEY="test-key";
  let lease=false;let saved=null;let calls=0;
  globalThis.__aiTestDb={query:async(sql,values=[])=>{
    if(sql.includes("ai-report-aggregate-snapshot")) return {rows:facts.map(f=>({academic_year:f.year,grain:f.grain,entity_key:f.key,name:f.name,program_type:f.programType,choices:f.choices,applicants:f.applicants,eligible:f.eligible,confirmed:f.confirmed,rate:f.rate,eligible_rate:f.eligibleRate,avg_score:f.avgScore,loaded_at:input.dataLoadedAt,resigned:f.resigned,statuses:f.statuses,rights_outcomes:f.rightsOutcomes}))};
    if(sql.includes("to_regclass"))return {rows:[{reports:"exists",jobs:"exists"}]};
    if(sql.includes("insert into admissions_dw.ai_analysis_jobs")){if(lease)return{rows:[]};lease=true;return{rows:[{owner:values[2]}]};}
    if(sql.includes("with owned")){lease=false;saved={id:values[3],model:values[4],prompt_version:values[5],input_snapshot:JSON.parse(values[7]),content:JSON.parse(values[8]),created_at:input.dataLoadedAt};return{rows:[saved]};}
    if(sql.includes("delete from admissions_dw.ai_analysis_jobs")){lease=false;return{rows:[]};}
    if(sql.includes("select owner"))return{rows:lease?[{owner:"pending"}]:[]};
    if(sql.includes("select id, created_at") || sql.includes("select * from admissions_dw.ai_analysis_reports"))return{rows:saved?[saved]:[]};
    throw Error("Unexpected SQL");
  }};
  let release;
  globalThis.fetch=async()=>{calls++;await new Promise(resolve=>{release=resolve});return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(content())}]}}]});};
  try {
    const first=api.generateReport(scope);
    while(!release)await new Promise(resolve=>setTimeout(resolve,1));
    await assert.rejects(api.generateReport(scope),e=>e.status===409);
    release();const report=await first;assert.equal(calls,1);
    assert.equal((await api.getAnalysisState(scope)).report.id,report.id);
    assert.equal(calls,1,"reading persisted reports never calls AI");
    globalThis.fetch=async()=>{calls++;return Response.json({},{status:429});};
    await assert.rejects(api.generateReport(scope),/โควตา/);
    assert.equal(lease,false);
    assert.equal((await api.getAnalysisState(scope)).report.id,report.id,"failed generation preserves prior report");
  } finally {
    globalThis.fetch=oldFetch;delete globalThis.__aiTestDb;
    if(oldDb===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldDb;
    if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;
  }
});
