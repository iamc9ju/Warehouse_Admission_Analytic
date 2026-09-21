import { connectNeon, type QueryClient } from "./db/neon-client";
import type { DashboardSnapshot } from "./dashboard-types";
import { pageDataFields, type DashboardPage, type LoadedPageSnapshot } from "./page-data-types";
import { getAllYearPeople, getAvailableYears, getYearOverview, getYearStatuses } from "./repositories/overview-repository";
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
  const loadPageEntries = async (year?: number): Promise<[string, unknown][]> => {
    const queries: Partial<{ [K in keyof DashboardSnapshot]: () => Promise<DashboardSnapshot[K]> }> = {
      allYearPeople: () => getAllYearPeople(client),
      years: () => getYearOverview(client, year),
      rounds: () => getRoundOverview(client, year),
      majorRows: () => getMajorConversion(client, year),
      majorStatuses: () => getMajorStatuses(client, year),
      statuses: () => getYearStatuses(client, year),
      roundStatuses: () => getRoundStatuses(client, year),
      businessQuestions: () => getBusinessQuestions(),
      decisionInsights: () => getDecisionInsights(client),
    };

    return Promise.all(pageDataFields[page].map(async (field) => {
      const query = queries[field];
      if (!query) throw new Error(`No live Neon query is registered for ${field}`);
      const value = await query();
      if (value === undefined) throw new Error(`Live Neon returned no ${field}`);
      return [field, value] as [string, unknown];
    }));
  };

  const availableYearsPromise = getAvailableYears(client);
  let availableYears: number[];
  let selectedYear: number;
  let liveEntries: [string, unknown][];

  if (page === "overview") {
    availableYears = await availableYearsPromise;
    selectedYear = selectOverviewYear(availableYears, requestedYear);
    liveEntries = await loadPageEntries(selectedYear);
  } else {
    [availableYears, liveEntries] = await Promise.all([
      availableYearsPromise,
      loadPageEntries(),
    ]);
    selectedYear = selectOverviewYear(availableYears, requestedYear);
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
  return queryPageSnapshot(client, page, requestedYear);
}
