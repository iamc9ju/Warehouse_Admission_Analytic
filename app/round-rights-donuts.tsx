"use client";
import { DonutChartCard } from "./donut-chart-card";
import { segments, rightsStatusTotal } from "./dashboard/rights-outcomes-chart";
import type { DashboardSnapshot, RoundRow } from "./data/dashboard-types";

export function RoundRightsDonuts({ rows, rounds, year }: {
  rows: DashboardSnapshot["rightsOutcomes"]; rounds: RoundRow[]; year: number;
}) {
  return <section style={{ gridColumn: "1 / -1", minWidth: 0 }}>
    <h2>ผลการใช้สิทธิ์ของผู้มีสิทธิ์ แยกรอบ TCAS ปี {year}</h2>
    <div className="round-rights-donut-grid">
      {rounds.filter(round => round.year === year).map(round => {
        const row = rows.find(item => item.year === year && item.code === round.code);
        return <DonutChartCard legendPosition="right" key={`${year}-${round.code}`} title={`${round.code} · ${round.name}`}
          subtitle={row ? `ผู้มีสิทธิ์ไม่ซ้ำ ${row.eligible.toLocaleString("en-US")} คน · ผลรวมแยกสถานะ ${rightsStatusTotal(row).toLocaleString("en-US")}` : "ไม่มีข้อมูลผลการใช้สิทธิ์"}
          kicker={`ปีการศึกษา ${year}`} centerLabel="ผลรวมแยกสถานะ" centerSubtext="นับซ้ำข้ามสถานะ"
          slices={segments.map(segment => ({ label: segment.label, value: row?.[segment.key] ?? 0, color: segment.color }))} />;
      })}
    </div>
    <p>ผลรวมผู้มีสิทธิ์แยกตามสถานะ (นับซ้ำข้ามสถานะ) คนเดียวอาจอยู่หลายสถานะ เปอร์เซ็นต์คิดจากผลรวมสถานะ</p>
  </section>;
}
