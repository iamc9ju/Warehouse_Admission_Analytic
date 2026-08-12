import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function renderPath(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the admissions warehouse dashboard", async () => {
  const snapshot = JSON.parse(await readFile(new URL("../app/data/generated/warehouse-dashboard-snapshot.json", import.meta.url), "utf8"));
  const latestYear = [...snapshot.years].sort((first, second) => second.year - first.year)[0];
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TCAS Admissions Data Warehouse<\/title>/i);
  assert.match(html, /TCAS Admissions Data Warehouse/);
  assert.match(html, /aria-label="Dashboard sidebar"/);
  assert.match(html, /aria-label="Section navigation"/);
  assert.doesNotMatch(html, /Warehouse status|Last sync|2 นาทีที่แล้ว/);
  assert.match(html, /class="page-transition"/);
  assert.doesNotMatch(html, /Warehouse pipeline|active warehouse stage|role="dialog"|กลับสู่ dashboard/);
  assert.match(html, /href="\/warehouse"/);
  assert.match(html, /href="\/dashboard"/);
  assert.match(html, /href="\/technical"/);
  assert.match(html, /href="\/rounds"/);
  assert.match(html, /href="\/majors"/);
  assert.match(html, /href="\/quality"/);
  assert.match(html, /href="\/insights"/);
  assert.doesNotMatch(html, /href="\/(?:marts|reports|data-catalog|settings)"/);
  assert.match(html, /TCAS รอบ 1-4/);
  assert.match(html, new RegExp(latestYear.applicants.toLocaleString("en-US")));
  assert.match(html, new RegExp(latestYear.choices.toLocaleString("en-US")));
  assert.match(html, new RegExp(latestYear.confirmed.toLocaleString("en-US")));
  assert.match(html, /TCAS1/);
  assert.match(html, /TCAS4/);
  assert.match(html, /round rows/);
  assert.match(html, new RegExp(`เฉพาะปี ${latestYear.year}`));
  assert.doesNotMatch(html, /Year over year summary|compare-summary|คุณภาพข้อมูล/);
  assert.match(html, /ทุกสาขาวิชา/);
  assert.doesNotMatch(html, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);
});

test("renders separate route pages instead of anchor-only sections", async () => {
  const dashboardResponse = await renderPath("/dashboard");
  assert.equal(dashboardResponse.status, 200);
  const dashboardHtml = await dashboardResponse.text();
  assert.match(dashboardHtml, /Admissions Analytics Dashboard/);
  assert.match(dashboardHtml, /kpi-sparkline/);
  assert.match(dashboardHtml, /แนวโน้ม/);
  assert.match(dashboardHtml, /ทั้งหมด/);
  assert.match(dashboardHtml, /Round YoY Comparison/);
  assert.match(dashboardHtml, /1,320/);
  assert.match(dashboardHtml, /1,324/);
  assert.doesNotMatch(dashboardHtml, /Opportunity Matrix|Block Quadrant/);
  assert.match(dashboardHtml, /Major YoY Comparison/);
  assert.match(dashboardHtml, /All-year comparison/);
  assert.match(dashboardHtml, /เปรียบเทียบทุกปี/);

  const warehouseResponse = await renderPath("/warehouse");
  assert.equal(warehouseResponse.status, 200);
  const warehouseHtml = await warehouseResponse.text();
  assert.match(warehouseHtml, /Data catalog evidence/);
  assert.match(warehouseHtml, /Lineage edges/);
  assert.match(warehouseHtml, /Dashboard query contract/);
  assert.match(warehouseHtml, /ETL validation checks/);
  assert.match(warehouseHtml, /mart_admissions_executive_summary/);

  const roundsResponse = await renderPath("/rounds");
  assert.equal(roundsResponse.status, 200);
  const roundsHtml = await roundsResponse.text();
  assert.match(roundsHtml, /TCAS Round Analytics/);
  assert.match(roundsHtml, /ผู้สมัครและยืนยันสิทธิ์แต่ละรอบ TCAS ทุกปี/);
  assert.match(roundsHtml, /2567/);
  assert.match(roundsHtml, /TCAS3/);
  assert.match(roundsHtml, /2568/);
  assert.match(roundsHtml, /TCAS1/);
  assert.match(roundsHtml, /2569/);
  assert.doesNotMatch(roundsHtml, /ทุกสาขาวิชา/);
  assert.doesNotMatch(roundsHtml, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  const technicalResponse = await renderPath("/technical");
  assert.equal(technicalResponse.status, 200);
  const technicalHtml = await technicalResponse.text();
  assert.match(technicalHtml, /Project Technical Overview/);
  assert.match(technicalHtml, /End-to-End Data Architecture/);
  assert.match(technicalHtml, /technical-data-architecture-flow\.png/);
  assert.match(technicalHtml, /Excel[\s\S]*ETL[\s\S]*PII-free CSV[\s\S]*Neon PostgreSQL[\s\S]*Fact \+ Dimension[\s\S]*Data Mart[\s\S]*Dashboard/);
  assert.match(technicalHtml, /Production Runtime/);
  assert.match(technicalHtml, /Server-side Neon query/);
  assert.match(technicalHtml, /Generated warehouse artifact/);
  assert.match(technicalHtml, /Data Hierarchy/);
  assert.match(technicalHtml, /Presentation[\s\S]*Semantic[\s\S]*Warehouse[\s\S]*Integration[\s\S]*Source/);
  assert.match(technicalHtml, /Academic Year[\s\S]*TCAS Round[\s\S]*Faculty \/ Major[\s\S]*Applicant Status/);

  const majorsResponse = await renderPath("/majors");
  assert.equal(majorsResponse.status, 200);
  const majorsHtml = await majorsResponse.text();
  assert.match(majorsHtml, /Major Demand and Conversion/);
  assert.match(majorsHtml, /แต่ละสาขาวิชา ทุกปี/);
  assert.doesNotMatch(majorsHtml, /ภาพรวม TCAS รอบ 1-4/);
  assert.doesNotMatch(majorsHtml, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  const qualityResponse = await renderPath("/quality");
  assert.equal(qualityResponse.status, 200);
  const qualityHtml = await qualityResponse.text();
  assert.match(qualityHtml, /Data quality metric definitions/);
  assert.match(qualityHtml, /Warehouse health:[\s\S]*pass/);
  assert.match(qualityHtml, /admission_round_source_data_quality\.missing_score_rows/);
  assert.match(qualityHtml, /processed fact column audit/);

  const insightsResponse = await renderPath("/insights");
  assert.equal(insightsResponse.status, 200);
  const insightsHtml = await insightsResponse.text();
  assert.match(insightsHtml, /Business Questions and Decision Insights/);
  assert.match(insightsHtml, /Executive action priorities/);
  assert.match(insightsHtml, /Insight categories/);
  assert.match(insightsHtml, /Decision insights from governed marts/);
  assert.match(insightsHtml, /High demand but low conversion/);
  assert.match(insightsHtml, /วิศวกรรมเครื่องกล-เกษตรเป็น demand drop risk/);
  assert.match(insightsHtml, /Demand[\s\S]*Conversion[\s\S]*Round Strategy[\s\S]*Program Portfolio[\s\S]*Data Trust/);
  assert.match(insightsHtml, /Business question catalog/);
  assert.match(insightsHtml, /Warehouse health and freshness/);
  assert.match(insightsHtml, /Decision mart contract/);
  assert.match(insightsHtml, /mart_major_opportunity/);
});

test("keeps dashboard copy tied to real warehouse data", async () => {
  const page = await readFile(new URL("../app/overview-view.tsx", import.meta.url), "utf8");
  const analyticsPage = await readFile(new URL("../app/dashboard/analytics-dashboard.tsx", import.meta.url), "utf8");
  const dashboardTypes = await readFile(new URL("../app/data/dashboard-types.ts", import.meta.url), "utf8");
  const validator = await readFile(new URL("../scripts/validate-dashboard-snapshot.mjs", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const snapshot = await readFile(new URL("../app/data/generated/warehouse-dashboard-snapshot.json", import.meta.url), "utf8");
  const loader = await readFile(new URL("../app/data/load-dashboard-snapshot.ts", import.meta.url), "utf8");
  const evidence = await readFile(new URL("../docs/data-warehouse-evidence.md", import.meta.url), "utf8");
  const queryContract = await readFile(new URL("../docs/warehouse-query-contract.md", import.meta.url), "utf8");
  const qualityMetrics = await readFile(new URL("../docs/data-quality-metrics.md", import.meta.url), "utf8");
  const productionRunbook = await readFile(new URL("../docs/production-data-warehouse-runbook.md", import.meta.url), "utf8");
  const staticDataDecision = await readFile(new URL("../docs/decisions/0009-ban-embedded-dashboard-data.md", import.meta.url), "utf8");
  const snapshotObject = JSON.parse(snapshot);

  assert.match(snapshot, /"choices": 4579/);
  assert.match(snapshot, /"year": 2567/);
  assert.match(snapshot, /"choices": 4217/);
  assert.match(snapshot, /"source": "generated-artifact"/);
  assert.match(snapshot, /"applicants": 3443/);
  assert.match(snapshot, /"confirmed": 545/);
  assert.match(snapshot, /"sourceFiles": 5/);
  assert.match(snapshot, /"sourceRows": 13649/);
  assert.match(snapshot, /"sourceFiles": 15/);
  assert.match(snapshot, /mart_admissions_executive_summary/);
  assert.match(snapshot, /vw_admission_round_overview/);
  assert.match(snapshot, /qualityMetricDefinitions/);
  assert.match(snapshot, /dataCatalogRows/);
  assert.match(snapshot, /lineageEdges/);
  assert.match(snapshot, /businessQuestions/);
  assert.match(snapshot, /decisionInsights/);
  assert.match(snapshot, /warehouseHealth/);
  assert.match(snapshot, /decisionMartContract/);
  assert.equal(snapshotObject.businessQuestions.length, 15);
  assert.equal(snapshotObject.decisionInsights.length, 15);
  assert(snapshotObject.businessQuestions.every((question) =>
    snapshotObject.decisionInsights.some((insight) => insight.businessQuestionId === question.id)
  ));
  assert(snapshotObject.businessQuestions.some((question) => question.domain === "Program Portfolio"));
  assert(snapshotObject.decisionInsights.some((insight) => insight.category === "Data Trust"));

  assert.match(loader, /warehouse-dashboard-snapshot\.json/);
  assert.match(loader, /DATABASE_URL/);
  assert.match(loader, /loadLiveNeonSnapshot/);
  assert.match(loader, /fallbackReason/);
  assert.match(page, /snapshot/);
  assert.doesNotMatch(page, /from "\.\/data\/warehouse-snapshot"/);
  assert.doesNotMatch(page, /const\s+years\s*=\s*\[/);
  assert.doesNotMatch(page, /const\s+majorRows\s*=\s*\[/);
  assert.doesNotMatch(page, /const\s+statuses\s*=\s*\[/);
  assert.doesNotMatch(page, /const\s+rounds\s*=\s*\[/);
  assert.match(page, /selectableYears\.map/);
  assert.doesNotMatch(page, /<option value=\{256[0-9]\}>/);
  assert.match(dashboardTypes, /export type Year = number/);
  assert.match(analyticsPage, /hasManyYears/);
  assert.match(analyticsPage, /roundStatuses\.find/);
  assert.match(analyticsPage, /status\.code === selectedRoundCode/);
  assert.match(analyticsPage, /data-year-count/);
  assert.match(styles, /analytics-chart-grid\.many-years/);
  assert.match(validator, /const academicYears/);
  assert.doesNotMatch(validator, /\[2568, 2569\]/);
  assert.doesNotMatch(page, /-154<\/strong> applicants|\+17<\/strong> confirmed|\+1\.15 pts<\/strong> rate/);
  assert.match(styles, /tcas-dw-cartoon-logo\.png/);
  assert.doesNotMatch(page, /next\/image/);
  assert.doesNotMatch(page, /<span className="brand-mark">DW<\/span>/);
  const warehousePage = await readFile(new URL("../app/warehouse/page.tsx", import.meta.url), "utf8");
  assert.match(warehousePage, /Data catalog evidence/);
  assert.match(warehousePage, /Dashboard query contract/);
  assert.match(warehousePage, /ETL validation checks/);
  assert.match(page, /SidebarNavigation/);
  assert.match(page, /round-table-wrap/);
  assert.doesNotMatch(page, /compare-summary/);
  assert.doesNotMatch(page, /openInsight|InsightDialog|setDialog|dialog-backdrop|dialog-success-icon|active warehouse stage|Warehouse pipeline/);
  assert.doesNotMatch(page, /showAll|setShowAll|slice\(0,\s*10\)|ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  assert.match(evidence, /Active Source Catalog/);
  assert.match(evidence, /ETL and Cleaning Contract/);
  assert.match(evidence, /Dashboard Snapshot Contract/);
  assert.match(queryContract, /Warehouse Query Contract/);
  assert.match(queryContract, /admissions_dw\.mart_admissions_executive_summary/);
  assert.match(queryContract, /app\/data\/generated\/warehouse-dashboard-snapshot\.json/);
  assert.match(qualityMetrics, /Data Quality Metrics/);
  assert.match(qualityMetrics, /Missing score/);
  assert.match(productionRunbook, /Production Data Warehouse Runbook/);
  assert.match(staticDataDecision, /Ban embedded dashboard data/);
  assert.match(staticDataDecision, /live-neon-dashboard-adapter/);

  assert.doesNotMatch(page, /mock|synthetic|sample platform/i);
  assert.doesNotMatch(page, /Your site is taking shape|Codex is working/i);
});

test("ships the generated cartoon logo asset", async () => {
  await access(new URL("../public/tcas-dw-cartoon-logo.png", import.meta.url));
  await access(new URL("../public/technical-data-architecture-flow.png", import.meta.url));
});
