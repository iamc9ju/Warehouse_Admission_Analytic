import { RoundsView } from "./rounds-view";
import { loadRoundsPageData } from "../data/load-dashboard-snapshot";

export default async function RoundsPage() {
  return <RoundsView snapshot={await loadRoundsPageData()} />;
}
