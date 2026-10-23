"use client";

import { useState } from "react";
import type { DashboardSnapshot, RoundRow } from "../data/dashboard-types";

const segments = [
  { key: "confirmed", label: "ยืนยันสิทธิ์", color: "#2e7d32" },
  { key: "resigned", label: "สละสิทธิ์", color: "#b4514b" },
  { key: "unused", label: "ไม่ใช้สิทธิ์", color: "#c49027" },
  { key: "inactive", label: "ไม่เข้าระบบมาดำเนินการใดๆ", color: "#8c67a8" },
  { key: "elsewhere", label: "ยืนยันที่อื่นแล้ว", color: "#477ca8" },
  { key: "other", label: "สถานะอื่นในกลุ่มผู้มีสิทธิ์", color: "#8795a2" },
  { key: "multiple", label: "มีหลายกลุ่มสถานะ", color: "#3f8f8b" },
] as const;
const number = (value: number) => value.toLocaleString("en-US");

export function RightsOutcomesChart({ rows, rounds, years }: {
  rows: DashboardSnapshot["rightsOutcomes"]; rounds: RoundRow[]; years: number[];
}) {
  const [percent, setPercent] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const visible = segments.filter(segment => rows.some(row => row[segment.key] > 0));
  const codes = Array.from(new Set(rounds.map(row => row.code))).sort();
  return <article className="analytics-card year-comparison-card" style={{ gridColumn: "1 / -1" }}>
    <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <div><span>Eligible Applicants · Rights Outcomes</span><h2>ผลการใช้สิทธิ์ของผู้มีสิทธิ์ แต่ละรอบทุกปี</h2></div>
      <div style={{ display: "flex", gap: 12 }}>
        {[false, true].map(mode => <button key={String(mode)} type="button" aria-pressed={percent === mode} onClick={() => setPercent(mode)} style={{ padding: "7px 12px", border: "1px solid #ded5c8", borderRadius: 8, background: percent === mode ? "#fff0dd" : "white", cursor: "pointer" }}>{mode ? "เปอร์เซ็นต์ (%)" : "จำนวนคน"}</button>)}
      </div>
    </header>
    <p style={{ color: "#74695d", fontSize: "var(--text-caption)" }}>ขยายยอดผู้มีสิทธิ์จากกราฟด้านบน: แต่ละสีเป็นส่วนประกอบที่บวกกันได้เท่ากับผู้มีสิทธิ์ ความยาวรวมของแท่งคือยอดผู้มีสิทธิ์ในปีและรอบนั้น</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", margin: "18px 0", padding: 14, background: "#faf7f2", borderRadius: 12 }}>
      {visible.map(segment => <span key={segment.key} tabIndex={0} onMouseEnter={() => setHovered(segment.key)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(segment.key)} onBlur={() => setHovered(null)} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--text-label)", opacity: hovered && hovered !== segment.key ? 0.4 : 1 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: segment.color }} />{segment.label}</span>)}
    </div>
    <div className="round-comparison-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
      {codes.map(code => {
        const peak = Math.max(1, ...rows.filter(row => row.code === code).map(row => row.eligible));
        const maximum = percent ? 100 : Math.ceil(peak / 100) * 100;
        const width = 620;
        const chartHeight = years.length * 90 + 100;
        const plotLeft = 78;
        const plotWidth = 450;
        const baseline = years.length * 90 + 35;
        return <div key={code} style={{ padding: 18, border: "1px solid #e5ded6", borderRadius: 10, background: "#fdfbf8", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{code}</strong><span style={{ color: "#777" }}>{rounds.find(row => row.code === code)?.name}</span></div>
          <div style={{ overflowX: "auto" }}><svg viewBox={`0 0 ${width} ${chartHeight}`} style={{ width: "100%", minWidth: 480, display: "block" }} role="img" aria-label={`${code} กราฟแท่งแนวนอนแบ่งส่วน ผลการใช้สิทธิ์ของผู้มีสิทธิ์ แยกปี`}>
            <text x={plotLeft} y="25" fill="#74695d" fontSize="13">{percent ? "ร้อยละของผู้มีสิทธิ์" : "จำนวนคน"}</text>
            {[0, 1, 2, 3, 4].map(tick => {
              const x = plotLeft + tick * plotWidth / 4;
              return <g key={tick}><line x1={x} x2={x} y1="40" y2={baseline} stroke="#e3ddd3" strokeDasharray={tick ? "4 4" : undefined} /><text x={x} y={baseline + 22} textAnchor="middle" fill="#7c7266" fontSize="12">{number(maximum * tick / 4)}{percent ? "%" : ""}</text></g>;
            })}
            {years.map((year, index) => {
              const row = rows.find(item => item.code === code && item.year === year);
              const y = 55 + index * 90;
              let accumulated = 0;
              return <g key={year}>
                {row && visible.map(segment => {
                  const value = row[segment.key];
                  const share = row.eligible ? value / row.eligible * 100 : 0;
                  const length = (percent ? share : value) / maximum * plotWidth;
                  const x = plotLeft + accumulated;
                  accumulated += length;
                  const label = `${segment.label}: ${number(value)} คน (${share.toFixed(1)}%)`;
                  return <g key={segment.key}><rect x={x} y={y} width={length} height="42" fill={segment.color} stroke="#fdfbf8" strokeWidth="0.6" opacity={hovered && hovered !== segment.key ? 0.25 : 1} onMouseEnter={() => setHovered(segment.key)} onMouseLeave={() => setHovered(null)}><title>{`${code} ปี ${year} ${label}`}</title></rect>{length > (percent ? 46 : 26) && <text x={x + length / 2} y={y + 26} textAnchor="middle" fill="white" fontSize="12" pointerEvents="none">{percent ? `${share.toFixed(1)}%` : number(value)}</text>}</g>;
                })}
                <text x={plotLeft + accumulated + 9} y={y + 26} fill="#477ca8" fontSize="14" fontWeight="700">{row ? percent ? "100%" : number(row.eligible) : "ไม่มีข้อมูล"}</text>
                <text x={plotLeft - 10} y={y + 26} textAnchor="end" fill="#51483e" fontSize="13">ปี {year}</text>
              </g>;
            })}
            <text x={plotLeft + plotWidth / 2} y={chartHeight - 8} textAnchor="middle" fill="#74695d" fontSize="12">{percent ? "เปอร์เซ็นต์ของผู้มีสิทธิ์" : "จำนวนผู้มีสิทธิ์ (คน)"}</text>
          </svg></div>
        </div>;
      })}
    </div>
    <p style={{ color: "#74695d", fontSize: "var(--text-caption)", marginTop: 16 }}>นับคนไม่ซ้ำภายในปีและรอบ · ตัวเลขปลายแท่งคือผู้มีสิทธิ์ทั้งหมด · สละสิทธิ์รวมสละสิทธิ์ในรอบ 2 · สถานะอื่นรวมเฉพาะสถานะผ่านการคัดเลือกที่ซ่อนไว้ · ชี้แต่ละส่วนเพื่อดูจำนวนและเปอร์เซ็นต์</p>
    {rows.some(row => row.multiple > 0) && <p style={{ color: "#74695d", fontSize: "var(--text-caption)" }}>คนที่มีหลายกลุ่มสถานะจากหลายรายการสมัคร แสดงในส่วน “มีหลายกลุ่มสถานะ” เพียงครั้งเดียว เพื่อให้ผลรวมตรงกับผู้มีสิทธิ์</p>}
  </article>;
}
