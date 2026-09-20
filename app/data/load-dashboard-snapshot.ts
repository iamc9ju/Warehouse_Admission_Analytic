import { loadLiveNeonSnapshot } from "./live-neon-dashboard-adapter";
import { pickPageData, type DashboardPage, type LoadedPageSnapshot, type OverviewPageData } from "./page-data-types";

const SNAPSHOT_CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 0;
const snapshotCache = new Map<string, { value: LoadedPageSnapshot; expiresAt: number }>();
const snapshotRequests = new Map<string, Promise<LoadedPageSnapshot>>();

async function loadFreshPage(page: DashboardPage, year?: number): Promise<LoadedPageSnapshot> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required because the dashboard runs in Neon-only mode");
  try {
    return await loadLiveNeonSnapshot(databaseUrl, page, year);
  } catch (error) {
    console.error(`Failed to load live Neon data for ${page}`, error);
    throw error;
  }
}

async function loadPageSnapshot(page: DashboardPage, year?: number): Promise<LoadedPageSnapshot> {
  const key = `${page}:${year ?? "default"}`;
  const now = Date.now();
  for (const [cachedKey, entry] of snapshotCache) {
    if (entry.expiresAt <= now) snapshotCache.delete(cachedKey);
  }
  const cached = snapshotCache.get(key);
  if (cached) return cached.value;
  const pending = snapshotRequests.get(key);
  if (pending) return pending;

  const request = loadFreshPage(page, year)
    .then((value) => {
      if (SNAPSHOT_CACHE_TTL_MS > 0) {
        snapshotCache.set(key, { value, expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS });
      }
      return value;
    })
    .finally(() => snapshotRequests.delete(key));
  snapshotRequests.set(key, request);
  return request;
}

async function loadPageData<P extends DashboardPage>(page: P) {
  return pickPageData(page, (await loadPageSnapshot(page)).snapshot);
}

export async function loadOverviewPageData(requestedYear?: number): Promise<OverviewPageData> {
  const year = requestedYear !== undefined && Number.isSafeInteger(requestedYear) && requestedYear > 0 && requestedYear <= 9999
    ? requestedYear : undefined;
  const result = await loadPageSnapshot("overview", year);
  return {
    ...pickPageData("overview", result.snapshot),
    availableYears: result.availableYears,
    selectedYear: result.selectedYear,
  };
}

export const loadAnalyticsPageData = () => loadPageData("dashboard");
export const loadInsightsPageData = () => loadPageData("insights");
export const loadMajorsPageData = () => loadPageData("majors");
export const loadRoundsPageData = () => loadPageData("rounds");
