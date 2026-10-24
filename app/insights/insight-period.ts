import type { MajorRow, RoundRow } from "../data/dashboard-types";

// Annual distinct counts are summed; a person appearing in two years counts in each year.
export function groupInsightRows<T extends MajorRow | RoundRow>(rows: T[], scope: "all" | "latest", latestYear: number): T[] {
  if (scope === "latest") return rows.filter(row => row.year === latestYear);
  const groups = new Map<string, T>();
  for (const row of rows) {
    const key = "majorKey" in row ? row.majorKey : row.code;
    const previous = groups.get(key);
    if (!previous) {
      groups.set(key, { ...row });
      continue;
    }
    const applicants = previous.applicants + row.applicants;
    const confirmed = previous.confirmed + row.confirmed;
    const eligible = previous.eligible === undefined || row.eligible === undefined
      ? undefined : previous.eligible + row.eligible;
    groups.set(key, { ...previous, applicants, confirmed, eligible,
      choices: previous.choices + row.choices,
      rate: eligible && eligible > 0 ? confirmed / eligible * 100 : 0 });
  }
  return [...groups.values()];
}
