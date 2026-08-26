"use client";

import { useMemo, useState } from "react";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getPieArcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngleDeg: number,
  endAngleDeg: number
) {
  const sweep = endAngleDeg - startAngleDeg;
  if (sweep <= 0) return "";

  const effectiveSweep = Math.min(sweep, 359.999);
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = ((startAngleDeg + effectiveSweep) * Math.PI) / 180;

  const x1Outer = cx + rOuter * Math.cos(startRad);
  const y1Outer = cy + rOuter * Math.sin(startRad);
  const x2Outer = cx + rOuter * Math.cos(endRad);
  const y2Outer = cy + rOuter * Math.sin(endRad);

  const x1Inner = cx + rInner * Math.cos(endRad);
  const y1Inner = cy + rInner * Math.sin(endRad);
  const x2Inner = cx + rInner * Math.cos(startRad);
  const y2Inner = cy + rInner * Math.sin(startRad);

  const largeArcFlag = effectiveSweep > 180 ? 1 : 0;

  return `M ${x1Outer} ${y1Outer} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner} Z`;
}

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

export const majorColors = [
  "#c56100", // Amber / Orange
  "#1976d2", // Blue
  "#2e7d32", // Green
  "#7b1fa2", // Purple
  "#c2185b", // Crimson
  "#0097a7", // Teal
  "#e65100", // Deep Orange
  "#5d4037", // Brown
  "#303f9f", // Indigo
  "#00796b", // Dark Teal
];

export function getMajorColor(index: number) {
  return majorColors[index % majorColors.length];
}

export const tcasColors: Record<string, string> = {
  TCAS1: "#477ca8",
  TCAS2: "#c56100",
  TCAS3: "#2e7d32",
  TCAS4: "#8c67a8",
};

export function DonutChartCard({
  title,
  subtitle,
  slices,
  kicker = "ALL-YEAR BREAKDOWN",
  centerLabel = "ผู้สมัครรวมทุกปี",
  centerSubtext = "100% (รวมทุกปี)",
}: {
  title: string;
  subtitle: string;
  slices: PieSlice[];
  kicker?: string;
  centerLabel?: string;
  centerSubtext?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = useMemo(() => slices.reduce((sum, s) => sum + s.value, 0), [slices]);

  const chartData = useMemo(() => {
    return slices.map((slice, idx) => {
      const sharePct = total > 0 ? (slice.value / total) * 100 : 0;
      const angle = (sharePct / 100) * 360;
      const priorValue = slices
        .slice(0, idx)
        .reduce((sum, priorSlice) => sum + priorSlice.value, 0);
      const startAngle = total > 0 ? (priorValue / total) * 360 : 0;
      const endAngle = startAngle + angle;
      return {
        ...slice,
        idx,
        sharePct,
        startAngle,
        endAngle,
      };
    });
  }, [slices, total]);

  const activeSlice = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <article className="analytics-card" style={{ flex: 1, minWidth: "340px", display: "flex", flexDirection: "column" }}>
      <header style={{ marginBottom: "14px" }}>
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
          <small style={{ fontSize: "12px", color: "#666", display: "block", marginTop: "3px" }}>{subtitle}</small>
        </div>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", justifyContent: "center", marginTop: "10px", flex: 1 }}>
        <div style={{ position: "relative", width: "210px", height: "210px", flexShrink: 0 }}>
          <svg viewBox="0 0 220 220" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            {chartData.map((d) => {
              const isHovered = hoveredIndex === d.idx;
              const rOuter = isHovered ? 98 : 93;
              const rInner = 60;
              const pathStr = getPieArcPath(110, 110, rOuter, rInner, d.startAngle, d.endAngle);

              return (
                <path
                  key={d.label}
                  d={pathStr}
                  fill={d.color}
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.45}
                  style={{
                    transition: "all 200ms ease",
                    cursor: "pointer",
                    stroke: "#ffffff",
                    strokeWidth: "2",
                  }}
                  onMouseEnter={() => setHoveredIndex(d.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <title>{`${d.label}: ${formatNumber(d.value)} คน (${d.sharePct.toFixed(2)}%)`}</title>
                </path>
              );
            })}
          </svg>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              textAlign: "center",
              padding: "10px",
            }}
          >
            <small style={{ fontSize: "10.5px", fontWeight: 700, color: "#777", textTransform: "uppercase" }}>
              {activeSlice ? activeSlice.label.split(" — ")[0] : centerLabel}
            </small>
            <strong style={{ fontSize: "17px", fontWeight: 900, color: "#111", margin: "2px 0" }}>
              {formatNumber(activeSlice ? activeSlice.value : total)}
            </strong>
            <span style={{ fontSize: "11px", fontWeight: 800, color: activeSlice ? activeSlice.color : "#444" }}>
              {activeSlice ? `${activeSlice.sharePct.toFixed(2)}%` : centerSubtext}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "230px", overflowY: "auto", paddingRight: "4px" }}>
          {chartData.map((d) => {
            const isHovered = hoveredIndex === d.idx;
            return (
              <div
                key={d.label}
                onMouseEnter={() => setHoveredIndex(d.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 9px",
                  borderRadius: "7px",
                  background: isHovered ? "#f5f0eb" : "transparent",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <i style={{ width: "11px", height: "11px", borderRadius: "3px", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.label}
                  </span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "10px" }}>
                  <strong style={{ fontSize: "11.5px", color: "#111", display: "block" }}>{formatNumber(d.value)}</strong>
                  <small style={{ fontSize: "10px", color: "#666", fontWeight: 600 }}>{d.sharePct.toFixed(1)}%</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
