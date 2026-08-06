import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function QualityPage() {
  return <DashboardPage activePage="Quality" snapshot={await loadDashboardSnapshot()} />;
}
