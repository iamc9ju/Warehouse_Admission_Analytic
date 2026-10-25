"use client";
import { DonutChartCard } from "./donut-chart-card";
import { segments } from "./dashboard/rights-outcomes-chart";
import type { DashboardSnapshot, RoundRow } from "./data/dashboard-types";

export function RoundRightsDonuts({ rows, rounds, year }: {
  rows: DashboardSnapshot["rightsOutcomes"]; rounds: RoundRow[]; year: number;
}) {
  return <section style={{ gridColumn: "1 / -1", minWidth: 0 }}>
    <h2>ผลการใช้สิทธิ์ของผู้มีสิทธิ์ แยกรอบ TCAS ปี {year}</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(340px, 1fr))", gap: 16, marginTop: 20, overflowX: "auto", paddingBottom: 12 }}>
      {rounds.filter(round => round.year === year).map(round => {
        const row = rows.find(item => item.year === year && item.code === round.code);
        return <DonutChartCard key={`${year}-${round.code}`} title={`${round.code} · ${round.name}`}
          subtitle={row ? `ผู้มีสิทธิ์เฉพาะสถานะที่แสดง ${(row.eligible - row.multiple).toLocaleString("en-US")} คน` : "ไม่มีข้อมูลผลการใช้สิทธิ์"}
          kicker={`ปีการศึกษา ${year}`} centerLabel="ผู้มีสิทธิ์" centerSubtext="คน"
          slices={segments.map(segment => ({ label: segment.label, value: row?.[segment.key] ?? 0, color: segment.color }))} />;
      })}
    </div>
    {/*<p>นับคนไม่ซ้ำภายในปีและรอบ · ยอดรวมและเปอร์เซ็นต์คิดเฉพาะสถานะที่แสดง · ชี้ส่วนสีเพื่อดูจำนวนและเปอร์เซ็นต์</p>*/}
  </section>;
}
