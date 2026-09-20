import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: handler } = await import(workerUrl.href);

  return handler(new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }));
}

async function renderPath(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: handler } = await import(workerUrl.href);

  return handler(new Request(`http://localhost${pathname}`, {
    headers: { accept: "text/html" },
  }));
}

test("server-renders the admissions warehouse dashboard", async () => {
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
  assert.match(html, /href="\/dashboard"/);
  assert.match(html, /href="\/rounds"/);
  assert.match(html, /href="\/majors"/);
  assert.match(html, /href="\/insights"/);
  assert.doesNotMatch(html, /href="\/(?:warehouse|technical|quality|marts|reports|data-catalog|settings)"/);
  assert.match(html, /TCAS รอบ 1-4/);
  assert.match(html, /2569/);
  assert.match(html, /TCAS1/);
  assert.match(html, /TCAS4/);
  assert.match(html, /round rows/);
  assert.match(html, /เฉพาะปี 2569/);
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

  const majorsResponse = await renderPath("/majors");
  assert.equal(majorsResponse.status, 200);
  const majorsHtml = await majorsResponse.text();
  assert.match(majorsHtml, /Major Demand and Conversion/);
  assert.match(majorsHtml, /แต่ละสาขาวิชา ทุกปี/);
  assert.doesNotMatch(majorsHtml, /ภาพรวม TCAS รอบ 1-4/);
  assert.doesNotMatch(majorsHtml, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  const insightsResponse = await renderPath("/insights");
  assert.equal(insightsResponse.status, 200);
  const insightsHtml = await insightsResponse.text();
  assert.match(insightsHtml, /Business Questions and Decision Insights/);
  assert.match(insightsHtml, /Executive action priorities/);
  assert.match(insightsHtml, /Insight categories/);
  assert.match(insightsHtml, /Decision insights from governed marts/);
  assert.match(insightsHtml, /High demand but low conversion/);
  assert.match(insightsHtml, /วิศวกรรมเครื่องกล-เกษตรเป็น demand drop risk/);
  assert.match(insightsHtml, /Demand[\s\S]*Conversion[\s\S]*Round Strategy[\s\S]*Program Portfolio/);
  assert.match(insightsHtml, /Business question catalog/);
  assert.doesNotMatch(insightsHtml, /Warehouse health and freshness|Decision mart contract|Data Trust/);
  assert.match(insightsHtml, /mart_major_opportunity/);
});

test("Overview loads the requested year while Dashboard retains all years", async () => {
  for (const year of [2567, 2568]) {
    const response = await renderPath(`/?year=${year}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`เฉพาะปี ${year}`));
    assert.match(html, /value="2567"/);
    assert.match(html, /value="2568"/);
    assert.match(html, /value="2569"/);
  }
  const response = await renderPath("/dashboard?year=2567");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-year-count="3"/);
  assert.match(html, /เปรียบเทียบทุกปี/);
});

test("keeps dashboard copy tied to real warehouse data", async () => {
  const page = await readFile(new URL("../app/overview-view.tsx", import.meta.url), "utf8");
  const analyticsPage = await readFile(new URL("../app/dashboard/analytics-dashboard.tsx", import.meta.url), "utf8");
  const dashboardTypes = await readFile(new URL("../app/data/dashboard-types.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const loader = await readFile(new URL("../app/data/load-dashboard-snapshot.ts", import.meta.url), "utf8");
  const adapter = await readFile(new URL("../app/data/live-neon-dashboard-adapter.ts", import.meta.url), "utf8");
  const queryContract = await readFile(new URL("../docs/warehouse-query-contract.md", import.meta.url), "utf8");
  const productionRunbook = await readFile(new URL("../docs/production-data-warehouse-runbook.md", import.meta.url), "utf8");
  const staticDataDecision = await readFile(new URL("../docs/decisions/0009-ban-embedded-dashboard-data.md", import.meta.url), "utf8");
  assert.match(loader, /DATABASE_URL/);
  assert.match(loader, /loadLiveNeonSnapshot/);
  assert.doesNotMatch(loader, /fallback|snapshot-fallback|warehouse-dashboard-snapshot/i);
  assert.match(adapter, /source: "live-neon"/);
  assert.doesNotMatch(adapter, /generated-artifact|artifactSnapshot|fallbackPageSnapshot/);
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
  assert.doesNotMatch(page, /-154<\/strong> applicants|\+17<\/strong> confirmed|\+1\.15 pts<\/strong> rate/);
  assert.match(styles, /tcas-dw-cartoon-logo\.png/);
  assert.doesNotMatch(page, /next\/image/);
  assert.doesNotMatch(page, /<span className="brand-mark">DW<\/span>/);
  assert.match(page, /SidebarNavigation/);
  assert.match(page, /round-table-wrap/);
  assert.doesNotMatch(page, /compare-summary/);
  assert.doesNotMatch(page, /openInsight|InsightDialog|setDialog|dialog-backdrop|dialog-success-icon|active warehouse stage|Warehouse pipeline/);
  assert.doesNotMatch(page, /showAll|setShowAll|slice\(0,\s*10\)|ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  assert.match(queryContract, /Warehouse Query Contract/);
  assert.match(queryContract, /admissions_dw\.mart_admissions_executive_summary/);
  assert.match(queryContract, /live Neon/i);
  assert.match(productionRunbook, /Production Data Warehouse Runbook/);
  assert.match(staticDataDecision, /Ban embedded dashboard data/);
  assert.match(staticDataDecision, /live-neon-dashboard-adapter/);

  assert.doesNotMatch(page, /mock|synthetic|sample platform/i);
  assert.doesNotMatch(page, /Your site is taking shape|Codex is working/i);
});

test("ships the generated cartoon logo asset", async () => {
  await access(new URL("../public/tcas-dw-cartoon-logo.png", import.meta.url));
});
