import type { QueryClient } from "../db/neon-client";
import type { StatusRow, YearOverview } from "../dashboard-types";
import { numberValue, requiredRows } from "./query-helpers";

export async function getAvailableYears(client: QueryClient): Promise<number[]> {
  const rows = await requiredRows(client, `
    select distinct academic_year
    from admissions_dw.mart_admissions_executive_summary
    order by academic_year desc
  `);
  return rows.map((row) => numberValue(row.academic_year, "academic_year"));
}

export async function getYearOverview(client: QueryClient, year?: number): Promise<YearOverview[]> {
  const rows = await requiredRows(client, `
    select academic_year, application_choices, unique_applicants, confirmed_applicants,
      confirmed_rate, source_files, avg_score
    from admissions_dw.mart_admissions_executive_summary
    ${year === undefined ? "" : "where academic_year = $1"}
    order by academic_year
  `, year);
  return rows.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    choices: numberValue(row.application_choices, "application_choices"),
    applicants: numberValue(row.unique_applicants, "unique_applicants"),
    confirmed: numberValue(row.confirmed_applicants, "confirmed_applicants"),
    rate: numberValue(row.confirmed_rate, "confirmed_rate"),
    sourceFiles: numberValue(row.source_files, "source_files"),
    avgScore: numberValue(row.avg_score, "avg_score"),
  }));
}

export async function getYearStatuses(client: QueryClient, year?: number): Promise<StatusRow[]> {
  const rows = await requiredRows(client, `
    select academic_year, status_label, sum(choices) as choices,
      round(sum(choices)::numeric * 100
        / nullif(sum(sum(choices)) over (partition by academic_year), 0), 2) as share_pct,
      max(tone) as tone
    from admissions_dw.vw_admission_round_status_distribution
    ${year === undefined ? "" : "where academic_year = $1"}
    group by academic_year, status_label
    order by academic_year, choices desc
  `, year);
  return rows.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    label: String(row.status_label),
    choices: numberValue(row.choices, "choices"),
    share: numberValue(row.share_pct, "share_pct"),
    tone: String(row.tone || "muted") as StatusRow["tone"],
  }));
}
