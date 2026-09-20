import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const artifact = JSON.parse(await readFile(new URL("../app/data/generated/warehouse-dashboard-snapshot.json", import.meta.url), "utf8"));
const mockKey = Symbol.for("admissions.page-query-tests");

// Bundle TypeScript in memory; pg is replaced so tests never contact a database.
async function loadModule() {
  const result = await build({
    stdin: {
      contents: `
        export * from './app/data/live-neon-dashboard-adapter.ts';
        export * from './app/data/load-dashboard-snapshot.ts';
        export * from './app/data/page-data-types.ts';
        export * from './app/data/snapshot-fallback.ts';
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
          export class Client {
            async connect() { globalThis[Symbol.for('admissions.page-query-tests')].connections++; }
            query(sql, values) { return globalThis[Symbol.for('admissions.page-query-tests')].client.query(sql, values); }
            async end() { globalThis[Symbol.for('admissions.page-query-tests')].closed++; }
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
    async end() {},
    async query(sql, values = []) {
      const kind = sql.includes("select distinct academic_year") ? "availableYears"
        : sql.includes("mart_admissions_executive_summary") ? "years"
        : sql.includes("vw_admission_round_overview") ? "rounds"
        : sql.includes("mart_major_conversion") ? "majorRows"
        : sql.includes("sum(choices)") ? "statuses"
        : sql.includes("vw_admission_round_status_distribution") ? "roundStatuses"
        : sql.includes("vw_dw_quality_scorecard") ? "qualityMetricDefinitions"
        : sql.includes("dw_business_question_catalog") ? "businessQuestions"
        : sql.includes("mart_decision_insight") ? "decisionInsights"
        : sql.includes("vw_dw_refresh_health") ? "warehouseHealth" : "unknown";
      calls.push({ kind, sql, values });
      assert.notEqual(kind, "unknown", sql);
      if (fail === kind) throw new Error(`Unavailable: ${kind}`);
      if (empty === kind) return { rows: [] };
      if (kind === "availableYears") return { rows: artifact.years.map((r) => ({ academic_year: r.year })) };
      const filtered = (rows) => rows.filter((row) => values.length === 0 || row.year === values[0]);
      const rows = {
        years: () => filtered(artifact.years).map((r) => ({ academic_year: r.year, application_choices: String(r.choices), unique_applicants: String(r.applicants), confirmed_applicants: String(r.confirmed), confirmed_rate: String(r.rate), source_files: String(r.sourceFiles), avg_score: String(r.avgScore) })),
        rounds: () => filtered(artifact.rounds).map((r) => ({ academic_year: r.year, tcas_round_code: r.code, tcas_round_name: r.name, choices: r.choices, unique_applicants: r.applicants, confirmed_applicants: r.confirmed, confirmed_rate: r.rate, source_files: r.files, eligible_count: r.eligible })),
        majorRows: () => filtered(artifact.majorRows).map((r) => ({ academic_year: r.year, major_code: r.code, major_name: r.name, program_type: r.type, applicant_count: r.applicants, confirmed_count: r.confirmed, confirmed_rate: r.rate, avg_score: r.avgScore, applicant_change: r.applicantChange, eligible_count: r.eligible })),
        statuses: () => filtered(artifact.statuses).map((r) => ({ academic_year: r.year, status_label: r.label, choices: r.choices, share_pct: r.share, tone: r.tone })),
        roundStatuses: () => filtered(artifact.roundStatuses).map((r) => ({ academic_year: r.year, tcas_round_code: r.code, tcas_round_name: r.name, tcas_status: r.label, application_choices: r.choices, unique_applicants: r.applicants })),
        qualityMetricDefinitions: () => artifact.qualityMetricDefinitions.map((r) => ({ metric_name: r.label, metric_value: r.value, source_object: r.sourceObject, validation_rule: r.rule })),
        businessQuestions: () => artifact.businessQuestions.map((r) => ({ question_id: r.id, domain: r.domain, question: r.question, mart_object: r.martObject, metrics: r.metrics.join(","), decision_owner: r.decisionOwner, decision_use: r.decisionUse, quality_gate: r.qualityGate })),
        decisionInsights: () => artifact.decisionInsights.map((r) => ({ insight_id: r.id, business_question_id: r.businessQuestionId, priority: r.priority, category: r.category, title: r.title, summary: r.summary, mart_object: r.martObject, metric_label: r.metricLabel, metric_value: r.metricValue, decision: r.decision, recommended_action: r.recommendedAction, confidence: r.confidence, quality_gate: r.qualityGate })),
        warehouseHealth: () => [{ health_id: "live-health", status: "pass", last_refresh_at: "2026-09-20", freshness_sla_hours: 24, source_rows: 13799, source_files: 16, mart_count: 10, quality_checks_passed: 5, quality_checks_failed: 0, pii_exported_columns: 0, artifact_checksum: "test", notes: "fixture" }],
      }[kind]();
      return { rows };
    },
  };
}

test("page query scopes and fallback behavior", async (t) => {
  const dataModule = await loadModule();
  const expected = {
    overview: ["availableYears", "years", "rounds", "majorRows", "statuses"],
    dashboard: ["years", "rounds", "majorRows", "statuses", "roundStatuses", "warehouseHealth"],
    insights: ["years", "rounds", "majorRows", "statuses", "roundStatuses", "warehouseHealth", "businessQuestions", "decisionInsights"],
    majors: ["years", "majorRows", "statuses", "roundStatuses"],
    rounds: ["years", "rounds", "roundStatuses"],
    quality: ["years", "statuses", "qualityMetricDefinitions", "warehouseHealth"],
    technical: ["warehouseHealth"],
    warehouse: [],
  };
  for (const [page, fields] of Object.entries(expected)) {
    await t.test(`${page} queries only its dependencies`, async () => {
      const client = fakeClient();
      const result = await dataModule.queryPageSnapshot(client, page, 2567);
      assert.deepEqual(client.calls.map((c) => c.kind).sort(), [...fields].sort());
      for (const call of client.calls) {
        if (page === "overview" && call.kind !== "availableYears") {
          assert.deepEqual(call.values, [2567]);
          assert.match(call.sql, /where (?:\w+\.)?academic_year = \$1/);
          assert.doesNotMatch(call.sql, /2567/);
        } else {
          assert.deepEqual(call.values, []);
          assert.doesNotMatch(call.sql, /\$1/);
        }
      }
      const data = dataModule.pickPageData(page, result.snapshot);
      assert.deepEqual(Object.keys(data).sort(), [...dataModule.pageDataFields[page]].sort());
      if (page === "overview") {
        for (const field of ["years", "rounds", "majorRows", "statuses"]) {
          assert(data[field].every((r) => r.year === 2567));
        }
        assert.deepEqual(data.years, artifact.years.filter((r) => r.year === 2567));
        assert.equal(result.availableYears.length, artifact.years.length);
      } else if (data.years) {
        assert.deepEqual(data.years, artifact.years);
      }
    });
  }
  await t.test("unknown Overview year defaults to latest and never enters SQL", async () => {
    const client = fakeClient();
    const result = await dataModule.queryPageSnapshot(client, "overview", 9999);
    const latest = Math.max(...artifact.years.map((r) => r.year));
    assert.equal(result.selectedYear, latest);
    assert.deepEqual(client.calls[1].values, [latest]);
  });
  await t.test("optional query failure retains its artifact field", async () => {
    const result = await dataModule.queryPageSnapshot(fakeClient({ fail: "roundStatuses" }), "rounds");
    assert.deepEqual(result.snapshot.roundStatuses, artifact.roundStatuses);
    assert.equal(result.snapshot.runtime.source, "live-neon");
  });
  await t.test("required query failure or empty results reject", async () => {
    await assert.rejects(dataModule.queryPageSnapshot(fakeClient({ fail: "years" }), "dashboard"), /Unavailable/);
    await assert.rejects(dataModule.queryPageSnapshot(fakeClient({ empty: "majorRows" }), "majors"), /incomplete/);
  });
  await t.test("Overview fallback is year scoped and Dashboard fallback retains all years", () => {
    const result = dataModule.fallbackPageSnapshot("overview", 2567, "offline");
    assert.deepEqual(result.snapshot.years, artifact.years.filter((r) => r.year === 2567));
    assert.equal(result.snapshot.runtime.fallbackReason, "offline");
    assert.deepEqual(dataModule.fallbackPageSnapshot("dashboard").snapshot.years, artifact.years);
  });
});

test("page loaders isolate caches, share in-flight requests, and close connections", async () => {
  const oldEnv = { DATABASE_URL: process.env.DATABASE_URL, NODE_ENV: process.env.NODE_ENV };
  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = "postgresql://test-only";
  const state = { client: fakeClient(), connections: 0, closed: 0 };
  globalThis[mockKey] = state;
  try {
    const dataModule = await loadModule();
    const [first, second] = await Promise.all([dataModule.loadOverviewPageData(2567), dataModule.loadOverviewPageData(2567)]);
    assert.deepEqual(first, second);
    assert.equal(state.connections, 1);
    const callCount = state.client.calls.length;
    await dataModule.loadOverviewPageData(2567);
    assert.equal(state.client.calls.length, callCount);
    const otherYear = await dataModule.loadOverviewPageData(2568);
    assert(otherYear.years.every((r) => r.year === 2568));
    const dashboard = await dataModule.loadAnalyticsPageData();
    assert.deepEqual(dashboard.years, artifact.years);
    assert.equal(state.connections, 3);
    assert.equal(state.closed, 3);
    await dataModule.loadWarehousePageData();
    assert.equal(state.connections, 3);

    state.client = fakeClient({ fail: "majorRows" });
    const fallback = await dataModule.loadMajorsPageData();
    assert.deepEqual(fallback.majorRows, artifact.majorRows);
    assert.equal(state.connections, 4);
    assert.equal(state.closed, 4);

    delete process.env.DATABASE_URL;
    const rounds = await dataModule.loadRoundsPageData();
    assert.deepEqual(rounds.rounds, artifact.rounds);
    assert.equal(state.connections, 4);
  } finally {
    delete globalThis[mockKey];
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
