import type { Fact } from "./report-types";

export const STATUS_COLUMNS = [
  ["resigned", "สละสิทธิ์"], ["unused", "ไม่ใช้สิทธิ์"], ["elsewhere", "ยืนยันที่อื่น"],
  ["inactive", "ไม่เข้าระบบ"], ["rejected", "ไม่ผ่านคัดเลือก"], ["betterChoice", "ผ่านในลำดับที่ดีกว่า"],
] as const;

// Use the same "at least one matching status" distinct-person counts as the dashboard.
// Never substitute the exclusive rightsOutcomes buckets or sum the two resignation statuses.
export function statusMetrics(fact: Fact) {
  const count = (label: string) => fact.statuses ? fact.statuses.find(s => s.label === label)?.applicants ?? 0 : undefined;
  return {
    resigned: fact.resigned,
    unused: count("ไม่ใช้สิทธิ์"), elsewhere: count("ยืนยันที่อื่นแล้ว"),
    inactive: count("ไม่เข้าระบบมาดำเนินการใดๆ"), rejected: count("ไม่ผ่านการคัดเลือก"),
    betterChoice: count("ผ่านการคัดเลือกในลำดับที่ดีกว่า"),
  };
}
