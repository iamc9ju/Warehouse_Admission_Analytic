import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(root, "app", "data", "generated", "warehouse-dashboard-snapshot.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const years = snapshot.years;
const rounds = snapshot.rounds;
const roundStatuses = snapshot.roundStatuses;
const quality = snapshot.qualityMetricDefinitions;
const catalog = snapshot.dataCatalogRows;
const lineage = snapshot.lineageEdges;
const businessQuestions = snapshot.businessQuestions;
const decisionInsights = snapshot.decisionInsights;
const health = snapshot.warehouseHealth;
const decisionMarts = snapshot.decisionMartContract;

assert(snapshot.runtime.source === "generated-artifact", "generated artifact must declare generated-artifact runtime source");
assert(snapshot.warehouseSnapshot.dashboardMode === "generated warehouse mart artifact", "dashboard must use generated warehouse artifact mode");
assert(snapshot.warehouseSnapshot.activeSourceGroups === 1, "only one active source group is allowed");
assert(snapshot.warehouseSnapshot.piiExportedColumns === 0, "PII columns must never be exported");
assert(snapshot.warehouseSnapshot.sourceRows > 0, "source row count must be greater than zero");
assert(years.length > 0, "expected at least one academic year row");
assert(rounds.length >= years.length * 4, "expected TCAS1-4 rows for every academic year");
assert(roundStatuses.length > 0, "expected status rows split by academic year and TCAS round");
assert(catalog.length === snapshot.warehouseSnapshot.catalogRows, "catalog row count mismatch");
assert(lineage.length === snapshot.warehouseSnapshot.lineageEdges, "lineage edge count mismatch");
assert(quality.some((metric) => metric.label === "Missing score" && metric.value === "0"), "missing score quality metric must be zero");
assert(quality.some((metric) => metric.label === "PII exported" && metric.value === "0 columns"), "PII quality metric must be zero columns");
assert(snapshot.etlValidationChecks.every((check) => check[2] === "pass"), "all ETL checks must pass");
assert(businessQuestions.length >= 15, "expected at least fifteen business questions");
assert(decisionInsights.length >= 10, "expected at least ten decision insights");
assert(decisionMarts.length >= 5, "expected decision mart contract rows");
assert(health.status === "pass", "warehouse health must be pass");
assert(health.sourceRows === snapshot.warehouseSnapshot.sourceRows, "warehouse health source rows mismatch");
assert(health.sourceFiles === snapshot.warehouseSnapshot.sourceFiles, "warehouse health source files mismatch");
assert(health.qualityChecksFailed === 0, "warehouse health must have zero failed quality checks");
assert(health.piiExportedColumns === 0, "warehouse health must have zero PII columns");

const academicYears = [...new Set(years.map((year) => year.year))].sort((first, second) => first - second);

for (const year of years) {
  assert(Number.isInteger(year.year) && year.year >= 2500 && year.year <= 2700, `unexpected academic year ${year.year}`);
  assert(year.choices > 0 && year.applicants > 0, `empty KPI data for ${year.year}`);
}

for (const round of ["TCAS1", "TCAS2", "TCAS3", "TCAS4"]) {
  for (const year of academicYears) {
    assert(rounds.some((row) => row.year === year && row.code === round), `missing ${year} ${round}`);
  }
}

for (const status of roundStatuses) {
  assert(academicYears.includes(status.year), `unexpected round status year ${status.year}`);
  assert(["TCAS1", "TCAS2", "TCAS3", "TCAS4"].includes(status.code), `unexpected round status code ${status.code}`);
  assert(status.label && status.choices >= 0 && status.applicants >= 0, "invalid round status row");
}

const questionIds = new Set(businessQuestions.map((question) => question.id));
const martObjects = new Set(decisionMarts.map((mart) => mart.martObject));
const questionDomains = new Set(businessQuestions.map((question) => question.domain));

for (const domain of ["Demand", "Conversion", "Round Strategy", "Program Portfolio", "Data Trust"]) {
  assert(questionDomains.has(domain), `missing business question domain ${domain}`);
}

for (const insight of decisionInsights) {
  assert(questionIds.has(insight.businessQuestionId), `insight ${insight.id} has no business question mapping`);
  assert(martObjects.has(insight.martObject), `insight ${insight.id} has no decision mart contract`);
  assert(insight.decision && insight.recommendedAction, `insight ${insight.id} must include decision and recommended action`);
  assert(["High", "Medium", "Low"].includes(insight.confidence), `insight ${insight.id} has invalid confidence`);
}

const serialized = JSON.stringify(snapshot);
assert(!/YouTube|Facebook|TikTok|Pantip|social listening|public mention/i.test(serialized), "social media data is forbidden");
assert(!/citizen_id|phone|email|full_name|เลขบัตร|เบอร์โทร/i.test(serialized), "PII fields are forbidden in dashboard artifact");

console.log("Dashboard snapshot validation passed");
