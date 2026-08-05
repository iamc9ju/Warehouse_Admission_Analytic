import { DashboardPage } from "../dashboard-page";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default function WarehousePage() {
  return <DashboardPage activePage="Warehouse" snapshot={loadDashboardSnapshot()} />;
}
