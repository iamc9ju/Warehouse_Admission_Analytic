import { QualityView } from "./quality-view";
import { loadQualityPageData } from "../data/load-dashboard-snapshot";

export default async function QualityPage() {
  return <QualityView snapshot={await loadQualityPageData()} />;
}
