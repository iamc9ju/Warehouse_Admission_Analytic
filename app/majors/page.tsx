import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function MajorsPage() {
  return <DashboardPage activePage="Majors" snapshot={await loadDashboardSnapshot()} />;
}
