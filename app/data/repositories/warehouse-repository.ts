import type { QueryClient } from "../db/neon-client";
import type { DashboardSnapshot } from "../dashboard-types";
import { numberValue, optionalRows } from "./query-helpers";

export async function getWarehouseHealth(client: QueryClient): Promise<DashboardSnapshot["warehouseHealth"] | undefined> {
  const rows = await optionalRows(client, `
    select health_id, status, last_refresh_at, freshness_sla_hours, source_rows, source_files, mart_count,
      quality_checks_passed, quality_checks_failed, pii_exported_columns, artifact_checksum, notes
    from admissions_dw.vw_dw_refresh_health
    order by last_refresh_at desc
    limit 1
  `);
  if (!rows) return undefined;
  const row = rows[0];
  return {
    id: String(row.health_id),
    status: String(row.status) as DashboardSnapshot["warehouseHealth"]["status"],
    lastRefreshAt: String(row.last_refresh_at),
    freshnessSlaHours: numberValue(row.freshness_sla_hours, "freshness_sla_hours"),
    sourceRows: numberValue(row.source_rows, "source_rows"),
    sourceFiles: numberValue(row.source_files, "source_files"),
    martCount: numberValue(row.mart_count, "mart_count"),
    qualityChecksPassed: numberValue(row.quality_checks_passed, "quality_checks_passed"),
    qualityChecksFailed: numberValue(row.quality_checks_failed, "quality_checks_failed"),
    piiExportedColumns: numberValue(row.pii_exported_columns, "pii_exported_columns"),
    artifactChecksum: String(row.artifact_checksum),
    notes: String(row.notes),
  };
}

export async function getDecisionMartContract(client: QueryClient): Promise<DashboardSnapshot["decisionMartContract"] | undefined> {
  const rows = await optionalRows(client, `
    select mart_object, grain, source_objects, purpose
    from admissions_dw.dw_decision_mart_contract
    order by mart_object
  `);
  return rows?.map((row) => ({
    martObject: String(row.mart_object),
    grain: String(row.grain),
    sourceObjects: String(row.source_objects),
    purpose: String(row.purpose),
  }));
}
