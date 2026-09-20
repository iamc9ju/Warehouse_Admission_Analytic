import { connectNeon, type QueryClient } from "./db/neon-client";
import type { DashboardSnapshot } from "./dashboard-types";
import { pageDataFields, type DashboardPage, type LoadedPageSnapshot } from "./page-data-types";
import { getAvailableYears, getYearOverview, getYearStatuses } from "./repositories/overview-repository";
import { getRoundOverview, getRoundStatuses } from "./repositories/rounds-repository";
import { getMajorConversion, getMajorStatuses } from "./repositories/majors-repository";
import { getBusinessQuestions, getDecisionInsights } from "./repositories/insights-repository";

function selectOverviewYear(availableYears: number[], requestedYear?: number) {
  const latestYear = availableYears[0];
  if (latestYear === undefined) throw new Error("Live Neon returned no academic years");
  return requestedYear !== undefined && availableYears.includes(requestedYear) ? requestedYear : latestYear;
}

// SQL and row mapping live in repositories; this adapter composes only the page's queries.
export async function queryPageSnapshot(
  client: QueryClient,
  page: DashboardPage,
  requestedYear?: number,
): Promise<LoadedPageSnapshot> {
  const availableYears = await getAvailableYears(client);
  const selectedYear = selectOverviewYear(availableYears, requestedYear);
  const year = page === "overview" ? selectedYear : undefined;

  const queries: Partial<{ [K in keyof DashboardSnapshot]: () => Promise<DashboardSnapshot[K]> }> = {
    years: () => getYearOverview(client, year),
    rounds: () => getRoundOverview(client, year),
    majorRows: () => getMajorConversion(client, year),
    majorStatuses: () => getMajorStatuses(client, year),
    statuses: () => getYearStatuses(client, year),
    roundStatuses: () => getRoundStatuses(client, year),
    businessQuestions: () => getBusinessQuestions(client),
    decisionInsights: () => getDecisionInsights(client),
  };

  const liveEntries: [string, unknown][] = [];
  for (const field of pageDataFields[page]) {
    const query = queries[field];
    if (!query) throw new Error(`No live Neon query is registered for ${field}`);
    const value = await query();
    if (value === undefined) throw new Error(`Live Neon returned no ${field}`);
    liveEntries.push([field, value]);
  }
  return {
    availableYears,
    selectedYear,
    snapshot: {
      ...Object.fromEntries(liveEntries),
      runtime: {
        source: "live-neon",
        loadedAt: new Date().toISOString(),
      },
    },
  };
}

export async function loadLiveNeonSnapshot(
  databaseUrl: string,
  page: DashboardPage,
  requestedYear?: number,
): Promise<LoadedPageSnapshot> {
  const client = await connectNeon(databaseUrl);
  try {
    return await queryPageSnapshot(client, page, requestedYear);
  } finally {
    await client.end();
  }
}
