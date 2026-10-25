import type { QueryClient } from "../db/neon-client";
import type { MajorRow, MajorStatusRow, Tcas3ScoreRow } from "../dashboard-types";
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


export async function getTcas3Scores(client: QueryClient): Promise<Tcas3ScoreRow[]> {
  const rows = await requiredRows(client, `
    /* tcas3-person-score-averages */
    with people as (
      select y.academic_year, m.major_key, m.major_id as major_code, m.major_name,
        m.major_type as program_type, f.student_key,
        avg(f.score) as applicant_score,
        avg(f.score) filter(where s.tcas_status = 'ยืนยันสิทธิ์') as confirmed_score,
        bool_or(s.tcas_status = 'ยืนยันสิทธิ์') as confirmed
      from admissions_dw.fact_admission f
      join admissions_dw.dim_year y using(year_key)
      join admissions_dw.dim_major m using(major_key)
      join admissions_dw.dim_tcas_round r using(round_key)
      join admissions_dw.dim_tcas_status s using(status_key)
      where r.tcas_round_code = 'TCAS3'
      group by y.academic_year, m.major_key, m.major_id, m.major_name, m.major_type, f.student_key
    )
    select academic_year, major_key, major_code, major_name, program_type,
      count(*) as applicants, count(*) filter(where confirmed) as confirmed,
      avg(applicant_score) as applicant_avg_score,
      avg(confirmed_score) as confirmed_avg_score
    from people
    group by academic_year, major_key, major_code, major_name, program_type
    order by academic_year, major_key
  `);
  return rows.map(row => ({
    year: numberValue(row.academic_year, "academic_year"), majorKey: String(row.major_key),
    code: String(row.major_code), name: String(row.major_name), type: String(row.program_type),
    applicants: numberValue(row.applicants, "applicants"), confirmed: numberValue(row.confirmed, "confirmed"),
    applicantAvgScore: row.applicant_avg_score == null ? null : numberValue(row.applicant_avg_score, "applicant_avg_score"),
    confirmedAvgScore: row.confirmed_avg_score == null ? null : numberValue(row.confirmed_avg_score, "confirmed_avg_score"),
  }));
}
