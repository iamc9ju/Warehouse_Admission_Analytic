import { AdmissionsAnalyticsDashboard } from "./analytics-dashboard";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function AnalyticsDashboardPage() {
  const snapshot = await loadDashboardSnapshot();
  return <AdmissionsAnalyticsDashboard snapshot={snapshot} />;
}
