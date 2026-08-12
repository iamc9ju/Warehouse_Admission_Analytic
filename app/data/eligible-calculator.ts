import type { StatusRow, RoundStatusRow, MajorRow } from "./dashboard-types";

/**
 * 5 กลุ่มสถานะในระบบที่นับเป็น "ผู้มีสิทธิ์เข้าศึกษา" ตาม Governed Business Rule:
 * 1. ยืนยันสิทธิ์แล้ว ('ยืนยันสิทธิ์')
 * 2. สละสิทธิ์ ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2')
 * 3. ไปยืนยันที่อื่น ('ยืนยันที่อื่นแล้ว')
 * 4. ไม่ใช้สิทธิ์ ('ไม่ใช้สิทธิ์')
 * 5. ผ่านการคัดเลือก ('ผ่านการคัดเลือก', 'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2')
 */
export const ELIGIBLE_STATUS_LABELS: ReadonlySet<string> = new Set([
  "ยืนยันสิทธิ์",
  "สละสิทธิ์",
  "สละสิทธิ์ในรอบ 2",
  "ยืนยันที่อื่นแล้ว",
  "ไม่ใช้สิทธิ์",
  "ผ่านการคัดเลือก",
  "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2",
]);

/**
 * ตรวจสอบว่าชื่อสถานะอยู่ในกลุ่มผู้มีสิทธิ์ 5 กลุ่มหรือไม่
 */
export function isEligibleStatus(statusLabel: string): boolean {
  return ELIGIBLE_STATUS_LABELS.has(statusLabel);
}

/**
 * คำนวณจำนวนผู้มีสิทธิ์ไดนามิกจากรายการ Status Rows ตาม Business Rule 5 กลุ่มสถานะ
 */
export function calculateEligibleFromStatusRows(
  rows: (StatusRow | RoundStatusRow)[],
  field: "choices" | "applicants" = "applicants"
): number {
  return rows
    .filter((row) => {
      const label = "label" in row ? row.label : (row as unknown as { tcas_status?: string }).tcas_status ?? "";
      return isEligibleStatus(label);
    })
    .reduce((sum, row) => {
      const val = field in row ? (row as unknown as Record<string, number>)[field] ?? 0 : 0;
      return sum + val;
    }, 0);
}

/**
 * คำนวณจำนวนผู้มีสิทธิ์ของสาขาวิชาอย่างไดนามิกจาก Data Layer
 * 1. ถ้ามีฟิลด์ `eligible` ในออบเจกต์ข้อมูล (เช่น 103 คนจากคลังข้อมูล) จะใช้ค่านั้นโดยตรง
 * 2. หากไม่มี ให้คำนวณจากสัดส่วนผู้มีสิทธิ์จริงในปีการศึกษานั้นๆ
 */
export function calculateEligibleApplicantsDynamic(
  major: Partial<MajorRow> | undefined,
  yearEligibleShare: number
): number {
  if (!major) return 0;
  if (typeof major.eligible === "number" && major.eligible > 0) {
    return major.eligible;
  }
  const appVal = major.applicants ?? 0;
  const confVal = major.confirmed ?? 0;
  if (appVal <= 0) return 0;
  const calculated = Math.round(appVal * yearEligibleShare);
  return Math.max(confVal, calculated);
}
