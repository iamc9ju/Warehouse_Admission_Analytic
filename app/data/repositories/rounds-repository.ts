import type { QueryClient } from "../db/neon-client";
import type { DashboardSnapshot, RoundRow, RoundStatusRow } from "../dashboard-types";
import { numberValue, requiredRows } from "./query-helpers";

export async function getRightsOutcomes(client: QueryClient, grain: "round" | "major" = "round"): Promise<DashboardSnapshot["rightsOutcomes"]> {
  const group = grain === "major" ? "f.major_key::text" : "r.tcas_round_code";
  const rows = await requiredRows(client, `
    /* ${grain === "major" ? "major-rights-outcomes" : "round-rights-outcomes"} */
    /* rights-outcomes-distinct-people */
    with categories as (
      select y.academic_year, ${group} as tcas_round_code, f.student_key,
        case when s.tcas_status = 'ยืนยันสิทธิ์' then 'confirmed'
          when s.tcas_status in ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2') then 'resigned'
          when s.tcas_status = 'ไม่ใช้สิทธิ์' then 'unused'
          when s.tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ' then 'inactive'
          when s.tcas_status = 'ยืนยันที่อื่นแล้ว' then 'elsewhere'
          else 'other' end as category
      from admissions_dw.fact_admission f
      join admissions_dw.dim_year y using(year_key)
      join admissions_dw.dim_tcas_round r using(round_key)
      join admissions_dw.dim_tcas_status s using(status_key)
      where s.tcas_status in ('ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2',
        'ไม่ใช้สิทธิ์', 'ไม่เข้าระบบมาดำเนินการใดๆ', 'ยืนยันที่อื่นแล้ว',
        'ผ่านการคัดเลือก', 'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2')
    ), people as (
      select academic_year, tcas_round_code, student_key,
        case when count(distinct category) > 1 then 'multiple' else min(category) end as category
      from categories group by academic_year, tcas_round_code, student_key
    )
    select academic_year, tcas_round_code, count(*) as eligible,
      count(*) filter(where category = 'confirmed') as confirmed,
      count(*) filter(where category = 'resigned') as resigned,
      count(*) filter(where category = 'unused') as unused,
      count(*) filter(where category = 'inactive') as inactive,
      count(*) filter(where category = 'elsewhere') as elsewhere,
      count(*) filter(where category = 'other') as other,
      count(*) filter(where category = 'multiple') as multiple
    from people group by academic_year, tcas_round_code order by academic_year, tcas_round_code
  `);
  return rows.map(row => ({
    year: numberValue(row.academic_year, 'academic_year'), code: String(row.tcas_round_code),
    confirmed: numberValue(row.confirmed, 'confirmed'), resigned: numberValue(row.resigned, 'resigned'),
    unused: numberValue(row.unused, 'unused'), inactive: numberValue(row.inactive, 'inactive'),
    elsewhere: numberValue(row.elsewhere, 'elsewhere'),
    other: numberValue(row.other, 'other'), multiple: numberValue(row.multiple, 'multiple'),
    eligible: numberValue(row.eligible, 'eligible'),
  }));
}

export async function getRoundOverview(client: QueryClient, year?: number): Promise<RoundRow[]> {
  const rows = await requiredRows(client, `
    select r.academic_year, r.tcas_round_code, r.tcas_round_name, r.choices,
      r.unique_applicants, r.confirmed_applicants, r.confirmed_rate, r.source_files,
      r.eligible_applicants
    from admissions_dw.vw_admission_round_overview r
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
    eligible: numberValue(row.eligible_applicants, "eligible_applicants"),
    rate: numberValue(row.confirmed_rate, "confirmed_rate"),
    files: numberValue(row.source_files, "source_files"),
  }));
}

export async function getRoundStatuses(client: QueryClient, year?: number): Promise<RoundStatusRow[]> {
  const rows = await requiredRows(client, `
    select academic_year, tcas_round_code, tcas_round_name, tcas_status, application_choices, unique_applicants
    from admissions_dw.vw_admission_round_status_distribution
    ${year === undefined ? "" : "where academic_year = $1"}
    order by academic_year, tcas_round_code, tcas_status
  `, year);
  return rows.map((row) => ({
    year: numberValue(row.academic_year, "academic_year"),
    code: String(row.tcas_round_code),
    name: String(row.tcas_round_name),
    label: String(row.tcas_status),
    choices: numberValue(row.application_choices, "application_choices"),
    applicants: numberValue(row.unique_applicants, "unique_applicants"),
  }));
}
