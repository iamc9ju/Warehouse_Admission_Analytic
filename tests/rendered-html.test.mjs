import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("server-renders the admissions warehouse dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TCAS Admissions Data Warehouse<\/title>/i);
  assert.match(html, /TCAS Admissions Data Warehouse/);
  assert.match(html, /aria-label="Dashboard navigation"/);
  assert.match(html, /href="#warehouse"/);
  assert.match(html, /href="#rounds"/);
  assert.match(html, /href="#quality"/);
  assert.match(html, /TCAS รอบ 1-4/);
  assert.match(html, /3,443/);
  assert.match(html, /4,579/);
  assert.match(html, /545/);
  assert.match(html, /TCAS1/);
  assert.match(html, /TCAS4/);
  assert.match(html, /fact_admission_round_overview/);
  assert.match(html, /YouTube API/);
  assert.match(html, /Facebook public search/);
});

test("keeps dashboard copy tied to real warehouse data", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /applicationChoices:\s*4579/);
  assert.match(page, /uniqueApplicants:\s*3443/);
  assert.match(page, /confirmed:\s*545/);
  assert.match(page, /sourceFiles:\s*2/);
  assert.match(page, /Source rows<\/dt>\s*<dd>9,432<\/dd>/);
  assert.match(page, /11 Excel source files/);
  assert.match(page, /fact_admission_year_overview/);
  assert.match(page, /fact_admission_round_overview/);

  assert.doesNotMatch(page, /mock|synthetic|sample platform|TikTok|Pantip/i);
  assert.doesNotMatch(page, /Your site is taking shape|Codex is working/i);
});
