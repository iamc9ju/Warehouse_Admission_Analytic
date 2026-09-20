import type { QueryClient } from "../db/neon-client";
import type { DashboardSnapshot } from "../dashboard-types";
import { requiredRows } from "./query-helpers";

export async function getQualityMetrics(
  client: QueryClient,
  definitions: DashboardSnapshot["qualityMetricDefinitions"],
): Promise<DashboardSnapshot["qualityMetricDefinitions"]> {
  const rows = await requiredRows(client, `
    select metric_name, metric_value, source_object, validation_rule
    from admissions_dw.vw_dw_quality_scorecard
    order by metric_name
  `);
  const byLabel = new Map(definitions.map((metric) => [metric.label, metric]));
  return rows.map((row) => ({
    label: String(row.metric_name),
    value: String(row.metric_value),
    sourceObject: String(row.source_object),
    definition: byLabel.get(String(row.metric_name))?.definition ?? "Warehouse quality scorecard metric",
    rule: String(row.validation_rule),
  }));
}
