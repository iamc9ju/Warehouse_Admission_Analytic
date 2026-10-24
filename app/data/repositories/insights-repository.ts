import type { QueryClient } from "../db/neon-client";
import type { DashboardSnapshot } from "../dashboard-types";
import { numberValue, requiredRows } from "./query-helpers";

type Question = DashboardSnapshot["businessQuestions"][number];
type Insight = DashboardSnapshot["decisionInsights"][number];

// Questions are application configuration, not warehouse data.
const BUSINESS_QUESTIONS: Question[] = [
  { id: "BQ-001", domain: "Demand", question: "สาขาไหนมีผู้สมัครมากที่สุด", martObject: "mart_major_opportunity", metrics: ["applicant_count"], decisionOwner: "Admissions committee", decisionUse: "ปรับ communication, quota หรือ offer strategy", qualityGate: "พบข้อมูลสาขาในปีล่าสุด" },
  { id: "BQ-002", domain: "Round Strategy", question: "รอบ TCAS ไหนสร้างผู้ยืนยันสิทธิ์ได้มากที่สุด", martObject: "mart_round_efficiency", metrics: ["confirmed_applicants", "confirmed_rate"], decisionOwner: "Admissions planning", decisionUse: "จัดทรัพยากรและ communication ตามรอบ", qualityGate: "พบข้อมูลรอบในปีล่าสุด" },
  { id: "BQ-007", domain: "Demand", question: "สาขาไหนผู้สมัครลดลงมากที่สุดจากปีก่อนหน้า", martObject: "mart_major_year_change", metrics: ["applicant_change"], decisionOwner: "Admissions committee", decisionUse: "วาง recovery campaign หรือปรับ positioning", qualityGate: "มีข้อมูลเปรียบเทียบอย่างน้อยสองปี" },
  { id: "BQ-008", domain: "Demand", question: "สาขาไหนเติบโตมากที่สุดจากปีก่อนหน้า", martObject: "mart_major_year_change", metrics: ["applicant_change"], decisionOwner: "Faculty leadership", decisionUse: "ขยายจุดขายของหลักสูตรที่เติบโต", qualityGate: "มีข้อมูลเปรียบเทียบอย่างน้อยสองปี" },
  { id: "BQ-009", domain: "Demand", question: "สาขาไหนมีผู้สมัครน้อยที่สุด", martObject: "mart_major_opportunity", metrics: ["applicant_count"], decisionOwner: "Admissions committee", decisionUse: "ทบทวนการสื่อสารและการเข้าถึงผู้สมัคร", qualityGate: "พบข้อมูลสาขาในปีล่าสุด" },
];

export async function getBusinessQuestions(): Promise<DashboardSnapshot["businessQuestions"]> {
  return BUSINESS_QUESTIONS;
}

function payloadOf(row: Record<string, unknown>) {
  const payload = row.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Invalid decision insight payload for ${String(row.business_question_id)}`);
  }
  return payload as Record<string, unknown>;
}

function textValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === null || value === undefined || value === "") throw new Error(`Missing ${key} in decision insight query`);
  return String(value);
}

function number(record: Record<string, unknown>, key: string) {
  return numberValue(record[key], key);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function insightFromRow(row: Record<string, unknown>): Insight {
  const id = textValue(row, "business_question_id");
  const payload = payloadOf(row);
  const year = number(payload, "academic_year");

  if (["BQ-001", "BQ-007", "BQ-008", "BQ-009"].includes(id)) {
    const major = textValue(payload, "major_name");
    const applicants = number(payload, "applicant_count");
    const confirmed = number(payload, "confirmed_count");
    const rate = payload.eligible_rate == null ? null : number(payload, "eligible_rate");
    const rateText = rate === null ? "ไม่มีฐานคำนวณ" : `${rate.toFixed(1)}%`;
    const change = number(payload, "applicant_change");

    if (id === "BQ-001") return {
      id: "INS-001", businessQuestionId: id, priority: 1, category: "Demand",
      title: `${major}มีผู้สมัครมากที่สุด`, summary: `ปี ${year} มีผู้สมัครมากที่สุด ${formatNumber(applicants)} คน และอัตรายืนยันต่อผู้มีสิทธิ์ ${rateText}`,
      martObject: "mart_major_opportunity", metricLabel: "ผู้สมัคร / อัตรายืนยันต่อผู้มีสิทธิ์", metricValue: `${formatNumber(applicants)} คน / ${rateText}`,
      decision: "ตรวจ offer competitiveness และ communication flow ของสาขานี้", recommendedAction: "ทบทวนข้อความสื่อสาร จำนวนที่นั่ง และช่วงเวลาติดตามผล",
      confidence: "High", qualityGate: "พบข้อมูลสาขาในปีล่าสุด",
    };
    if (id === "BQ-007") return {
      id: "INS-007", businessQuestionId: id, priority: 3, category: "Demand",
      title: `${major}มีผู้สมัครลดลงมากที่สุดจากปีก่อนหน้า`, summary: `ปี ${year} ผู้สมัครเปลี่ยนแปลง ${change.toLocaleString("en-US", { signDisplay: "always" })} คนจากปี ${year - 1}`,
      martObject: "mart_major_year_change", metricLabel: "การเปลี่ยนแปลงผู้สมัคร", metricValue: `${change.toLocaleString("en-US", { signDisplay: "always" })} คน`,
      decision: "หาสาเหตุ demand drop และปรับ positioning ก่อนรอบรับปีหน้า", recommendedAction: "ทบทวนข้อความของหลักสูตรและเปรียบเทียบ positioning กับคู่แข่ง",
      confidence: "Medium", qualityGate: "มีข้อมูลเปรียบเทียบอย่างน้อยสองปี",
    };
    if (id === "BQ-008") return {
      id: "INS-008", businessQuestionId: id, priority: 4, category: "Demand",
      title: `${major}เติบโตสวนภาพรวม`, summary: `ปี ${year} ผู้สมัครเพิ่มขึ้น ${formatNumber(change)} คนจากปี ${year - 1}`,
      martObject: "mart_major_year_change", metricLabel: "การเปลี่ยนแปลงผู้สมัคร", metricValue: `+${formatNumber(change)} คน`,
      decision: "ใช้สัญญาณนี้เป็นจุดขายและขยาย communication ในปีถัดไป", recommendedAction: "รักษาข้อความที่สร้าง demand และสื่อสารผลลัพธ์ของหลักสูตร",
      confidence: "High", qualityGate: "มีข้อมูลเปรียบเทียบอย่างน้อยสองปี",
    };
    return {
      id: "INS-009", businessQuestionId: id, priority: 5, category: "Demand",
      title: `${major}มีผู้สมัครน้อยที่สุด`, summary: `ปี ${year} มีผู้สมัครน้อยที่สุด ${formatNumber(applicants)} คน และอัตรายืนยันต่อผู้มีสิทธิ์ ${rateText}`,
      martObject: "mart_major_opportunity", metricLabel: "ผู้สมัคร / อัตรายืนยันต่อผู้มีสิทธิ์", metricValue: `${formatNumber(applicants)} คน / ${rateText}`,
      decision: "ทบทวนสาเหตุที่มีผู้สมัครน้อยและการเข้าถึงกลุ่มเป้าหมาย", recommendedAction: "เพิ่มการสื่อสารแบบเจาะกลุ่มโดยรักษาความตรงกับผู้สมัคร",
      confidence: "Medium", qualityGate: "พบข้อมูลสาขาในปีล่าสุด",
    };
  }

  if (id === "BQ-002") {
    const roundCode = textValue(payload, "tcas_round_code");
    const confirmed = number(payload, "confirmed_applicants");
    const rate = payload.eligible_rate == null ? null : number(payload, "eligible_rate");
    const rateText = rate === null ? "ไม่มีฐานคำนวณ" : `${rate.toFixed(1)}%`;
    return {
      id: "INS-002", businessQuestionId: id, priority: 2, category: "Round Strategy",
      title: `${roundCode} เป็นรอบที่สร้างผู้ยืนยันสิทธิ์มากที่สุด`, summary: `ปี ${year} ${roundCode} มีผู้ยืนยันสิทธิ์ ${formatNumber(confirmed)} คน และอัตรายืนยันต่อผู้มีสิทธิ์ ${rateText}`,
      martObject: "mart_round_efficiency", metricLabel: "ผู้ยืนยันสิทธิ์ / อัตรายืนยัน", metricValue: `${formatNumber(confirmed)} คน / ${rateText}`,
      decision: `ใช้ ${roundCode} เป็นรอบหลักสำหรับ demand capture และ tracking`, recommendedAction: `จัด communication และทีมติดตามให้พร้อมก่อนช่วงยืนยันสิทธิ์ ${roundCode}`,
      confidence: "High", qualityGate: "พบข้อมูลรอบในปีล่าสุด",
    };
  }
  throw new Error(`Unsupported business question ${id}`);
}

export async function getDecisionInsights(client: QueryClient): Promise<DashboardSnapshot["decisionInsights"]> {
  const rows = await requiredRows(client, `
    /* decision-insights-from-marts */
    with latest_year as (
      select max(academic_year) as academic_year from admissions_dw.mart_admissions_executive_summary
    ),
    major_rates as (
      select m.*, 100.0 * m.confirmed_count / nullif(m.eligible_count, 0) as eligible_rate
      from admissions_dw.mart_major_opportunity m
    ),
    highest_demand as (
      select m.* from major_rates m join latest_year y using (academic_year)
      order by m.applicant_count desc, m.major_code, m.program_type limit 1
    ),
    best_round as (
      select r.*, 100.0 * r.confirmed_applicants / nullif(o.eligible_applicants, 0) as eligible_rate
      from admissions_dw.mart_round_efficiency r join latest_year y using (academic_year)
      join admissions_dw.vw_admission_round_overview o using (academic_year, tcas_round_code)
      order by r.confirmed_applicants desc, eligible_rate desc nulls last limit 1
    ),
    demand_drop as (
      select m.* from admissions_dw.mart_major_year_change m join latest_year y using (academic_year)
      order by m.applicant_change asc limit 1
    ),
    demand_growth as (
      select m.* from admissions_dw.mart_major_year_change m join latest_year y using (academic_year)
      order by m.applicant_change desc limit 1
    ),
    lowest_demand as (
      select m.* from major_rates m join latest_year y using (academic_year)
      order by m.applicant_count asc, m.major_code, m.program_type limit 1
    )
    select 'BQ-001' as business_question_id, to_jsonb(x) as payload from highest_demand x
    union all select 'BQ-002', to_jsonb(x) from best_round x
    union all select 'BQ-007', to_jsonb(x) from demand_drop x
    union all select 'BQ-008', to_jsonb(x) from demand_growth x
    union all select 'BQ-009', to_jsonb(x) from lowest_demand x
  `);
  return rows.map(insightFromRow).sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}
