"use client";

import { useState } from "react";
import type { RoundRow } from "../data/dashboard-types";

const metrics = [
  { key: "applicants", label: "ผู้สมัคร", color: "#c56100" },
  { key: "eligible", label: "ผู้มีสิทธิ์", color: "#477ca8" },
  { key: "confirmed", label: "ยืนยันสิทธิ์", color: "#2e7d32" },
] as const;
type Metric = typeof metrics[number]["key"];
const number = (value: number) => value.toLocaleString("en-US");

export function RoundComparisonChart({ rounds, years }: { rounds: RoundRow[]; years: number[] }) {
  const [hovered, setHovered] = useState<Metric | null>(null);
  const emphasized = hovered;
  const [percent, setPercent] = useState(false);
  const codes = Array.from(new Set(rounds.map((row) => row.code))).sort();
  const valueOf = (row: RoundRow, key: Metric) => row[key] ?? 0;
  const display = (row: RoundRow, key: Metric) => percent
    ? `${(row.applicants ? valueOf(row, key) / row.applicants * 100 : 0).toFixed(1)}%`
    : number(valueOf(row, key));

  return <article className="analytics-card year-comparison-card" style={{ gridColumn: "1 / -1" }}>
    <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <div><span>Round YoY Comparison</span><h2>ภาพรวมผู้สมัคร ผู้มีสิทธิ์ และยืนยันสิทธิ์แต่ละรอบทุกปี</h2></div>
      <div style={{ display: "flex", gap: 6 }}>
        {[false, true].map((mode) => <button key={String(mode)} type="button" aria-pressed={percent === mode} onClick={() => setPercent(mode)} style={{ padding: "7px 12px", border: "1px solid #ded5c8", borderRadius: 8, background: percent === mode ? "#fff0dd" : "white", cursor: "pointer" }}>{mode ? "เปอร์เซ็นต์ (%)" : "จำนวนคน"}</button>)}
      </div>
    </header>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", margin: "18px 0 16px", padding: "14px 18px", background: "#faf7f2", borderRadius: 12, border: "1px solid #eae2d6" }}>
      {metrics.map((metric) => <span key={metric.key} tabIndex={0} onMouseEnter={() => setHovered(metric.key)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(metric.key)} onBlur={() => setHovered(null)} style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${emphasized === metric.key ? metric.color : "#e0d8cc"}`, borderRadius: 999, padding: "6px 12px", background: emphasized === metric.key ? `${metric.color}18` : "white", color: emphasized === metric.key ? metric.color : "#333", fontSize: "var(--text-label)", fontWeight: 750, opacity: emphasized && emphasized !== metric.key ? 0.45 : 1, transform: emphasized === metric.key ? "scale(1.04)" : "none", transition: "all 180ms ease", cursor: "default" }}>
        <span style={{ width: 12, height: 12, background: metric.color, borderRadius: "50%" }} />{metric.label}
      </span>)}
    </div>
    <p style={{ fontSize: "var(--text-caption)", color: "#74695d", margin: "0 0 12px" }}>แกนตั้งปรับตามจำนวนผู้สมัครของแต่ละรอบ โปรดดูค่าบนแกนเมื่อเทียบข้ามรอบ</p>
    <div className="round-comparison-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
      {codes.map((code) => {
        const peak = Math.max(...rounds.filter((row) => row.code === code).map((row) => row.applicants), 1);
        const step = peak <= 400 ? 100 : 500;
        const maximum = percent ? 100 : Math.ceil(peak / step) * step;
        return <div key={code} style={{ padding: 18, border: "1px solid #e5ded6", borderRadius: 10, background: "#fdfbf8", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{code}</strong><span style={{ color: "#777", fontSize: "var(--text-label)" }}>{rounds.find((row) => row.code === code)?.name}</span></div>
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${Math.max(520, years.length * 125 + 80)} 510`} style={{ width: "100%", minWidth: 420, display: "block" }} aria-label={`${code} แกนตั้งจำนวน${percent ? "เปอร์เซ็นต์" : "คน"} แกนนอนปีการศึกษา`}>
            <text x="8" y="25" fontSize="var(--text-caption)" fill="#74695d">{percent ? "เปอร์เซ็นต์ (%)" : "จำนวนคน"}</text>
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = 450 - tick * 97;
              return <g key={tick}><line x1="58" x2={Math.max(500, years.length * 125 + 60)} y1={y} y2={y} stroke="#e3ddd3" strokeDasharray={tick ? "4 4" : undefined} /><text x="50" y={y + 4} textAnchor="end" fontSize="var(--text-caption)" fill="#7c7266">{number(maximum * tick / 4)}{percent ? "%" : ""}</text></g>;
            })}
            <line x1="58" x2="58" y1="62" y2="450" stroke="#bdb3a5" />
            {years.map((year, index) => {
              const row = rounds.find((item) => item.code === code && item.year === year);
              const plotWidth = Math.max(442, years.length * 125 + 2);
              const x = 58 + (index + 0.5) * plotWidth / years.length;
              if (!row) return <text key={year} x={x} y="475" textAnchor="middle" fontSize="var(--text-caption)">{year} ไม่มีข้อมูล</text>;
              const height = (key: Metric) => (percent ? (row.applicants ? valueOf(row, key) / row.applicants * 100 : 0) : valueOf(row, key)) / maximum * 388;
              return <g key={year} onMouseLeave={() => setHovered(null)}>
                {metrics.map((metric) => {
                  const top = height(metric.key);
                  const dimmed = emphasized !== null;
                  return <rect key={metric.key} x={x - 42} y={450 - top} width="84" height={Math.max(0, top)} fill={dimmed ? "#e5ded3" : metric.color} stroke="#fdfbf8" strokeWidth="0.6" role="img" focusable="false" aria-label={`${code} ปี ${year} ${metric.label} ${number(valueOf(row, metric.key))} คน`} onMouseEnter={() => { setHovered(metric.key); }} onFocus={() => setHovered(metric.key)} onBlur={() => setHovered(null)} style={{ cursor: "default", outline: "none", transition: "fill 180ms ease" }}><title>{`${metric.label}: ${number(valueOf(row, metric.key))} คน`}</title></rect>;
                })}
                {emphasized && <rect x={x - 42} y={450 - height(emphasized)} width="84" height={height(emphasized)} fill={metrics.find((metric) => metric.key === emphasized)?.color} pointerEvents="none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" }} />}
                <text x={x} y={450 - height(emphasized ?? "applicants") - 10} textAnchor="middle" fontSize="var(--text-label)" fontWeight="700" fill="#302b26" pointerEvents="none">{display(row, emphasized ?? "applicants")}</text>
                <text x={x} y="475" textAnchor="middle" fontSize="var(--text-label)" fill="#51483e">ปี {year}</text>
              </g>;
            })}
            <text x="290" y="503" textAnchor="middle" fontSize="var(--text-caption)" fill="#74695d">ปีการศึกษา</text>
          </svg>
        </div>
      </div>; })}
    </div>
  </article>;
}
