import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default function QualityPage() {
  return <DashboardPage activePage="Quality" snapshot={loadDashboardSnapshot()} />;
}
