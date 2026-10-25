import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
const result = await build({ entryPoints: ["app/insights/insight-period.ts"], bundle: true, platform: "node", format: "esm", write: false });
const { groupInsightRows } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
const major = (year, majorKey, applicants, confirmed, eligible) => ({ year, majorKey, code: "M1", name: "Major", type: majorKey, applicants, confirmed, eligible, choices: applicants, rate: 0, avgScore: 0 });

test("all years uses annual-distinct totals from the database", () => {
  const annual = [major(2567, "regular", 100, 10, 20), major(2569, "regular", 200, 60, 80)];
  const distinct = [major(2569, "regular", 300, 70, 100), major(2569, "special", 30, 5, 10)];
  assert.deepEqual(groupInsightRows(annual, "all", 2569, distinct), distinct);
  assert.equal(annual[0].applicants, 100);
});

test("latest year uses annual data even when all-year totals differ", () => {
  const annual = [major(2569, "regular", 200, 60, 80), major(2570, "regular", 300, 70, 100)];
  const distinct = [major(2570, "regular", 500, 130, 180)];
  assert.deepEqual(groupInsightRows(annual, "latest", 2570, distinct), [annual[1]]);
  assert.equal(groupInsightRows(annual, "all", 2570, distinct)[0].applicants, 500);
});

test("all-year rounds use database annual-distinct totals", () => {
  const round = (year, applicants) => ({ year, code: "TCAS1", name: "Round 1", applicants, confirmed: 10, eligible: 20, choices: applicants, files: 1, rate: 50 });
  assert.equal(groupInsightRows([round(2567, 100), round(2569, 200)], "all", 2569, [round(2569, 300)])[0].applicants, 300);
});
