import snapshot from "./generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot } from "./dashboard-types";
import { loadLiveNeonSnapshot } from "./live-neon-dashboard-adapter";

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

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
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
