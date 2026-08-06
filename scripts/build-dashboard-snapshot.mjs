import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "warehouse", "query-results");
const outputPath = path.join(root, "app", "data", "generated", "warehouse-dashboard-snapshot.json");

function toNumber(value, field) {
  const normalized = String(value ?? "").replaceAll(",", "").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric ${field}, received "${value}"`);
  }
  return parsed;
}

function optionalNumber(value, field) {
  if (value === undefined || value === "") return undefined;
  return toNumber(value, field);
}

async function readTsv(filename) {
  const text = await readFile(path.join(sourceDir, filename), "utf8");
  const rows = text.trim().split(/\r?\n/);
  const headers = rows.shift()?.split("\t") ?? [];
  return rows.map((row) => {
    const values = row.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

const [metadataRow] = await readTsv("warehouse_snapshot_metadata.tsv");
const years = (await readTsv("dashboard_kpi_snapshot.tsv")).map((row) => ({
  year: toNumber(row.academic_year, "academic_year"),
  choices: toNumber(row.application_choices, "application_choices"),
  applicants: toNumber(row.unique_applicants, "unique_applicants"),
  confirmed: toNumber(row.confirmed_applicants, "confirmed_applicants"),
  rate: toNumber(row.confirmed_rate, "confirmed_rate"),
  sourceFiles: toNumber(row.source_files, "source_files"),
  avgScore: toNumber(row.avg_score, "avg_score"),
}));

const majorRows = (await readTsv("major_conversion.tsv")).map((row) => ({
  year: toNumber(row.academic_year, "academic_year"),
  code: row.major_code,
  name: row.major_name,
  type: row.major_type,
  applicants: toNumber(row.applicant_count, "applicant_count"),
  confirmed: toNumber(row.confirmed_count, "confirmed_count"),
  rate: toNumber(row.confirmed_rate, "confirmed_rate"),
  avgScore: toNumber(row.avg_score, "avg_score"),
  applicantChange: optionalNumber(row.applicant_change, "applicant_change"),
}));

const statuses = (await readTsv("status_distribution.tsv")).map((row) => ({
  year: toNumber(row.academic_year, "academic_year"),
  label: row.status_label,
  choices: toNumber(row.choices, "choices"),
  share: toNumber(row.share, "share"),
  tone: row.tone,
}));

const rounds = (await readTsv("round_overview.tsv")).map((row) => ({
  year: toNumber(row.academic_year, "academic_year"),
  code: row.tcas_round_code,
  name: row.tcas_round_name,
  choices: toNumber(row.choices, "choices"),
  applicants: toNumber(row.unique_applicants, "unique_applicants"),
  confirmed: toNumber(row.confirmed_applicants, "confirmed_applicants"),
  rate: toNumber(row.confirmed_rate, "confirmed_rate"),
  files: toNumber(row.source_files, "source_files"),
}));

const roundStatuses = (await readTsv("round_status_distribution.tsv")).map((row) => ({
  year: toNumber(row.academic_year, "academic_year"),
  code: row.tcas_round_code,
  name: row.tcas_round_name,
  label: row.status_label,
  choices: toNumber(row.choices, "choices"),
  applicants: toNumber(row.unique_applicants, "unique_applicants"),
}));

const qualityMetricDefinitions = (await readTsv("quality_scorecard.tsv")).map((row) => ({
  label: row.metric_name,
  value: row.metric_value,
  sourceObject: row.source_object,
  definition: row.definition,
  rule: row.validation_rule,
}));

const dataCatalogRows = (await readTsv("dataset_catalog.tsv")).map((row) => [
  row.dataset,
  row.layer,
  row.grain,
  row.evidence,
  row.sensitivity,
]);

const lineageEdges = (await readTsv("lineage_edges.tsv")).map((row) => [
  row.from_object,
  row.to_object,
  row.transform,
]);

const etlValidationChecks = (await readTsv("etl_validation_checks.tsv")).map((row) => [
  row.check_name,
  row.evidence,
  row.result,
]);

const warehouseQueries = (await readTsv("dashboard_query_contract.tsv")).map((row) => ({
  name: row.name,
  object: row.object,
  sql: row.sql,
}));

const businessQuestions = (await readTsv("business_questions.tsv")).map((row) => ({
  id: row.question_id,
  domain: row.domain,
  question: row.question,
  martObject: row.mart_object,
  metrics: row.metrics.split(",").map((metric) => metric.trim()),
  decisionOwner: row.decision_owner,
  decisionUse: row.decision_use,
  qualityGate: row.quality_gate,
}));

const decisionInsights = (await readTsv("decision_insights.tsv")).map((row) => ({
  id: row.insight_id,
  businessQuestionId: row.business_question_id,
  priority: toNumber(row.priority, "priority"),
  category: row.category,
  title: row.title,
  summary: row.summary,
  martObject: row.mart_object,
  metricLabel: row.metric_label,
  metricValue: row.metric_value,
  decision: row.decision,
  recommendedAction: row.recommended_action,
  confidence: row.confidence,
  qualityGate: row.quality_gate,
}));

const [warehouseHealthRow] = await readTsv("warehouse_health.tsv");
const warehouseHealth = {
  id: warehouseHealthRow.health_id,
  status: warehouseHealthRow.status,
  lastRefreshAt: warehouseHealthRow.last_refresh_at,
  freshnessSlaHours: toNumber(warehouseHealthRow.freshness_sla_hours, "freshness_sla_hours"),
  sourceRows: toNumber(warehouseHealthRow.source_rows, "source_rows"),
  sourceFiles: toNumber(warehouseHealthRow.source_files, "source_files"),
  martCount: toNumber(warehouseHealthRow.mart_count, "mart_count"),
  qualityChecksPassed: toNumber(warehouseHealthRow.quality_checks_passed, "quality_checks_passed"),
  qualityChecksFailed: toNumber(warehouseHealthRow.quality_checks_failed, "quality_checks_failed"),
  piiExportedColumns: toNumber(warehouseHealthRow.pii_exported_columns, "pii_exported_columns"),
  artifactChecksum: warehouseHealthRow.artifact_checksum,
  notes: warehouseHealthRow.notes,
};

const decisionMartContract = (await readTsv("decision_mart_contract.tsv")).map((row) => ({
  martObject: row.mart_object,
  grain: row.grain,
  sourceObjects: row.source_objects,
  purpose: row.purpose,
}));

const snapshot = {
  runtime: {
    source: "generated-artifact",
    loadedAt: `${metadataRow.exported_at}T00:00:00+07:00`,
  },
  warehouseSnapshot: {
    exportedAt: metadataRow.exported_at,
    sourceSystem: metadataRow.source_system,
    schema: metadataRow.schema,
    dashboardMode: metadataRow.dashboard_mode,
    sourceRows: toNumber(metadataRow.source_rows, "source_rows"),
    activeSourceGroups: toNumber(metadataRow.active_source_groups, "active_source_groups"),
    sourceFiles: toNumber(metadataRow.source_files, "source_files"),
    catalogRows: toNumber(metadataRow.catalog_rows, "catalog_rows"),
    lineageEdges: toNumber(metadataRow.lineage_edges, "lineage_edges"),
    piiExportedColumns: toNumber(metadataRow.pii_exported_columns, "pii_exported_columns"),
    sourceQuery: metadataRow.source_query,
  },
  years,
  majorRows,
  statuses,
  rounds,
  roundStatuses,
  qualityMetricDefinitions,
  dataCatalogRows,
  lineageEdges,
  etlValidationChecks,
  warehouseQueries,
  businessQuestions,
  decisionInsights,
  warehouseHealth,
  decisionMartContract,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Built dashboard snapshot: ${path.relative(root, outputPath)}`);
