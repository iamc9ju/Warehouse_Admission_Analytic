import type { QueryClient } from "../db/neon-client";
import type { RoundRow, RoundStatusRow } from "../dashboard-types";
import { eligibleStudentCount, numberValue, optionalNumberValue, optionalRows, requiredRows } from "./query-helpers";

export async function getRoundOverview(client: QueryClient, year?: number): Promise<RoundRow[]> {
  const rows = await requiredRows(client, `
    select r.academic_year, r.tcas_round_code, r.tcas_round_name, r.choices,
      r.unique_applicants, r.confirmed_applicants, r.confirmed_rate, r.source_files,
      coalesce(e.eligible_count, 0) as eligible_count
    from admissions_dw.vw_admission_round_overview r
    left join (
      select y.academic_year, rd.tcas_round_code, ${eligibleStudentCount} as eligible_count
      from admissions_dw.fact_admission f
      join admissions_dw.dim_year y on f.year_key = y.year_key
      join admissions_dw.dim_tcas_round rd on f.round_key = rd.round_key
      join admissions_dw.dim_tcas_status s on f.status_key = s.status_key
      ${year === undefined ? "" : "where y.academic_year = $1"}
      group by y.academic_year, rd.tcas_round_code
    ) e on r.academic_year = e.academic_year and r.tcas_round_code = e.tcas_round_code
    ${year === undefined ? "" : "where r.academic_year = $1"}
    order by r.academic_year, r.tcas_round_code
  `, year);
  return rows.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.tcas_round_code),
    name: String(row.tcas_round_name),
    choices: numberValue(row.choices, "choices"),
    applicants: numberValue(row.unique_applicants, "unique_applicants"),
    confirmed: numberValue(row.confirmed_applicants, "confirmed_applicants"),
    eligible: optionalNumberValue(row.eligible_count, "eligible_count"),
    rate: numberValue(row.confirmed_rate, "confirmed_rate"),
    files: numberValue(row.source_files, "source_files"),
  }));
}

export async function getRoundStatuses(client: QueryClient, year?: number): Promise<RoundStatusRow[] | undefined> {
  const rows = await optionalRows(client, `
    select academic_year, tcas_round_code, tcas_round_name, tcas_status, application_choices, unique_applicants
    from admissions_dw.vw_admission_round_status_distribution
    ${year === undefined ? "" : "where academic_year = $1"}
    order by academic_year, tcas_round_code, tcas_status
  `, year);
  return rows?.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.tcas_round_code),
    name: String(row.tcas_round_name),
    label: String(row.tcas_status),
    choices: numberValue(row.application_choices, "application_choices"),
    applicants: numberValue(row.unique_applicants, "unique_applicants"),
  }));
}
