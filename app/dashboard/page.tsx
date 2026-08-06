import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function AnalyticsDashboardPage() {
  return <DashboardPage activePage="Dashboard" snapshot={await loadDashboardSnapshot()} />;
}
