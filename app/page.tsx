import { OverviewView } from "./overview-view";
import { loadDashboardSnapshot } from "./data/load-dashboard-snapshot";

export default async function Home() {
  const snapshot = await loadDashboardSnapshot();
  return <OverviewView snapshot={snapshot} />;
}
