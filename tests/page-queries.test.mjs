import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const mockKey = Symbol.for("admissions.page-query-tests");
const fixtureYears = [
  { year: 2567, choices: 4367, applicants: 3353, confirmed: 524, resigned: 30, eligible: 737, rate: 15.63, sourceFiles: 5, avgScore: 70 },
  { year: 2568, choices: 4853, applicants: 3597, confirmed: 528, resigned: 32, eligible: 769, rate: 14.68, sourceFiles: 6, avgScore: 71 },
  { year: 2569, choices: 4579, applicants: 3443, confirmed: 545, resigned: 32, eligible: 815, rate: 15.83, sourceFiles: 5, avgScore: 72 },
];

async function loadModule() {
  const result = await build({
    stdin: {
      contents: `
        export * from './app/data/live-neon-dashboard-adapter.ts';
        export * from './app/data/load-dashboard-snapshot.ts';
        export * from './app/data/page-data-types.ts';
      `,
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    plugins: [{
      name: "mock-pg",
      setup(plugin) {
        plugin.onResolve({ filter: /^pg$/ }, () => ({ path: "pg", namespace: "test" }));
        plugin.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: `
          export class Pool {
            constructor() { globalThis[Symbol.for('admissions.page-query-tests')].connections++; }
            query(sql, values) { return globalThis[Symbol.for('admissions.page-query-tests')].client.query(sql, values); }
          }
        ` }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${Math.random()}`);
}

function fakeClient({ fail, empty } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values = []) {
      const kind = sql.includes("decision-insights-from-marts") ? "decisionInsights"
        : sql.includes("all-year-distinct-people") ? "allYearPeople"
        : sql.includes("select distinct academic_year") ? "availableYears"
        : sql.includes("mart_admissions_executive_summary") ? "years"
        : sql.includes("vw_admission_round_overview") ? "rounds"
        : sql.includes("mart_major_conversion") ? "majorRows"
        : sql.includes("vw_admission_major_status_distribution") ? "majorStatuses"
        : sql.includes("vw_admission_year_status_distribution") ? "statuses"
        : sql.includes("vw_admission_round_status_distribution") ? "roundStatuses"
        : "unknown";
      calls.push({ kind, sql, values });
      assert.notEqual(kind, "unknown", sql);
      if (fail === kind) throw new Error(`Unavailable: ${kind}`);
      if (empty === kind) return { rows: [] };
      const filteredYears = fixtureYears.filter((row) => values.length === 0 || row.year === values[0]);
      const rows = {
        allYearPeople: () => [{ applicants: 9000, confirmed: 1400, resigned: 60 }],
        availableYears: () => [...fixtureYears].reverse().map((row) => ({ academic_year: row.year })),
        years: () => filteredYears.map((row) => ({ academic_year: row.year, application_choices: row.choices, unique_applicants: row.applicants, confirmed_applicants: row.confirmed, resigned_applicants: row.resigned, eligible_applicants: row.eligible, confirmed_rate: row.rate, source_files: row.sourceFiles, avg_score: row.avgScore })),
        rounds: () => filteredYears.map((row) => ({ academic_year: row.year, tcas_round_code: "TCAS1", tcas_round_name: "Portfolio", choices: row.choices, unique_applicants: row.applicants, confirmed_applicants: row.confirmed, confirmed_rate: row.rate, source_files: row.sourceFiles, eligible_applicants: row.eligible })),
        majorRows: () => filteredYears.map((row) => ({ academic_year: row.year, major_key: "3", major_code: "CE", major_name: "Civil", program_type: "Regular", applicant_count: row.applicants, application_choices: row.choices, confirmed_count: row.confirmed, confirmed_rate: row.rate, avg_score: row.avgScore, applicant_change: 0, eligible_count: row.eligible })),
        majorStatuses: () => filteredYears.map((row) => ({ academic_year: row.year, major_key: "3", major_code: "CE", major_name: "Civil", tcas_status: "ยืนยันสิทธิ์", application_choices: row.confirmed, unique_applicants: row.confirmed })),
        statuses: () => filteredYears.map((row) => ({ academic_year: row.year, status_label: "ยืนยันสิทธิ์", choices: row.confirmed, unique_applicants: row.confirmed, share_pct: 10, tone: "green" })),
        roundStatuses: () => filteredYears.map((row) => ({ academic_year: row.year, tcas_round_code: "TCAS1", tcas_round_name: "Portfolio", tcas_status: "ยืนยันสิทธิ์", application_choices: row.confirmed, unique_applicants: row.confirmed })),
        decisionInsights: () => [
          { business_question_id: "BQ-001", payload: { academic_year: 2569, major_name: "Civil", applicant_count: 825, confirmed_count: 63, confirmed_rate: 7.64, applicant_change: 10 } },
          { business_question_id: "BQ-002", payload: { academic_year: 2569, tcas_round_code: "TCAS3", confirmed_applicants: 283, confirmed_rate: 17.47 } },
          { business_question_id: "BQ-006", payload: { academic_year: 2569, major_name: "Civil", applicant_count: 825, confirmed_count: 63, confirmed_rate: 7.64, applicant_change: 10 } },
          { business_question_id: "BQ-007", payload: { academic_year: 2569, major_name: "Mechanical", applicant_count: 200, confirmed_count: 20, confirmed_rate: 10, applicant_change: -197 } },
          { business_question_id: "BQ-008", payload: { academic_year: 2569, major_name: "Logistics", applicant_count: 300, confirmed_count: 40, confirmed_rate: 13.33, applicant_change: 157 } },
          { business_question_id: "BQ-009", payload: { academic_year: 2569, major_name: "Innovation", applicant_count: 108, confirmed_count: 36, confirmed_rate: 33.33, applicant_change: 5 } },
        ],
      }[kind]();
      return { rows };
    },
  };
}

test("each page queries only live Neon dependencies", async (t) => {
  const dataModule = await loadModule();
  const expected = {
    overview: ["availableYears", "years", "rounds", "majorRows", "statuses"],
    dashboard: ["availableYears", "years", "rounds", "majorRows", "roundStatuses", "allYearPeople"],
    insights: ["availableYears", "years", "rounds", "majorRows", "decisionInsights"],
    majors: ["availableYears", "years", "majorRows", "majorStatuses"],
    rounds: ["availableYears", "years", "rounds", "roundStatuses"],
  };
  for (const [page, fields] of Object.entries(expected)) {
    await t.test(page, async () => {
      const client = fakeClient();
      const result = await dataModule.queryPageSnapshot(client, page, 2567);
      assert.deepEqual(client.calls.map((call) => call.kind).sort(), [...fields].sort());
      assert.equal(result.snapshot.runtime.source, "live-neon");
      assert.deepEqual(Object.keys(dataModule.pickPageData(page, result.snapshot)).sort(), [...dataModule.pageDataFields[page]].sort());
    });
  }

  await t.test("unknown Overview year defaults to latest", async () => {
    const client = fakeClient();
    const result = await dataModule.queryPageSnapshot(client, "overview", 9999);
    assert.equal(result.selectedYear, 2569);
    assert.deepEqual(client.calls.find((call) => call.kind === "years").values, [2569]);
  });

  await t.test("same major code keeps separate regular and special identities", async () => {
    const base = fakeClient();
    const client = { async query(sql, values) {
      const result = await base.query(sql, values);
      if (!sql.includes("mart_major_conversion")) return result;
      return { rows: result.rows.flatMap(row => [row, { ...row, major_key: "9", major_name: "Civil Special", program_type: "Special", applicant_count: 7 }]) };
    } };
    const { snapshot } = await dataModule.queryPageSnapshot(client, "dashboard");
    const rows = snapshot.majorRows.filter(row => row.year === 2569);
    assert.deepEqual(rows.map(row => row.majorKey), ["3", "9"]);
    assert.deepEqual(rows.map(row => row.code), ["CE", "CE"]);
    assert.deepEqual(rows.map(row => row.applicants), [3443, 7]);
  });

  await t.test("Dashboard keeps all-year people totals separate from annual sums", async () => {
    const client = fakeClient();
    const result = await dataModule.queryPageSnapshot(client, "dashboard", 2567);
    assert.deepEqual(result.snapshot.allYearPeople, { applicants: 9000, confirmed: 1400, resigned: 60 });
    assert.equal(result.snapshot.years.length, 3);
    const query = client.calls.find((call) => call.kind === "allYearPeople");
    assert.deepEqual(query.values, []);
    assert.equal((query.sql.match(/count\(distinct f.student_key\)/g) ?? []).length, 3);
    assert.doesNotMatch(query.sql, /group by/i);
    await assert.rejects(dataModule.queryPageSnapshot(fakeClient({ fail: "allYearPeople" }), "dashboard"), /Unavailable/);
  });

  await t.test("query failures and empty required results reject instead of falling back", async () => {
    await assert.rejects(dataModule.queryPageSnapshot(fakeClient({ fail: "majorRows" }), "majors"), /Unavailable/);
    await assert.rejects(dataModule.queryPageSnapshot(fakeClient({ empty: "years" }), "dashboard"), /incomplete/);
  });
});

test("page loaders cache live requests, reuse one pool and require DATABASE_URL", async () => {
  const oldEnv = { DATABASE_URL: process.env.DATABASE_URL, NODE_ENV: process.env.NODE_ENV };
  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = "postgresql://test-only";
  const state = { client: fakeClient(), connections: 0 };
  globalThis[mockKey] = state;
  try {
    const dataModule = await loadModule();
    const [first, second] = await Promise.all([dataModule.loadOverviewPageData(2567), dataModule.loadOverviewPageData(2567)]);
    assert.deepEqual(first, second);
    assert.equal(state.connections, 1);
    delete process.env.DATABASE_URL;
    await assert.rejects(dataModule.loadRoundsPageData(), /DATABASE_URL is required/);
  } finally {
    delete globalThis[mockKey];
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
