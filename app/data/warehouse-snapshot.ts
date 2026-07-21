export type Year = 2568 | 2569;

export type YearOverview = {
  year: Year;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  sourceFiles: number;
  avgScore: number;
};

export type MajorRow = {
  year: Year;
  code: string;
  name: string;
  type: string;
  applicants: number;
  confirmed: number;
  rate: number;
  avgScore: number;
  applicantChange?: number;
};

export type StatusRow = {
  year: Year;
  label: string;
  choices: number;
  share: number;
  tone: "green" | "amber" | "blue" | "red" | "muted" | "purple" | "orange";
};

export type RoundRow = {
  year: Year;
  code: string;
  name: string;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  files: number;
};

export const warehouseSnapshot = {
  exportedAt: "2026-07-21",
  sourceSystem: "Neon PostgreSQL",
  schema: "admissions_dw",
  dashboardMode: "exported warehouse snapshot",
  sourceRows: 9432,
  activeSourceGroups: 1,
  sourceFiles: 11,
  catalogRows: 7,
  lineageEdges: 7,
  piiExportedColumns: 0,
  sourceQuery: "mart_admissions_executive_summary + mart_major_conversion + vw_admission_round_overview",
} as const;

export const years: YearOverview[] = [
  { year: 2568, choices: 4853, applicants: 3597, confirmed: 528, rate: 14.68, sourceFiles: 6, avgScore: 21.7825 },
  { year: 2569, choices: 4579, applicants: 3443, confirmed: 545, rate: 15.83, sourceFiles: 5, avgScore: 19.101 },
];

export const majorRows: MajorRow[] = [
  { year: 2568, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน", type: "ภาคปกติ", applicants: 827, confirmed: 60, rate: 7.26, avgScore: 35.6516 },
  { year: 2568, code: "E04", name: "วิศวกรรมโยธา-ชลประทาน", type: "ภาคปกติ", applicants: 750, confirmed: 60, rate: 8, avgScore: 49.224 },
  { year: 2568, code: "E29", name: "วิศวกรรมคอมพิวเตอร์", type: "ภาคปกติ", applicants: 741, confirmed: 63, rate: 8.5, avgScore: 40.7674 },
  { year: 2568, code: "E24", name: "วิศวกรรมอุตสาหการ-โลจิสติกส์", type: "ภาคปกติ", applicants: 527, confirmed: 62, rate: 11.76, avgScore: 35.7684 },
  { year: 2568, code: "E03", name: "วิศวกรรมเครื่องกล", type: "ภาคปกติ", applicants: 517, confirmed: 48, rate: 9.28, avgScore: 35.6015 },
  { year: 2568, code: "E37", name: "วิศวกรรมเครื่องกล-เกษตร", type: "ภาคปกติ", applicants: 411, confirmed: 56, rate: 13.63, avgScore: 46.0421 },
  { year: 2568, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 335, confirmed: 52, rate: 15.52, avgScore: 33.0021 },
  { year: 2568, code: "E36", name: "วิศวกรรมอาหาร", type: "ภาคปกติ", applicants: 313, confirmed: 57, rate: 18.21, avgScore: 34.5253 },
  { year: 2568, code: "E03", name: "วิศวกรรมเครื่องกล (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 293, confirmed: 35, rate: 11.95, avgScore: 31.1507 },
  { year: 2568, code: "E39", name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม", type: "ภาคปกติ", applicants: 139, confirmed: 35, rate: 25.18, avgScore: 43.2799 },
  { year: 2569, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน", type: "ภาคปกติ", applicants: 825, confirmed: 63, rate: 7.64, avgScore: 35.7908, applicantChange: -2 },
  { year: 2569, code: "E24", name: "วิศวกรรมอุตสาหการ-โลจิสติกส์", type: "ภาคปกติ", applicants: 684, confirmed: 62, rate: 9.06, avgScore: 35.9961, applicantChange: 157 },
  { year: 2569, code: "E29", name: "วิศวกรรมคอมพิวเตอร์", type: "ภาคปกติ", applicants: 680, confirmed: 67, rate: 9.85, avgScore: 40.0213, applicantChange: -61 },
  { year: 2569, code: "E04", name: "วิศวกรรมโยธา-ชลประทาน", type: "ภาคปกติ", applicants: 602, confirmed: 62, rate: 10.3, avgScore: 47.2472, applicantChange: -148 },
  { year: 2569, code: "E03", name: "วิศวกรรมเครื่องกล", type: "ภาคปกติ", applicants: 543, confirmed: 51, rate: 9.39, avgScore: 35.5185, applicantChange: 26 },
  { year: 2569, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 343, confirmed: 52, rate: 15.16, avgScore: 34.1846, applicantChange: 8 },
  { year: 2569, code: "E36", name: "วิศวกรรมอาหาร", type: "ภาคปกติ", applicants: 294, confirmed: 59, rate: 20.07, avgScore: 33.6946, applicantChange: -19 },
  { year: 2569, code: "E03", name: "วิศวกรรมเครื่องกล (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 286, confirmed: 34, rate: 11.89, avgScore: 33.1081, applicantChange: -7 },
  { year: 2569, code: "E37", name: "วิศวกรรมเครื่องกล-เกษตร", type: "ภาคปกติ", applicants: 214, confirmed: 59, rate: 27.57, avgScore: 30.2993, applicantChange: -197 },
  { year: 2569, code: "E39", name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม", type: "ภาคปกติ", applicants: 108, confirmed: 36, rate: 33.33, avgScore: 30.836, applicantChange: -31 },
];

export const statuses: StatusRow[] = [
  { year: 2568, label: "ไม่ผ่านการคัดเลือก", choices: 2551, share: 52.57, tone: "green" },
  { year: 2568, label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า", choices: 1097, share: 22.6, tone: "amber" },
  { year: 2568, label: "ยืนยันสิทธิ์", choices: 528, share: 10.88, tone: "orange" },
  { year: 2568, label: "ผู้สมัคร", choices: 400, share: 8.24, tone: "blue" },
  { year: 2568, label: "ยืนยันที่อื่นแล้ว", choices: 191, share: 3.94, tone: "blue" },
  { year: 2568, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 34, share: 0.7, tone: "purple" },
  { year: 2568, label: "สละสิทธิ์", choices: 24, share: 0.49, tone: "red" },
  { year: 2568, label: "ไม่ใช้สิทธิ์", choices: 18, share: 0.37, tone: "muted" },
  { year: 2568, label: "สละสิทธิ์ในรอบ 2", choices: 8, share: 0.16, tone: "orange" },
  { year: 2568, label: "ผ่านการคัดเลือก", choices: 1, share: 0.02, tone: "green" },
  { year: 2569, label: "ไม่ผ่านการคัดเลือก", choices: 2552, share: 55.73, tone: "green" },
  { year: 2569, label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า", choices: 1191, share: 26.01, tone: "amber" },
  { year: 2569, label: "ยืนยันสิทธิ์", choices: 545, share: 11.9, tone: "orange" },
  { year: 2569, label: "ยืนยันที่อื่นแล้ว", choices: 210, share: 4.59, tone: "blue" },
  { year: 2569, label: "ไม่ใช้สิทธิ์", choices: 30, share: 0.66, tone: "muted" },
  { year: 2569, label: "สละสิทธิ์", choices: 26, share: 0.57, tone: "red" },
  { year: 2569, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 18, share: 0.39, tone: "purple" },
  { year: 2569, label: "สละสิทธิ์ในรอบ 2", choices: 6, share: 0.13, tone: "orange" },
  { year: 2569, label: "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2", choices: 1, share: 0.02, tone: "green" },
];

export const rounds: RoundRow[] = [
  { year: 2568, code: "TCAS1", name: "Portfolio", choices: 1385, applicants: 1320, confirmed: 191, rate: 14.47, files: 2 },
  { year: 2568, code: "TCAS2", name: "Quota", choices: 519, applicants: 518, confirmed: 112, rate: 21.62, files: 2 },
  { year: 2568, code: "TCAS3", name: "Admission", choices: 2711, applicants: 1810, confirmed: 214, rate: 11.82, files: 1 },
  { year: 2568, code: "TCAS4", name: "Direct Admission", choices: 238, applicants: 238, confirmed: 11, rate: 4.62, files: 1 },
  { year: 2569, code: "TCAS1", name: "Portfolio", choices: 1391, applicants: 1324, confirmed: 163, rate: 12.31, files: 1 },
  { year: 2569, code: "TCAS2", name: "Quota", choices: 614, applicants: 614, confirmed: 90, rate: 14.66, files: 2 },
  { year: 2569, code: "TCAS3", name: "Admission", choices: 2379, applicants: 1620, confirmed: 283, rate: 17.47, files: 1 },
  { year: 2569, code: "TCAS4", name: "Direct Admission", choices: 195, applicants: 195, confirmed: 9, rate: 4.62, files: 1 },
];

export const qualityMetricDefinitions = [
  {
    label: "Source rows",
    value: "9,432",
    sourceObject: "admission_round_source_data_quality.source_rows",
    definition: "จำนวนแถวจาก Excel admissions source ทั้งหมดที่ ETL อ่านก่อน aggregate",
    rule: "sum(source_rows) across 11 files must equal loaded staging row count",
  },
  {
    label: "Missing score",
    value: "0",
    sourceObject: "admission_round_source_data_quality.missing_score_rows",
    definition: "จำนวนแถวที่ field คะแนนหรือ score ที่ใช้คำนวณ summary เป็นค่าว่าง",
    rule: "missing_score_rows = 0 for every source file in the active snapshot",
  },
  {
    label: "Missing major",
    value: "0",
    sourceObject: "admission_round_source_data_quality.missing_major_rows",
    definition: "จำนวนแถวที่ไม่สามารถ map ไปยังรหัส/ชื่อสาขาวิชาใน dim_major",
    rule: "missing_major_rows = 0 before loading major-level facts",
  },
  {
    label: "PII exported",
    value: "0 columns",
    sourceObject: "processed aggregate CSV column audit",
    definition: "จำนวน column ส่วนบุคคลที่ถูกส่งออกจาก ETL ไป processed CSV, Neon หรือ dashboard",
    rule: "citizen_id, name, phone and email are memory-only or source-only fields",
  },
  {
    label: "Active source groups",
    value: "1",
    sourceObject: "dw_dataset_catalog.source_group",
    definition: "จำนวนกลุ่ม source ที่อยู่ใน active scope หลังตัด social ingestion",
    rule: "only admissions_excel is active; social sources are excluded",
  },
  {
    label: "Source files",
    value: "11",
    sourceObject: "admission_round_source_data_quality.source_file",
    definition: "จำนวน Excel admissions files ของ TCAS รอบ 1-4 ปี 2568 และ 2569",
    rule: "source_file count must reconcile to TCAS1-4 coverage for both years",
  },
  {
    label: "Catalog rows",
    value: "7",
    sourceObject: "dw_dataset_catalog",
    definition: "จำนวน dataset catalog records ที่อธิบาย source, staging, core facts, marts และ dashboard snapshot",
    rule: "every dashboard-facing table/view must have catalog metadata",
  },
  {
    label: "Lineage edges",
    value: "7",
    sourceObject: "dw_lineage_edge",
    definition: "จำนวน dependency edges จาก source ไป staging, core facts, marts และ dashboard",
    rule: "every mart used by UI must trace back to source/staging",
  },
] as const;

export const dataCatalogRows = [
  ["admissions_excel_files", "Source", "source_file + year + round", "11 files / 9,432 rows", "PII at source only"],
  ["processed_admissions_aggregates", "Staging", "year + round + major/status", "PII-free CSV aggregates", "No PII"],
  ["fact_admission_year_overview", "Core fact", "academic_year", "2 rows", "No PII"],
  ["fact_admission_round_overview", "Core fact", "academic_year + tcas_round", "8 rows", "No PII"],
  ["fact_admission_round_major_summary", "Core fact", "academic_year + major", "20 displayed rows", "No PII"],
  ["admission_round_source_data_quality", "Quality fact", "source_file", "11 quality records", "No PII"],
  ["mart_admissions_executive_summary", "Presentation mart", "academic_year", "dashboard-ready", "No PII"],
] as const;

export const lineageEdges = [
  ["Excel admissions files", "PII-free processed aggregates", "extract, normalize, aggregate"],
  ["PII-free processed aggregates", "fact_admission_year_overview", "year-level KPI load"],
  ["PII-free processed aggregates", "fact_admission_round_overview", "round-level KPI load"],
  ["PII-free processed aggregates", "fact_admission_round_major_summary", "major conversion load"],
  ["PII-free processed aggregates", "admission_round_source_data_quality", "source validation load"],
  ["Core facts + quality facts", "mart_admissions_executive_summary", "presentation mart build"],
  ["Presentation marts", "app/data/warehouse-snapshot.ts", "exported dashboard snapshot"],
] as const;

export const etlValidationChecks = [
  ["Row reconciliation", "9,432 source rows read from 11 files", "pass"],
  ["PII boundary", "0 exported PII columns in processed CSV, Neon facts and dashboard snapshot", "pass"],
  ["Major mapping", "0 missing major rows before major fact load", "pass"],
  ["Score completeness", "0 missing score rows in active snapshot", "pass"],
  ["Round coverage", "TCAS1-4 represented for both 2568 and 2569", "pass"],
  ["Social exclusion", "0 social media source groups in active warehouse scope", "pass"],
] as const;

export const warehouseQueries = [
  {
    name: "Dashboard KPI snapshot",
    object: "mart_admissions_executive_summary",
    sql: "select academic_year, application_choices, unique_applicants, confirmed_applicants, confirmed_rate from admissions_dw.mart_admissions_executive_summary order by academic_year;",
  },
  {
    name: "Round overview",
    object: "vw_admission_round_overview",
    sql: "select academic_year, tcas_round_code, choices, unique_applicants, confirmed_applicants, confirmed_rate, source_files from admissions_dw.vw_admission_round_overview order by academic_year, tcas_round_code;",
  },
  {
    name: "Major conversion",
    object: "mart_major_conversion",
    sql: "select academic_year, major_code, major_name, applicant_count, confirmed_count, confirmed_rate from admissions_dw.mart_major_conversion order by academic_year, applicant_count desc;",
  },
  {
    name: "Quality scorecard",
    object: "vw_dw_quality_scorecard",
    sql: "select metric_name, metric_value, source_object, validation_rule from admissions_dw.vw_dw_quality_scorecard order by metric_name;",
  },
] as const;
