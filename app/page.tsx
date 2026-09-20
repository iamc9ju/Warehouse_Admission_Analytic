import { OverviewView } from "./overview-view";
import { loadOverviewPageData } from "./data/load-dashboard-snapshot";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const params = await searchParams;
  const year = typeof params.year === "string" && /^\d{4}$/.test(params.year) ? Number(params.year) : undefined;
  const snapshot = await loadOverviewPageData(year);
  return <OverviewView snapshot={snapshot} />;
}
