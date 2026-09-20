import artifact from "./generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot } from "./dashboard-types";
import type { DashboardPage, LoadedPageSnapshot } from "./page-data-types";

export const artifactSnapshot = artifact as DashboardSnapshot;

export function selectOverviewYear(availableYears: number[], requestedYear?: number) {
  return requestedYear !== undefined && availableYears.includes(requestedYear)
    ? requestedYear
    : Math.max(...availableYears);
}

export function scopeSnapshotToYear(snapshot: DashboardSnapshot, year: number): DashboardSnapshot {
  return {
    ...snapshot,
    years: snapshot.years.filter((row) => row.year === year),
    rounds: snapshot.rounds.filter((row) => row.year === year),
    majorRows: snapshot.majorRows.filter((row) => row.year === year),
    statuses: snapshot.statuses.filter((row) => row.year === year),
    roundStatuses: snapshot.roundStatuses.filter((row) => row.year === year),
  };
}

export function fallbackPageSnapshot(page: DashboardPage, requestedYear?: number, reason?: string): LoadedPageSnapshot {
  const availableYears = artifactSnapshot.years.map((row) => row.year).sort((a, b) => b - a);
  const selectedYear = selectOverviewYear(availableYears, requestedYear);
  const snapshot = page === "overview" ? scopeSnapshotToYear(artifactSnapshot, selectedYear) : artifactSnapshot;
  return {
    snapshot: {
      ...snapshot,
      runtime: { source: "generated-artifact", loadedAt: new Date().toISOString(), fallbackReason: reason },
    },
    availableYears,
    selectedYear,
  };
}
