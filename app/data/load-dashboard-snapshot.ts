import snapshot from "./generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot } from "./dashboard-types";
import { loadLiveNeonSnapshot } from "./live-neon-dashboard-adapter";

const SNAPSHOT_CACHE_TTL_MS = 5 * 60 * 1000;

let snapshotCache: { value: DashboardSnapshot; expiresAt: number } | undefined;
let snapshotRequest: Promise<DashboardSnapshot> | undefined;

function fallbackSnapshot(reason?: string): DashboardSnapshot {
  return {
    ...(snapshot as DashboardSnapshot),
    runtime: {
      source: "generated-artifact",
      loadedAt: new Date().toISOString(),
      fallbackReason: reason,
    },
  };
}

async function loadFreshDashboardSnapshot(): Promise<DashboardSnapshot> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return fallbackSnapshot("DATABASE_URL is not configured");
  }

  try {
    return await loadLiveNeonSnapshot(databaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown live Neon query error";
    return fallbackSnapshot(message);
  }
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const now = Date.now();

  if (snapshotCache && snapshotCache.expiresAt > now) {
    return snapshotCache.value;
  }

  if (snapshotRequest) {
    return snapshotRequest;
  }

  snapshotRequest = loadFreshDashboardSnapshot()
    .then((value) => {
      snapshotCache = {
        value,
        expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
      };
      return value;
    })
    .finally(() => {
      snapshotRequest = undefined;
    });

  return snapshotRequest;
}
