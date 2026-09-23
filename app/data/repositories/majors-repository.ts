import type { QueryClient } from "../db/neon-client";
import type { MajorRow, MajorStatusRow } from "../dashboard-types";
import { numberValue, optionalNumberValue, requiredRows } from "./query-helpers";

export async function getMajorConversion(client: QueryClient, year?: number): Promise<MajorRow[]> {
  const rows = await requiredRows(client, `
    select m.major_key, m.academic_year, m.major_code, m.major_name, m.program_type, m.applicant_count,
      m.confirmed_count, m.confirmed_rate, m.avg_score, m.applicant_change,
      m.application_choices, m.eligible_count
    from admissions_dw.mart_major_conversion m
    ${year === undefined ? "" : "where m.academic_year = $1"}
    order by m.academic_year, m.applicant_count desc
  `, year);
  return rows.map((row) => ({
    majorKey: String(row.major_key),
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.major_code),
    name: String(row.major_name),
    type: String(row.program_type),
    applicants: numberValue(row.applicant_count, "applicant_count"),
    choices: numberValue(row.application_choices, "application_choices"),
    confirmed: numberValue(row.confirmed_count, "confirmed_count"),
    eligible: optionalNumberValue(row.eligible_count, "eligible_count"),
    rate: numberValue(row.confirmed_rate, "confirmed_rate"),
    avgScore: numberValue(row.avg_score, "avg_score"),
    applicantChange: optionalNumberValue(row.applicant_change, "applicant_change"),
  }));
}

export async function getMajorStatuses(client: QueryClient, year?: number): Promise<MajorStatusRow[]> {
  const rows = await requiredRows(client, `
    select major_key, academic_year, major_code, major_name, tcas_status,
      application_choices, unique_applicants
    from admissions_dw.vw_admission_major_status_distribution
    ${year === undefined ? "" : "where academic_year = $1"}
    order by academic_year, major_code, tcas_status
  `, year);
  return rows.map((row) => ({
    majorKey: String(row.major_key),
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.major_code),
    name: String(row.major_name),
    label: String(row.tcas_status),
    choices: numberValue(row.application_choices, "application_choices"),
    applicants: numberValue(row.unique_applicants, "unique_applicants"),
  }));
}
