import type { QueryClient } from "../db/neon-client";
import type { MajorRow } from "../dashboard-types";
import { eligibleStudentCount, numberValue, optionalNumberValue, requiredRows } from "./query-helpers";

export async function getMajorConversion(client: QueryClient, year?: number): Promise<MajorRow[]> {
  const rows = await requiredRows(client, `
    select m.academic_year, m.major_code, m.major_name, m.program_type, m.applicant_count,
      m.confirmed_count, m.confirmed_rate, m.avg_score, m.applicant_change,
      coalesce(e.eligible_count, 0) as eligible_count
    from admissions_dw.mart_major_conversion m
    left join (
      select y.academic_year, mj.major_code, ${eligibleStudentCount} as eligible_count
      from admissions_dw.fact_admission f
      join admissions_dw.dim_year y on f.year_key = y.year_key
      join admissions_dw.dim_major mj on f.major_key = mj.major_key
      join admissions_dw.dim_tcas_status s on f.status_key = s.status_key
      ${year === undefined ? "" : "where y.academic_year = $1"}
      group by y.academic_year, mj.major_code
    ) e on m.academic_year = e.academic_year and m.major_code = e.major_code
    ${year === undefined ? "" : "where m.academic_year = $1"}
    order by m.academic_year, m.applicant_count desc
  `, year);
  return rows.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.major_code),
    name: String(row.major_name),
    type: String(row.program_type),
    applicants: numberValue(row.applicant_count, "applicant_count"),
    confirmed: numberValue(row.confirmed_count, "confirmed_count"),
    eligible: optionalNumberValue(row.eligible_count, "eligible_count"),
    rate: numberValue(row.confirmed_rate, "confirmed_rate"),
    avgScore: numberValue(row.avg_score, "avg_score"),
    applicantChange: optionalNumberValue(row.applicant_change, "applicant_change"),
  }));
}
