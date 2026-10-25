import type { MajorRow, RoundRow } from "../data/dashboard-types";

// SQL counts distinct (year, student) pairs per group for all-year totals.
// Latest-year mode continues using annual rows.
export function groupInsightRows<T extends MajorRow | RoundRow>(rows: T[], scope: "all" | "latest", latestYear: number, allYearRows: T[]): T[] {
  return scope === "all" ? [...allYearRows] : rows.filter(row => row.year === latestYear);
}
