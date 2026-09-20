import { AdmissionsAnalyticsDashboard } from "./analytics-dashboard";
import { loadAnalyticsPageData } from "../data/load-dashboard-snapshot";

export default async function AnalyticsDashboardPage() {
  const snapshot = await loadAnalyticsPageData();
  return <AdmissionsAnalyticsDashboard snapshot={snapshot} />;
}
