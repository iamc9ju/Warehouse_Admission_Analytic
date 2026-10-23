// Presentation only: keep these statuses in source data and metric calculations.
const hiddenStatuses = new Set([
  "ผ่านการคัดเลือก",
  "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2",
  "สละสิทธิ์ในรอบ 2",
]);

export function isVisibleStatus(label: string): boolean {
  return !hiddenStatuses.has(label);
}
