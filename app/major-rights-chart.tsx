"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DashboardSnapshot, MajorRow } from "./data/dashboard-types";
import { segments } from "./dashboard/rights-outcomes-chart";
import { getMajorColor } from "./donut-chart-card";

export function MajorRightsChart({ rows, majors, year }: {
  rows: DashboardSnapshot["majorRightsOutcomes"]; majors: MajorRow[]; year: number;
}) {
  const chartRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [percent, setPercent] = useState(false);
  const tooltipWidth = 300;
  function placeTooltip(target: HTMLElement, label: string) {
    const box = target.getBoundingClientRect();
    const chart = chartRef.current?.getBoundingClientRect();
    const width = Math.min(tooltipWidth, window.innerWidth - 16, (chart?.width ?? tooltipWidth) - 16);
    const left = Math.max(8, chart?.left ?? 8);
    const right = Math.min(window.innerWidth - 8, chart?.right ?? window.innerWidth - 8);
    setTooltip({ label, x: Math.max(left, Math.min(box.left + box.width / 2 - width / 2, right - width)), y: Math.max(8, box.top - 8) });
  }
  const displayRows = rows.map(row => ({ ...row, eligible: row.eligible - row.multiple }));
  const data = majors.filter(m => m.year === year).map(major => ({ major, row: displayRows.find(r => r.year === year && r.code === major.majorKey) }));
  const maximum = Math.max(1, ...data.map(d => d.row?.eligible ?? 0));
  const visible = segments.filter(s => data.some(d => (d.row?.[s.key] ?? 0) > 0));
  return <article ref={chartRef} className="panel" style={{ gridColumn: "1 / -1" }}>
    <div className="panel-title"><h2>ผลการใช้สิทธิ์ของผู้มีสิทธิ์ รายสาขา ปี {year}</h2>
      <div>{[false, true].map(mode => <button type="button" key={String(mode)} aria-pressed={percent === mode} onClick={() => setPercent(mode)} style={{ padding: "8px 12px", background: percent === mode ? "#fff0dd" : "white", border: "1px solid #ded5c8", borderRadius: 6, cursor: "pointer" }}>{mode ? "เปอร์เซ็นต์ (%)" : "จำนวนคน"}</button>)}</div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "20px 0" }}>{visible.map(s => <span key={s.key} tabIndex={0} onMouseEnter={() => setHovered(s.key)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(s.key)} onBlur={() => setHovered(null)} style={{ opacity: hovered && hovered !== s.key ? 0.4 : 1, transition: "opacity 150ms" }}><i style={{ display: "inline-block", width: 12, height: 12, background: s.color, marginRight: 6 }} />{s.label}</span>)}</div>
    {data.map(({ major, row }) => <div key={major.majorKey} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 32%) minmax(0, 1fr)", gap: 16, margin: "22px 0", alignItems: "center" }}>
      <strong style={{ color: getMajorColor(major.name, major.type) }}>{major.name}{!major.name.includes(major.type) && major.type ? ` (${major.type})` : ""}</strong>
      <div><div style={{ display: "flex", height: 32, background: "#f0ede8", borderRadius: 4, overflow: "hidden" }} role="img" aria-label={`${major.name}: ผู้มีสิทธิ์ ${row?.eligible ?? 'ไม่มีข้อมูล'} คน`}>
        {row && visible.map(s => { const value = row[s.key]; const share = row.eligible ? value / row.eligible * 100 : 0; return <div key={s.key} tabIndex={value > 0 ? 0 : -1} aria-label={`${major.name} ${s.label}: ${value.toLocaleString()} คน (${share.toFixed(1)}%)`}
          onMouseEnter={e => { setHovered(s.key); placeTooltip(e.currentTarget, `${major.name} · ${s.label}: ${value.toLocaleString()} คน (${share.toFixed(1)}%)`); }}
          onMouseMove={e => placeTooltip(e.currentTarget, `${major.name} · ${s.label}: ${value.toLocaleString()} คน (${share.toFixed(1)}%)`)}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}
          onFocus={e => { setHovered(s.key); placeTooltip(e.currentTarget, `${major.name} · ${s.label}: ${value.toLocaleString()} คน (${share.toFixed(1)}%)`); }}
          onBlur={() => { setHovered(null); setTooltip(null); }} style={{ background: s.color, width: `${percent ? share : value / maximum * 100}%`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, borderRight: "1px solid #ffffff88", opacity: hovered && hovered !== s.key ? 0.25 : 1, transition: "opacity 150ms", cursor: "default", overflow: "hidden" }}>
          {(percent ? share : value / maximum * 100) >= 5 && value > 0 && <span style={{ pointerEvents: "none", whiteSpace: "nowrap", textShadow: "0 1px 2px #0009" }}>{percent ? `${share.toFixed(1)}%` : value.toLocaleString()}</span>}
        </div>; })}
      </div><small>{row ? `ผู้มีสิทธิ์ ${row.eligible.toLocaleString()} คน` : "ไม่มีข้อมูล"}</small></div>
    </div>)}
    {tooltip && createPortal(<div role="tooltip" style={{ position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translateY(-100%)", width: 300, maxWidth: "calc(100vw - 16px)", boxSizing: "border-box", overflowWrap: "anywhere", whiteSpace: "normal", padding: "10px 14px", background: "#202938", color: "white", borderRadius: 8, boxShadow: "0 4px 16px #0003", zIndex: 1000, pointerEvents: "none", fontSize: 14 }}>{tooltip.label}</div>, document.body)}
    <p>นับคนไม่ซ้ำภายในปีและสาขา รวมทุกรอบ · ชี้แต่ละส่วนเพื่อดูจำนวนและเปอร์เซ็นต์ · สีในแท่งแสดงสถานะ ส่วนสีชื่อแสดงสาขาวิชา</p>
    <small>ยอดรวมและเปอร์เซ็นต์คิดเฉพาะสถานะที่แสดง</small>
  </article>;
}
