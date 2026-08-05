import { DashboardPage } from "./dashboard-page";
import { loadDashboardSnapshot } from "./data/load-dashboard-snapshot";

export default async function Home() {
  return <DashboardPage activePage="Overview" snapshot={await loadDashboardSnapshot()} />;
}
