import { MajorsView } from "./majors-view";
import { loadMajorsPageData } from "../data/load-dashboard-snapshot";

export default async function MajorsPage() {
  return <MajorsView snapshot={await loadMajorsPageData()} />;
}
