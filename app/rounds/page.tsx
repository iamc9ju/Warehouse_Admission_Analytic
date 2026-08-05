import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default function RoundsPage() {
  return <DashboardPage activePage="Rounds" snapshot={loadDashboardSnapshot()} />;
}
