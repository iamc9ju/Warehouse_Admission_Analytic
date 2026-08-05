import snapshot from "./generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot } from "./dashboard-types";

export function loadDashboardSnapshot(): DashboardSnapshot {
  return snapshot as DashboardSnapshot;
}
