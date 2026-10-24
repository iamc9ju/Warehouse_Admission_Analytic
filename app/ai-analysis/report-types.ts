export const SECTION_TITLES = [
  "สรุปสถานการณ์สำคัญ", "ภาพรวมและแนวโน้มการรับสมัคร", "การใช้สิทธิ์และสถานะที่ควรติดตาม", "สาขาที่ควรติดตาม",
  "สาขาที่มีสัญญาณเชิงบวก", "ผลการรับสมัครแต่ละรอบ TCAS",
  "แนวทางดำเนินการเบื้องต้น",
] as const;

export const PROMPT_VERSION = "admissions-report-v9-executive-overview";
export const RULES_VERSION = "signals-v2-eligible-conversion";
export const ELIGIBLE_STATUSES = [
  "ยืนยันสิทธิ์", "สละสิทธิ์", "สละสิทธิ์ในรอบ 2", "ยืนยันที่อื่นแล้ว", "ไม่ใช้สิทธิ์",
  "ผ่านการคัดเลือก", "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2", "ไม่เข้าระบบมาดำเนินการใดๆ",
] as const;

export const DEFINITIONS = {
  applicants: "ผู้สมัคร = COUNT(DISTINCT student_key) ภายในปีและกลุ่มที่รายงาน",
  choices: "ตัวเลือกสมัคร = จำนวนแถว fact_admission หนึ่งแถวต่อหนึ่งตัวเลือกสมัคร ไม่ใช่จำนวนคน",
  eligible: `ผู้มีสิทธิ์ = คนไม่ซ้ำที่มีอย่างน้อยหนึ่งแถวในสถานะ: ${ELIGIBLE_STATUSES.join(" / ")}`,
  confirmed: "ผู้ยืนยันสิทธิ์ = คนไม่ซ้ำที่มีอย่างน้อยหนึ่งแถวสถานะยืนยันสิทธิ์ ไม่ใช่การอนุมานสถานะสุดท้ายตามเวลา",
  rate: "อัตรายืนยันต่อผู้สมัคร (%) = ผู้ยืนยันสิทธิ์ ÷ ผู้สมัคร × 100 ปัดทศนิยมสองตำแหน่ง ไม่ใช่หารผู้มีสิทธิ์",
  eligibleRate: "อัตราหลักของรายงาน: อัตรายืนยันต่อผู้มีสิทธิ์ (%) = ผู้ยืนยันสิทธิ์ ÷ ผู้มีสิทธิ์ × 100 ปัดสองตำแหน่ง ถ้าตัวหารเป็นศูนย์ให้แสดงว่าไม่มีฐานคำนวณ ห้ามใช้อัตรายืนยันต่อผู้สมัครแทน",
  overlap: "คนเดียวอาจอยู่หลายสาขา หลายรอบ หลายประเภทหลักสูตร หรือหลายปี ห้ามบวกจำนวนคนข้ามกลุ่มเป็นจำนวนคนรวม และห้ามนำจำนวนแยกสถานะมาบวกแทนผู้มีสิทธิ์",
  statuses: "statuses คือจำนวนคนไม่ซ้ำต่อสถานะจริงและจำนวนตัวเลือกสมัครในกลุ่มนั้น คนเดียวอาจอยู่หลายสถานะ; สละสิทธิ์รวม (resigned) นับคนไม่ซ้ำจากสละสิทธิ์และสละสิทธิ์ในรอบ 2 รวมกัน ไม่ใช่บวกจำนวนสองสถานะ; สัดส่วนแต่ละสถานะใช้ผู้สมัครของกลุ่มเป็นตัวหาร และผลรวมสัดส่วนอาจเกิน 100% เพราะสถานะซ้อนกัน",
  rightsOutcomes: "rightsOutcomes ใช้วิธีเดียวกับ getRightsOutcomes เดิม: เฉพาะผู้มีสิทธิ์ 8 สถานะ จัดยืนยันสิทธิ์=confirmed, สละสิทธิ์ทั้งสองสถานะ=resigned, ไม่ใช้สิทธิ์=unused, ไม่เข้าระบบ=inactive, ยืนยันที่อื่น=elsewhere, ผ่านคัดเลือกที่เหลือ=other; คนที่มีมากกว่าหนึ่งหมวดในปี/กลุ่มเดียวกันอยู่ multiple โดยไม่นับซ้ำในหมวดอื่น ผลรวมหมวดเท่ากับผู้มีสิทธิ์ ใช้ eligible เป็นตัวหาร แตกต่างจาก confirmed/resigned ที่นับแบบมีอย่างน้อยหนึ่งแถว ห้ามปนวิธีนับสองชุด",
  score: "คะแนนเฉลี่ยคำนวณต่อแถวตัวเลือกสมัคร เกณฑ์คะแนนต่างรอบ/สาขาอาจต่างกัน จึงไม่ใช้จัดอันดับคุณภาพผู้สมัคร",
  comparison: "ใช้เฉพาะปีภายในช่วงที่ผู้ใช้เลือกเท่านั้น ไม่ดึงปีก่อนนอกช่วงมาเปรียบเทียบ; เลือกปีเดียวให้เปรียบเทียบสาขา/รอบภายในปีนั้น ไม่มีข้อสรุปเพิ่มขึ้นหรือลดลงจากปีก่อน; เลือกหลายปีจึงเทียบปีติดกันที่อยู่ในช่วงและ major_key เดียวกัน แยกภาคปกติ/พิเศษ ไม่รวมสาขาที่ชื่อคล้ายกันเอง",
  limits: "ไม่มีเป้ารับ เหตุผลไม่ยืนยัน ผลแคมเปญ หรือข้อมูลคู่แข่ง จึงสรุปที่นั่งขาดหรือสาเหตุการเปลี่ยนแปลงไม่ได้",
};

export const RULES = {
  minApplicants: 30, applicantChangePct: 10, rateChangePp: 3,
  description: "อัตรายืนยันในเกณฑ์ทั้งหมดใช้ผู้ยืนยันสิทธิ์ ÷ ผู้มีสิทธิ์ × 100 เท่านั้น; เกณฑ์เฝ้าติดตามเบื้องต้น ไม่ใช่เกณฑ์ทางสถิติ: เทียบปีติดกันเมื่อทั้งสองปีมีผู้สมัครอย่างน้อย 30 คน; ติดตามเมื่อผู้สมัครลด ≥10% หรืออัตรายืนยันลด ≥3 จุดเปอร์เซ็นต์; เชิงบวกเมื่อผู้สมัครเพิ่ม ≥10% หรืออัตรายืนยันเพิ่ม ≥3 จุดเปอร์เซ็นต์; ผู้สมัครสูงแต่อัตราต่ำหมายถึงผู้สมัครอย่างน้อยค่ามัธยฐานของสาขาในปีนั้นและอัตรายืนยันต่ำกว่าภาพรวมปีเดียวกัน",
};

export type Scope = { startYear: number; endYear: number };
export type StatusCount = { label: string; applicants: number; choices: number };
export type RightsOutcomes = { eligible: number; confirmed: number; resigned: number; unused: number; inactive: number; elsewhere: number; other: number; multiple: number };
export type Fact = {
  id: string; grain: "year" | "major" | "round" | "program"; year: number;
  key: string; name: string; programType: string;
  applicants: number; choices: number; eligible: number; confirmed: number;
  rate: number; eligibleRate: number | null; avgScore: number | null;
  // Optional only for historical reports created before status coverage was added.
  resigned?: number; statuses?: StatusCount[]; rightsOutcomes?: RightsOutcomes;
};
export type Signal = {
  kind: "watch" | "positive"; year: number; name: string; reason: string;
  evidenceIds: string[]; applicantChangePct?: number; rateChangePp?: number;
};
export type ReportInput = {
  scope: Scope; baselineYear: number | null; dataLoadedAt: string; fingerprint: string;
  facts: Fact[]; signals: Signal[]; definitions: typeof DEFINITIONS; rules: typeof RULES;
};
export type OverviewDimension = "overview" | "rights" | "major" | "round";
export type ReportItem = { observation: string; interpretation: string; recommendation: string; evidenceIds: string[]; dimensions?: OverviewDimension[] };
export type YearSummary = { year: number; observation: string; evidenceIds: string[] };
export type ReportContent = { sections: { title: string; items: ReportItem[]; yearSummaries?: YearSummary[] }[] };
export type SavedReport = {
  id: string; createdAt: string; model: string; promptVersion: string;
  input: ReportInput; content: ReportContent;
};
export type ReportSummary = { id: string; createdAt: string; model: string };
export type AnalysisState = {
  availableYears: number[]; scope: Scope; currentFingerprint: string; currentDataLoadedAt: string;
  report: SavedReport | null; history: ReportSummary[]; generating: boolean; configured: boolean;
};
