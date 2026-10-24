import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
const result = await build({ entryPoints: ["app/insights/insight-period.ts"], bundle: true, platform: "node", format: "esm", write: false });
const { groupInsightRows } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
const major = (year, majorKey, applicants, confirmed, eligible) => ({ year, majorKey, code: "M1", name: "Major", type: majorKey, applicants, confirmed, eligible, choices: applicants, rate: 0, avgScore: 0 });

test("all years sums by major identity and calculates weighted confirmation rate", () => {
  const rows = [major(2567, "regular", 100, 10, 20), major(2569, "regular", 200, 60, 80), major(2569, "special", 30, 5, 10)];
  const grouped = groupInsightRows(rows, "all", 2569);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].applicants, 300);
  assert.equal(grouped[0].confirmed, 70);
  assert.equal(grouped[0].eligible, 100);
  assert.equal(grouped[0].rate, 70);
  assert.equal(rows[0].applicants, 100);
});

test("new years join all-year totals and latest mode selects only the newest year", () => {
  const rows = [major(2569, "regular", 200, 60, 80), major(2570, "regular", 300, 70, 100)];
  assert.equal(groupInsightRows(rows, "all", 2570)[0].applicants, 500);
  assert.deepEqual(groupInsightRows(rows, "latest", 2570), [rows[1]]);
});

test("rounds combine by round code and preserve missing denominators", () => {
  const rows = [
    { year: 2567, code: "TCAS1", name: "Round 1", applicants: 100, confirmed: 20, eligible: 40, choices: 100, files: 1, rate: 20 },
    { year: 2569, code: "TCAS1", name: "Round 1", applicants: 200, confirmed: 60, eligible: 80, choices: 200, files: 1, rate: 30 },
  ];
  assert.equal(groupInsightRows(rows, "all", 2569)[0].confirmed, 80);
  assert.equal(groupInsightRows(rows, "all", 2569)[0].eligible, 120);
  assert.equal(groupInsightRows([{ ...rows[0], eligible: undefined }, rows[1]], "all", 2569)[0].eligible, undefined);
});
