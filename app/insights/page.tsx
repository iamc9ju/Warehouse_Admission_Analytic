import { AdmissionsDecisionCenter } from "./admissions-decision-center";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function InsightsPage() {
  const snapshot = await loadDashboardSnapshot();
  return <AdmissionsDecisionCenter snapshot={snapshot} />;
}
