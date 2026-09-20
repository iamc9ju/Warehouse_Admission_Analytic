import { connectNeon, type QueryClient } from "./db/neon-client";
import type { DashboardSnapshot } from "./dashboard-types";
import { pageDataFields, type DashboardPage, type LoadedPageSnapshot } from "./page-data-types";
import { artifactSnapshot, fallbackPageSnapshot, scopeSnapshotToYear, selectOverviewYear } from "./snapshot-fallback";
import { getAvailableYears, getYearOverview, getYearStatuses } from "./repositories/overview-repository";
import { getRoundOverview, getRoundStatuses } from "./repositories/rounds-repository";
import { getMajorConversion } from "./repositories/majors-repository";
import { getQualityMetrics } from "./repositories/quality-repository";
import { getBusinessQuestions, getDecisionInsights } from "./repositories/insights-repository";
import { getWarehouseHealth } from "./repositories/warehouse-repository";

// SQL and row mapping live in repositories; this adapter composes only the page's queries.
export async function queryPageSnapshot(
  client: QueryClient,
  page: DashboardPage,
  requestedYear?: number,
): Promise<LoadedPageSnapshot> {
  const availableYears = page === "overview"
    ? await getAvailableYears(client)
    : artifactSnapshot.years.map((row) => row.year).sort((a, b) => b - a);
  const selectedYear = selectOverviewYear(availableYears, requestedYear);
  const year = page === "overview" ? selectedYear : undefined;
  const fallback = year === undefined ? artifactSnapshot : scopeSnapshotToYear(artifactSnapshot, year);

  const queries: Partial<{ [K in keyof DashboardSnapshot]: () => Promise<DashboardSnapshot[K] | undefined> }> = {
    years: () => getYearOverview(client, year),
    rounds: () => getRoundOverview(client, year),
    majorRows: () => getMajorConversion(client, year),
    statuses: () => getYearStatuses(client, year),
    roundStatuses: () => getRoundStatuses(client, year),
    qualityMetricDefinitions: () => getQualityMetrics(client, fallback.qualityMetricDefinitions),
    businessQuestions: () => getBusinessQuestions(client),
    decisionInsights: () => getDecisionInsights(client),
    warehouseHealth: () => getWarehouseHealth(client),
  };

  // Drain pending queries before the connection is closed, including on failure.
  const results = await Promise.allSettled(pageDataFields[page].map(async (field) => {
    const value = await queries[field]?.();
    return [field, value] as const;
  }));
  const liveEntries: [string, unknown][] = [];
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
    if (result.value[1] !== undefined) liveEntries.push([...result.value]);
  }
  const isLive = liveEntries.length > 0;
  return {
    availableYears,
    selectedYear,
    snapshot: {
      ...fallback,
      ...Object.fromEntries(liveEntries),
      runtime: {
        source: isLive ? "live-neon" : "generated-artifact",
        loadedAt: new Date().toISOString(),
        ...(isLive ? {} : { fallbackReason: "No live data returned for this page" }),
      },
      warehouseSnapshot: isLive ? {
        ...fallback.warehouseSnapshot,
        dashboardMode: "live Neon server-side mart query",
        exportedAt: new Date().toISOString().slice(0, 10),
        sourceSystem: "Neon PostgreSQL",
      } : fallback.warehouseSnapshot,
    },
  };
}

export async function loadLiveNeonSnapshot(
  databaseUrl: string,
  page: DashboardPage,
  requestedYear?: number,
): Promise<LoadedPageSnapshot> {
  // These governance artifacts have no live query in the existing contract.
  if (page === "warehouse") return fallbackPageSnapshot(page);
  const client = await connectNeon(databaseUrl);
  try {
    return await queryPageSnapshot(client, page, requestedYear);
  } finally {
    await client.end();
  }
}
