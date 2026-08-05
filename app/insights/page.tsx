import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function InsightsPage() {
  return <DashboardPage activePage="Insights" snapshot={await loadDashboardSnapshot()} />;
}
