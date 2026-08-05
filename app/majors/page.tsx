import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default function MajorsPage() {
  return <DashboardPage activePage="Majors" snapshot={loadDashboardSnapshot()} />;
}
