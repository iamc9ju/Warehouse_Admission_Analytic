import { AdmissionsDecisionCenter } from "./admissions-decision-center";
import { loadInsightsPageData } from "../data/load-dashboard-snapshot";

export default async function InsightsPage() {
  const snapshot = await loadInsightsPageData();
  return <AdmissionsDecisionCenter snapshot={snapshot} />;
}
