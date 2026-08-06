import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function WarehousePage() {
  return <DashboardPage activePage="Warehouse" snapshot={await loadDashboardSnapshot()} />;
}
