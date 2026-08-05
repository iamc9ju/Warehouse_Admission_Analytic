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
const quality = snapshot.qualityMetricDefinitions;
const catalog = snapshot.dataCatalogRows;
const lineage = snapshot.lineageEdges;

assert(snapshot.warehouseSnapshot.dashboardMode === "generated warehouse mart artifact", "dashboard must use generated warehouse artifact mode");
assert(snapshot.warehouseSnapshot.activeSourceGroups === 1, "only one active source group is allowed");
assert(snapshot.warehouseSnapshot.piiExportedColumns === 0, "PII columns must never be exported");
assert(snapshot.warehouseSnapshot.sourceRows === 9432, "source row count must reconcile to 9,432");
assert(years.length === 2, "expected two academic year rows");
assert(rounds.length === 8, "expected TCAS1-4 rows for two years");
assert(catalog.length === snapshot.warehouseSnapshot.catalogRows, "catalog row count mismatch");
assert(lineage.length === snapshot.warehouseSnapshot.lineageEdges, "lineage edge count mismatch");
assert(quality.some((metric) => metric.label === "Missing score" && metric.value === "0"), "missing score quality metric must be zero");
assert(quality.some((metric) => metric.label === "PII exported" && metric.value === "0 columns"), "PII quality metric must be zero columns");
assert(snapshot.etlValidationChecks.every((check) => check[2] === "pass"), "all ETL checks must pass");

for (const year of years) {
  assert([2568, 2569].includes(year.year), `unexpected academic year ${year.year}`);
  assert(year.choices > 0 && year.applicants > 0, `empty KPI data for ${year.year}`);
}

for (const round of ["TCAS1", "TCAS2", "TCAS3", "TCAS4"]) {
  for (const year of [2568, 2569]) {
    assert(rounds.some((row) => row.year === year && row.code === round), `missing ${year} ${round}`);
  }
}

const serialized = JSON.stringify(snapshot);
assert(!/YouTube|Facebook|TikTok|Pantip|social listening|public mention/i.test(serialized), "social media data is forbidden");
assert(!/citizen_id|phone|email|full_name|เลขบัตร|เบอร์โทร/i.test(serialized), "PII fields are forbidden in dashboard artifact");

console.log("Dashboard snapshot validation passed");
