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
  assert.match(html, /href="\/rounds"/);
  assert.match(html, /href="\/majors"/);
  assert.match(html, /href="\/quality"/);
  assert.doesNotMatch(html, /href="\/(?:social|marts|dashboard|reports|data-catalog|settings)"/);
  assert.match(html, /TCAS รอบ 1-4/);
  assert.match(html, /3,443/);
  assert.match(html, /4,579/);
  assert.match(html, /545/);
  assert.match(html, /TCAS1/);
  assert.match(html, /TCAS4/);
  assert.match(html, /round rows/);
  assert.match(html, /Year over year summary/);
  assert.match(html, /คุณภาพข้อมูล/);
  assert.match(html, /ทุกสาขาวิชา/);
  assert.doesNotMatch(html, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);
});

test("renders separate route pages instead of anchor-only sections", async () => {
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
  assert.match(roundsHtml, /ภาพรวม TCAS รอบ 1-4/);
  assert.match(roundsHtml, /2568[\s\S]*TCAS1/);
  assert.match(roundsHtml, /2569[\s\S]*TCAS4/);
  assert.doesNotMatch(roundsHtml, /ทุกสาขาวิชา/);
  assert.doesNotMatch(roundsHtml, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  const majorsResponse = await renderPath("/majors");
  assert.equal(majorsResponse.status, 200);
  const majorsHtml = await majorsResponse.text();
  assert.match(majorsHtml, /Major Demand and Conversion/);
  assert.match(majorsHtml, /ทุกสาขาวิชา/);
  assert.doesNotMatch(majorsHtml, /ภาพรวม TCAS รอบ 1-4/);
  assert.doesNotMatch(majorsHtml, /ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  const qualityResponse = await renderPath("/quality");
  assert.equal(qualityResponse.status, 200);
  const qualityHtml = await qualityResponse.text();
  assert.match(qualityHtml, /Data quality metric definitions/);
  assert.match(qualityHtml, /admission_round_source_data_quality\.missing_score_rows/);
  assert.match(qualityHtml, /processed aggregate CSV column audit/);
});

test("keeps dashboard copy tied to real warehouse data", async () => {
  const page = await readFile(new URL("../app/dashboard-page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const snapshot = await readFile(new URL("../app/data/warehouse-snapshot.ts", import.meta.url), "utf8");
  const evidence = await readFile(new URL("../docs/data-warehouse-evidence.md", import.meta.url), "utf8");
  const queryContract = await readFile(new URL("../docs/warehouse-query-contract.md", import.meta.url), "utf8");
  const qualityMetrics = await readFile(new URL("../docs/data-quality-metrics.md", import.meta.url), "utf8");

  assert.match(snapshot, /choices:\s*4579/);
  assert.match(snapshot, /applicants:\s*3443/);
  assert.match(snapshot, /confirmed:\s*545/);
  assert.match(snapshot, /sourceFiles:\s*5/);
  assert.match(snapshot, /sourceRows:\s*9432/);
  assert.match(snapshot, /sourceFiles:\s*11/);
  assert.match(snapshot, /mart_admissions_executive_summary/);
  assert.match(snapshot, /vw_admission_round_overview/);
  assert.match(snapshot, /qualityMetricDefinitions/);
  assert.match(snapshot, /dataCatalogRows/);
  assert.match(snapshot, /lineageEdges/);

  assert.match(page, /warehouseSnapshot/);
  assert.match(styles, /tcas-dw-cartoon-logo\.png/);
  assert.doesNotMatch(page, /next\/image/);
  assert.doesNotMatch(page, /<span className="brand-mark">DW<\/span>/);
  assert.match(page, /Data catalog evidence/);
  assert.match(page, /Dashboard query contract/);
  assert.match(page, /ETL validation checks/);
  assert.match(page, /startViewTransition/);
  assert.match(page, /round-table-wrap/);
  assert.match(page, /compare-summary/);
  assert.doesNotMatch(page, /openInsight|InsightDialog|setDialog|dialog-backdrop|dialog-success-icon|active warehouse stage|Warehouse pipeline/);
  assert.doesNotMatch(page, /showAll|setShowAll|slice\(0,\s*10\)|ดูทั้งหมด|ดูรายละเอียดทั้งหมด|แสดง Top 10|ดูทุกปี|ดูการเปรียบเทียบราย round/);

  assert.match(evidence, /Active Source Catalog/);
  assert.match(evidence, /ETL and Cleaning Contract/);
  assert.match(evidence, /Dashboard Snapshot Contract/);
  assert.match(queryContract, /Warehouse Query Contract/);
  assert.match(queryContract, /admissions_dw\.mart_admissions_executive_summary/);
  assert.match(qualityMetrics, /Data Quality Metrics/);
  assert.match(qualityMetrics, /Missing score/);

  assert.doesNotMatch(page, /mock|synthetic|sample platform|TikTok|Pantip|YouTube API|Facebook public search/i);
  assert.doesNotMatch(page, /Your site is taking shape|Codex is working/i);
});

test("ships the generated cartoon logo asset", async () => {
  await access(new URL("../public/tcas-dw-cartoon-logo.png", import.meta.url));
});
