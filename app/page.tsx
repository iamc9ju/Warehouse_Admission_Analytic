import { DashboardPage } from "./dashboard-page";
import { loadDashboardSnapshot } from "./data/load-dashboard-snapshot";

export default function Home() {
  return <DashboardPage activePage="Overview" snapshot={loadDashboardSnapshot()} />;
}
