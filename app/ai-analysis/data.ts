import { connectNeon } from "../data/db/neon-client";
import { ELIGIBLE_STATUSES, type Fact, type StatusCount, type RightsOutcomes } from "./report-types";

export async function reportDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("ยังไม่ได้ตั้งค่า DATABASE_URL");
  return connectNeon(process.env.DATABASE_URL);
}

// One statement gives all grains the same PostgreSQL snapshot. No identifiers leave the database.
export async function readWarehouse() {
  const db = await reportDatabase();
  const { rows } = await db.query(`
    /* ai-report-aggregate-snapshot */
    with base as (
      select y.academic_year, f.student_key, f.score, f.loaded_at,
        m.major_key, m.major_name, m.major_type, r.tcas_round_code, r.tcas_round_name, s.tcas_status
      from admissions_dw.fact_admission f
      join admissions_dw.dim_year y using(year_key)
      join admissions_dw.dim_major m using(major_key)
      join admissions_dw.dim_tcas_round r using(round_key)
      join admissions_dw.dim_tcas_status s using(status_key)
    ), expanded as (
      select b.*, g.grain, g.entity_key, g.name, g.program_type
      from base b cross join lateral (values
        ('year', 'all', 'ภาพรวม', ''),
        ('major', b.major_key::text, b.major_name, b.major_type),
        ('round', b.tcas_round_code, b.tcas_round_name, ''),
        ('program', b.major_type, b.major_type, b.major_type)
      ) as g(grain, entity_key, name, program_type)
    ), grouped as (
      select academic_year, grain, entity_key, name, program_type,
        count(*) as choices, count(distinct student_key) as applicants,
        count(distinct student_key) filter(where tcas_status = any($1::text[])) as eligible,
        count(distinct student_key) filter(where tcas_status = 'ยืนยันสิทธิ์') as confirmed,
        count(distinct student_key) filter(where tcas_status in ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2')) as resigned,
        round(avg(score), 2) as avg_score, max(loaded_at) as loaded_at
      from expanded group by academic_year, grain, entity_key, name, program_type
    ), status_counts as (
      select academic_year, grain, entity_key, tcas_status, count(*) as choices,
        count(distinct student_key) as applicants
      from expanded group by academic_year, grain, entity_key, tcas_status
    ), status_json as (
      select academic_year, grain, entity_key,
        jsonb_agg(jsonb_build_object('label', tcas_status, 'applicants', applicants, 'choices', choices) order by tcas_status) as statuses
      from status_counts group by academic_year, grain, entity_key
    ), categories as (
      select academic_year, grain, entity_key, student_key,
        case when tcas_status = 'ยืนยันสิทธิ์' then 'confirmed'
          when tcas_status in ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2') then 'resigned'
          when tcas_status = 'ไม่ใช้สิทธิ์' then 'unused'
          when tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ' then 'inactive'
          when tcas_status = 'ยืนยันที่อื่นแล้ว' then 'elsewhere'
          else 'other' end as category
      from expanded where tcas_status = any($1::text[])
    ), people as (
      select academic_year, grain, entity_key, student_key,
        case when count(distinct category) > 1 then 'multiple' else min(category) end as category
      from categories group by academic_year, grain, entity_key, student_key
    ), rights as (
      select academic_year, grain, entity_key, jsonb_build_object(
        'eligible', count(*), 'confirmed', count(*) filter(where category = 'confirmed'),
        'resigned', count(*) filter(where category = 'resigned'), 'unused', count(*) filter(where category = 'unused'),
        'inactive', count(*) filter(where category = 'inactive'), 'elsewhere', count(*) filter(where category = 'elsewhere'),
        'other', count(*) filter(where category = 'other'), 'multiple', count(*) filter(where category = 'multiple')
      ) as rights_outcomes
      from people group by academic_year, grain, entity_key
    )
    select grouped.*, statuses, rights_outcomes, round(confirmed * 100.0 / nullif(applicants, 0), 2) as rate,
      round(confirmed * 100.0 / nullif(eligible, 0), 2) as eligible_rate
    from grouped join status_json using(academic_year, grain, entity_key)
    left join rights using(academic_year, grain, entity_key)
    order by academic_year, grain, entity_key
  `, [[...ELIGIBLE_STATUSES]]);
  if (!rows.length) throw new Error("ยังไม่มีข้อมูลรับสมัครในคลัง");
  const facts: Fact[] = rows.map(r => ({
    id: `${r.grain}:${r.academic_year}:${r.entity_key}`, grain: r.grain as Fact["grain"],
    year: Number(r.academic_year), key: String(r.entity_key), name: String(r.name), programType: String(r.program_type),
    choices: Number(r.choices), applicants: Number(r.applicants), eligible: Number(r.eligible), confirmed: Number(r.confirmed),
    rate: Number(r.rate), eligibleRate: r.eligible_rate === null ? null : Number(r.eligible_rate),
    avgScore: r.avg_score === null ? null : Number(r.avg_score),
    resigned: Number(r.resigned), statuses: r.statuses as StatusCount[],
    rightsOutcomes: (r.rights_outcomes ?? { eligible: 0, confirmed: 0, resigned: 0, unused: 0, inactive: 0, elsewhere: 0, other: 0, multiple: 0 }) as RightsOutcomes,
  }));
  for (const fact of facts) {
    const rights = fact.rightsOutcomes!;
    const total = Object.entries(rights).filter(([key]) => key !== "eligible").reduce((sum,[,value]) => sum + value, 0);
    if (!Array.isArray(fact.statuses) || !fact.statuses.length || rights.eligible !== fact.eligible || total !== fact.eligible) {
      throw new Error("ข้อมูลสถานะหรือผลรวมผู้มีสิทธิ์ไม่ครบ จึงยังไม่สร้างรายงาน");
    }
  }
  const dataLoadedAt = new Date(Math.max(...rows.map(r => new Date(String(r.loaded_at)).getTime()))).toISOString();
  return { facts, dataLoadedAt, availableYears: facts.filter(f => f.grain === "year").map(f => f.year).sort((a,b) => a-b) };
}
