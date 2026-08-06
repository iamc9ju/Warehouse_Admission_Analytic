import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function TechnicalPage() {
  return <DashboardPage activePage="Technical" snapshot={await loadDashboardSnapshot()} />;
}
