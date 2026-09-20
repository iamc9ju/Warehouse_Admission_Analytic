import type { QueryClient, QueryRow } from "../db/neon-client";

export function numberValue(value: unknown, field: string) {
  const parsed = Number(String(value ?? "").replaceAll(",", ""));
  if (!Number.isFinite(parsed)) throw new Error(`Live Neon returned non-numeric ${field}`);
  return parsed;
}

export function optionalNumberValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return numberValue(value, field);
}

export async function requiredRows(client: QueryClient, sql: string, year?: number) {
  const result = await client.query(sql, year === undefined ? [] : [year]);
  if (!result.rows.length) throw new Error("Live Neon marts returned incomplete dashboard data");
  return result.rows;
}

export async function optionalRows(client: QueryClient, sql: string, year?: number): Promise<QueryRow[] | undefined> {
  try {
    const result = await client.query(sql, year === undefined ? [] : [year]);
    return result.rows.length ? result.rows : undefined;
  } catch {
    return undefined;
  }
}

// Shared definition; each query still counts distinct students at its own grain.
export const eligibleStudentCount = `count(distinct case when s.tcas_status in (
  'ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2',
  'ยืนยันที่อื่นแล้ว', 'ไม่ใช้สิทธิ์', 'ผ่านการคัดเลือก',
  'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'
) then f.student_key end)`;
