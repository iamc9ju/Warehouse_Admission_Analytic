"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RoundComparisonChart } from "./round-comparison-chart";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import type { MajorRow, Year, YearOverview } from "../data/dashboard-types";
import type { PageData } from "../data/page-data-types";
import { SidebarNavigation } from "../sidebar-navigation";
import { DonutChartCard, getMajorColor, tcasColors } from "../donut-chart-card";

type RadarMetric = {
  label: string;
  value: number;
  display: string;
  max: number;
};

const yearPalette = [
  "#d2ae7d",
  "#c56100",
  "#477ca8",
  "#4f8a5b",
  "#8c67a8",
  "#c49027",
  "#b4514b",
  "#55727e",
  "#8a6b4b",
  "#3f8f8b",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function MajorTrendLineCharts({
  availableYears,
  majorRows,
}: {
  availableYears: Year[];
  majorRows: MajorRow[];
}) {
  const [hoveredMajor, setHoveredMajor] = useState<string | null>(null);

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, { majorKey: string; name: string }>();
    majorRows.forEach((m) => {
      if (!map.has(m.majorKey)) {
        map.set(m.majorKey, { majorKey: m.majorKey, name: m.name });
      }
    });
    return Array.from(map.values());
  }, [majorRows]);

  return (
    <article className="analytics-card major-ranking-card" style={{ gridColumn: "1 / -1" }}>
      <header>
        <div>
          <span>Major YoY Comparison</span>
          <h2>แนวโน้มผู้สมัคร ผู้มีสิทธิ์ และผู้ยืนยันสิทธิ์แต่ละสาขาวิชา ทุกปี</h2>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/majors" className="link-button" style={{ margin: 0, textDecoration: "none" }}>
            ดูรายละเอียดเจาะลึก →
          </Link>
        </div>
      </header>

      {/* Major Legend Pills with Hover interaction */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 12px",
          margin: "18px 0 24px",
          padding: "14px 18px",
          background: "#faf7f2",
          borderRadius: "12px",
          border: "1px solid #eae2d6",
        }}
      >
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 800, color: "#777", alignSelf: "center", marginRight: "4px" }}>
          สาขาวิชา:
        </span>
        {uniqueMajors.map((m, idx) => {
          const color = getMajorColor(idx);
          const isHovered = hoveredMajor === m.majorKey;
          const isDimmed = hoveredMajor !== null && !isHovered;
          return (
            <button
              key={m.majorKey}
              type="button"
              onMouseEnter={() => setHoveredMajor(m.majorKey)}
              onMouseLeave={() => setHoveredMajor(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "999px",
                border: `1.5px solid ${isHovered ? color : "#e0d8cc"}`,
                background: isHovered ? `${color}18` : "#ffffff",
                cursor: "pointer",
                transition: "all 180ms ease",
                opacity: isDimmed ? 0.45 : 1,
                transform: isHovered ? "scale(1.04)" : "none",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "var(--text-label)", fontWeight: 750, color: isHovered ? color : "#333" }}>
                {m.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Annual people counts by major/program variant */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: "24px",
        }}
      >
        <SingleMajorLineChart
          title="📈 กราฟจำนวนผู้สมัคร (Applicants)"
          subtitle="แนวโน้มจำนวนผู้สมัครของแต่ละสาขาวิชา แยกตามปีการศึกษา"
          metricKey="applicants"
          availableYears={availableYears}
          uniqueMajors={uniqueMajors}
          majorRows={majorRows}
          getColor={getMajorColor}
          hoveredMajor={hoveredMajor}
          setHoveredMajor={setHoveredMajor}
        />
        <SingleMajorLineChart
          title="กราฟจำนวนผู้มีสิทธิ์ (Eligible)"
          subtitle="คนไม่ซ้ำที่มีสถานะในกลุ่มผู้มีสิทธิ์ แยกปีและสาขา รวมทุกรอบ"
          metricKey="eligible"
          availableYears={availableYears}
          uniqueMajors={uniqueMajors}
          majorRows={majorRows}
          getColor={getMajorColor}
          hoveredMajor={hoveredMajor}
          setHoveredMajor={setHoveredMajor}
        />
        <SingleMajorLineChart
          title="✅ กราฟจำนวนผู้ยืนยันสิทธิ์ (Confirmed)"
          subtitle="แนวโน้มจำนวนผู้ยืนยันสิทธิ์ของแต่ละสาขาวิชา แยกตามปีการศึกษา"
          metricKey="confirmed"
          availableYears={availableYears}
          uniqueMajors={uniqueMajors}
          majorRows={majorRows}
          getColor={getMajorColor}
          hoveredMajor={hoveredMajor}
          setHoveredMajor={setHoveredMajor}
        />
      </div>
    </article>
  );
}

function SingleMajorLineChart({
  title,
  subtitle,
  metricKey,
  availableYears,
  uniqueMajors,
  majorRows,
  getColor,
  hoveredMajor,
  setHoveredMajor,
}: {
  title: string;
  subtitle: string;
  metricKey: "applicants" | "eligible" | "confirmed";
  availableYears: Year[];
  uniqueMajors: { majorKey: string; name: string }[];
  majorRows: MajorRow[];
  getColor: (idx: number) => string;
  hoveredMajor: string | null;
  setHoveredMajor: (code: string | null) => void;
}) {
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    year: Year;
    majorName: string;
    value: number;
    color: string;
  } | null>(null);

  const dataByMajor = uniqueMajors.map((m, idx) => {
    const points = availableYears.map((year) => {
      const row = majorRows.find((r) => r.majorKey === m.majorKey && r.year === year);
      return {
        year,
        value: row ? (row[metricKey] ?? 0) : 0,
      };
    });
    return {
      majorKey: m.majorKey,
      name: m.name,
      color: getColor(idx),
      points,
    };
  });

  const allValues = dataByMajor.flatMap((d) => d.points.map((p) => p.value));
  const rawMax = Math.max(...allValues, 10);
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const maxVal = Math.ceil(rawMax / (pow / 2 || 1)) * (pow / 2 || 1) || 10;

  const svgWidth = 560;
  const svgHeight = 420;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 45;
  const padBottom = 50;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (yearIdx: number) => {
    if (availableYears.length <= 1) return padLeft + plotW / 2;
    return padLeft + (yearIdx * plotW) / (availableYears.length - 1);
  };

  const getY = (val: number) => {
    return padTop + plotH - (val / maxVal) * plotH;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(maxVal * pct),
    y: padTop + plotH - pct * plotH,
  }));

  return (
    <div
      style={{
        border: "1px solid #eae2d6",
        borderRadius: "14px",
        background: "#ffffff",
        padding: "20px 22px",
        boxShadow: "0 8px 24px rgba(42, 31, 19, 0.04)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "var(--text-body)", fontWeight: 850, color: "#111313", margin: 0 }}>{title}</h3>
          <span style={{ fontSize: "var(--text-caption)", color: "#6c6f70", marginTop: "3px", display: "block" }}>{subtitle}</span>
        </div>
        <span
          style={{
            fontSize: "var(--text-caption)",
            fontWeight: 800,
            padding: "5px 11px",
            borderRadius: "999px",
            background: metricKey === "applicants" ? "#fff1df" : metricKey === "eligible" ? "#eaf2fa" : "#e8f5e8",
            color: metricKey === "applicants" ? "#8d4c05" : metricKey === "eligible" ? "#477ca8" : "#2f7d32",
            border: `1px solid ${metricKey === "applicants" ? "#f3d2a9" : metricKey === "eligible" ? "#cbdced" : "#c8e6c9"}`,
            whiteSpace: "nowrap",
          }}
        >
          {metricKey === "applicants" ? "จำนวนคนสมัคร" : metricKey === "eligible" ? "จำนวนผู้มีสิทธิ์" : "จำนวนยืนยันสิทธิ์"}
        </span>
      </div>

      <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Horizontal Grid lines & Y-axis labels */}
          {yTicks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                stroke="#eee8e1"
                strokeDasharray={tick.val === 0 ? "none" : "4 4"}
                strokeWidth={tick.val === 0 ? "1.5" : "1"}
              />
              <text x={padLeft - 10} y={tick.y + 4} textAnchor="end" fontSize="var(--text-caption)" fill="#757575" fontWeight="600">
                {formatNumber(tick.val)}
              </text>
            </g>
          ))}

          {/* X-axis year ticks */}
          {availableYears.map((year, yearIdx) => {
            const x = getX(yearIdx);
            return (
              <g key={year}>
                <line x1={x} y1={padTop + plotH} x2={x} y2={padTop + plotH + 6} stroke="#bbb" strokeWidth="1.5" />
                <text x={x} y={padTop + plotH + 24} textAnchor="middle" fontSize="var(--text-label)" fontWeight="800" fill="#333">
                  ปี {year}
                </text>
              </g>
            );
          })}

          {/* Polylines for each major */}
          {dataByMajor.map((m) => {
            const isHovered = hoveredMajor === m.majorKey;
            const isDimmed = hoveredMajor !== null && !isHovered;
            const pathPoints = m.points.map((p, yearIdx) => `${getX(yearIdx)},${getY(p.value)}`).join(" ");

            return (
              <g
                key={m.majorKey}
                onMouseEnter={() => setHoveredMajor(m.majorKey)}
                onMouseLeave={() => setHoveredMajor(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Background wider stroke for easier hover selection */}
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                />

                {/* Visible Line */}
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke={m.color}
                  strokeWidth={isHovered ? "4" : "2.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDimmed ? 0.18 : isHovered ? 1 : 0.85}
                  style={{ transition: "all 180ms ease" }}
                />

                {/* Data Points */}
                {m.points.map((p, yearIdx) => {
                  const cx = getX(yearIdx);
                  const cy = getY(p.value);
                  return (
                    <g
                      key={p.year}
                      onMouseEnter={() =>
                        setActiveTooltip({
                          x: cx,
                          y: cy,
                          year: p.year,
                          majorName: m.name,
                          value: p.value,
                          color: m.color,
                        })
                      }
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? "6.5" : "4.5"}
                        fill={m.color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        opacity={isDimmed ? 0.25 : 1}
                        style={{ transition: "all 180ms ease" }}
                      />
                      {/* Value label on points */}
                      <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        fontSize="var(--text-caption)"
                        fontWeight="800"
                        fill={m.color}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        paintOrder="stroke"
                        opacity={isDimmed ? 0.15 : 1}
                      >
                        {formatNumber(p.value)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeTooltip && (
          <div
            style={{
              position: "absolute",
              top: `${(activeTooltip.y / svgHeight) * 100}%`,
              left: `${(activeTooltip.x / svgWidth) * 100}%`,
              transform: "translate(-50%, -125%)",
              background: "#111313",
              color: "#ffffff",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "var(--text-caption)",
              fontWeight: 700,
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 10,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: activeTooltip.color }} />
              <span style={{ color: "#dddddd", fontSize: "var(--text-caption)" }}>{activeTooltip.majorName} (ปี {activeTooltip.year})</span>
            </div>
            <div style={{ fontSize: "var(--text-label)", fontWeight: 850 }}>
              {metricKey === "applicants" ? "ผู้สมัคร: " : metricKey === "eligible" ? "ผู้มีสิทธิ์: " : "ยืนยันสิทธิ์: "}
              <span style={{ color: "#ffd54f" }}>{formatNumber(activeTooltip.value)} คน</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function colorForYear(year: Year, years: Year[]) {
  const index = Math.max(years.indexOf(year), 0);
  return yearPalette[index % yearPalette.length];
}

function groupRows<T extends { year: Year }>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Map<string, T[]>>((groups, row) => {
    const key = getKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
    return groups;
  }, new Map());
}

function polarPoint(index: number, total: number, radius: number, center = 180) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}



function Tcas3ScoreScatterPlot({
  availableYears,
  majorRows,
}: {
  availableYears: Year[];
  majorRows: MajorRow[];
}) {
  // Derive unique majors (code+name) sorted by total applicants desc
  const uniqueMajors = useMemo(() => {
    const map = new Map<string, { majorKey: string; name: string; totalApplicants: number }>();
    majorRows.forEach((m) => {
      const existing = map.get(m.majorKey) ?? { majorKey: m.majorKey, name: m.name, totalApplicants: 0 };
      existing.totalApplicants += m.applicants;
      map.set(m.majorKey, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalApplicants - a.totalApplicants);
  }, [majorRows]);

  // Selected majors state — all on by default
  const [selectedMajors, setSelectedMajors] = useState<Set<string>>(
    () => new Set(uniqueMajors.map((m) => m.majorKey)),
  );

  const toggleMajor = (code: string) => {
    setSelectedMajors((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedMajors(new Set(uniqueMajors.map((m) => m.majorKey)));
  const clearAll = () => {
    // keep at least 1
    setSelectedMajors(new Set([uniqueMajors[0]?.majorKey ?? ""]));
  };

  const [hoveredPoint, setHoveredPoint] = useState<{
    svgX: number;
    svgY: number;
    major: string;
    year: Year;
    avgScore: number;
    applicants: number;
    confirmed: number;
    rate: number;
    color: string;
  } | null>(null);

  // SVG dimensions
  const svgW = 820;
  const svgH = 460;
  const padL = 62;
  const padR = 28;
  const padT = 44;
  const padB = 56;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // X: discrete year positions
  const activeYears = availableYears; // all years always shown on X
  const getX = (year: Year) => {
  const idx = activeYears.indexOf(year);

  if (activeYears.length <= 1) return padL + plotW / 2;

  const xPadding = 30;

  return (
    padL +
    xPadding +
    (idx * (plotW - xPadding * 2)) / (activeYears.length - 1)
  );
};

  // Y: avgScore — derive range from filtered data
  const filteredRows = useMemo(
    () => majorRows.filter((m) => selectedMajors.has(m.majorKey) && m.avgScore > 0),
    [majorRows, selectedMajors],
  );

  const allScores = filteredRows.map((m) => m.avgScore);
  const rawMin = allScores.length ? Math.min(...allScores) : 0;
  const rawMax = allScores.length ? Math.max(...allScores) : 50;
  const scorePad = (rawMax - rawMin || 10) * 0.12;
  const yMin = Math.max(0, rawMin - scorePad);
  const yMax = rawMax + scorePad;
  const yRange = yMax - yMin || 1;

  const getY = (score: number) => padT + plotH - ((score - yMin) / yRange) * plotH;

  // Bubble size ~ applicants
  const allApplicants = filteredRows.map((m) => m.applicants);
  const maxApp = allApplicants.length ? Math.max(...allApplicants) : 1;
  const getR = (app: number) => 6 + (app / maxApp) * 14;

  // Y-axis ticks (5 evenly spaced)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: yMin + pct * yRange,
    y: padT + plotH - pct * plotH,
  }));

  // Group filtered rows by major code for drawing lines
  const majorLineData = useMemo(() => {
    return uniqueMajors
      .filter((m) => selectedMajors.has(m.majorKey))
      .map((m, idx) => {
        const color = getMajorColor(idx);
        const points = activeYears
          .map((year) => {
            const row = majorRows.find((r) => r.majorKey === m.majorKey && r.year === year);
            return row && row.avgScore > 0
              ? { year, avgScore: row.avgScore, applicants: row.applicants, confirmed: row.confirmed, rate: row.rate }
              : null;
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);
        return { ...m, color, points };
      });
  }, [uniqueMajors, selectedMajors, majorRows, activeYears]);

  return (
    <article className="analytics-card major-ranking-card" style={{ gridColumn: "1 / -1" }}>
      <header>
        <div>
          <span>TCAS3 Score Analysis</span>
          <h2>Scatter Plot คะแนนเฉลี่ยสอบ TCAS รอบ 3 แยกตามสาขาวิชา</h2>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={selectAll}
            style={{
              padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #c56100",
              background: "#fff8f0", color: "#c56100", fontWeight: 800, fontSize: "var(--text-caption)",
              cursor: "pointer", transition: "all 140ms ease",
            }}
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={clearAll}
            style={{
              padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #ddd",
              background: "#f5f5f5", color: "#888", fontWeight: 800, fontSize: "var(--text-caption)",
              cursor: "pointer", transition: "all 140ms ease",
            }}
          >
            ล้างทั้งหมด
          </button>
        </div>
      </header>

      {/* Major filter pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "7px 10px",
          margin: "14px 0 20px",
          padding: "14px 16px",
          background: "#faf7f2",
          borderRadius: "12px",
          border: "1px solid #eae2d6",
        }}
      >
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 800, color: "#777", alignSelf: "center", marginRight: "4px" }}>
          สาขาวิชา:
        </span>
        {uniqueMajors.map((m, idx) => {
          const color = getMajorColor(idx);
          const active = selectedMajors.has(m.majorKey);
          return (
            <button
              key={m.majorKey}
              type="button"
              onClick={() => toggleMajor(m.majorKey)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 11px",
                borderRadius: "999px",
                border: `1.5px solid ${active ? color : "#e0d8cc"}`,
                background: active ? `${color}18` : "#ffffff",
                color: active ? color : "#999",
                fontWeight: 750,
                fontSize: "var(--text-caption)",
                cursor: "pointer",
                transition: "all 150ms ease",
                opacity: active ? 1 : 0.55,
              }}
            >
              <span
                style={{
                  width: "9px", height: "9px", borderRadius: "50%",
                  background: active ? color : "#ccc",
                  display: "inline-block", flexShrink: 0,
                }}
              />
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Legend info bar */}
      <div
        style={{
          display: "flex", gap: "20px", alignItems: "center",
          marginBottom: "16px", flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 700, color: "#555" }}>
          📅 X-axis: ปีการศึกษา
        </span>
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 700, color: "#555" }}>
          📊 Y-axis: คะแนนเฉลี่ย (Avg Score)
        </span>
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 700, color: "#555" }}>
          ⚪ ขนาดวงกลม: จำนวนผู้สมัคร
        </span>
        <span style={{ fontSize: "var(--text-caption)", fontWeight: 700, color: "#555" }}>
          🎨 สี: แยกตามสาขาวิชา
        </span>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-caption)", fontWeight: 700, color: "#aaa" }}>
          {filteredRows.length} จุดข้อมูล · {selectedMajors.size} สาขา
        </span>
      </div>

      <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ width: "100%", height: "auto", display: "block", minWidth: "480px" }}
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick) => (
            <g key={`y-${tick.val.toFixed(2)}`}>
              <line
                x1={padL} y1={tick.y} x2={svgW - padR} y2={tick.y}
                stroke={tick.val === yMin ? "#ccc" : "#eee8e1"}
                strokeDasharray={tick.val === yMin ? "none" : "4 4"}
                strokeWidth={tick.val === yMin ? "1.5" : "1"}
              />
              <text x={padL - 8} y={tick.y + 4} textAnchor="end" fontSize="var(--text-caption)" fill="#757575" fontWeight="600">
                {tick.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Vertical year lines */}
          {activeYears.map((year) => {
            const x = getX(year);
            return (
              <g key={`xgrid-${year}`}>
                <line x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="#eee8e1" strokeDasharray="4 4" strokeWidth="1" />
                <text x={x} y={padT + plotH + 22} textAnchor="middle" fontSize="var(--text-label)" fontWeight="800" fill="#333">
                  ปี {year}
                </text>
              </g>
            );
          })}

          {/* Axis borders */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#bbb" strokeWidth="1.5" />
          <line x1={padL} y1={padT + plotH} x2={svgW - padR} y2={padT + plotH} stroke="#bbb" strokeWidth="1.5" />

          {/* Axis labels */}
          <text x={padL + plotW / 2} y={svgH - 6} textAnchor="middle" fontSize="var(--text-label)" fontWeight="800" fill="#333">
            ปีการศึกษา
          </text>
          <text
            x={13} y={padT + plotH / 2} textAnchor="middle" fontSize="var(--text-label)" fontWeight="800" fill="#333"
            transform={`rotate(-90, 13, ${padT + plotH / 2})`}
          >
            คะแนนเฉลี่ย (Avg Score)
          </text>

          {/* Lines connecting each major's points across years */}
          {/* {majorLineData.map((m) => {
            if (m.points.length < 2) return null;
            const pts = m.points.map((p) => `${getX(p.year)},${getY(p.avgScore)}`).join(" ");
            const isHoveredMajor = hoveredPoint?.major === m.name;
            const dimmed = hoveredPoint !== null && !isHoveredMajor;
            return (
              <polyline
                key={`line-${m.majorKey}`}
                points={pts}
                fill="none"
                stroke={m.color}
                strokeWidth={isHoveredMajor ? "2.5" : "1.5"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 3"
                opacity={dimmed ? 0.12 : isHoveredMajor ? 1 : 0.45}
                style={{ transition: "all 160ms ease", pointerEvents: "none" }}
              />
            );
          })} */}

          {/* Scatter bubbles */}
          {majorLineData.map((m) =>
            m.points.map((p) => {
              const cx = getX(p.year);
              const cy = getY(p.avgScore);
              const r = 6;
              const isHovered = hoveredPoint?.major === m.name && hoveredPoint?.year === p.year;
              const isHoveredMajor = hoveredPoint?.major === m.name;
              const dimmed = hoveredPoint !== null && !isHoveredMajor;
              return (
                <circle
                  key={`dot-${m.majorKey}-${p.year}`}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? r + 3 : r}
                  fill={m.color}
                  opacity={dimmed ? 0.1 : isHovered ? 1 : 0.8}
                  stroke={isHovered ? "#111" : "#fff"}
                  strokeWidth={isHovered ? "2" : "1.5"}
                  style={{
                    cursor: "pointer",
                    transition: "all 160ms ease",
                    filter: isHovered ? "drop-shadow(0 2px 10px rgba(0,0,0,0.3))" : "none",
                  }}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      svgX: cx, svgY: cy,
                      major: m.name, year: p.year,
                      avgScore: p.avgScore, applicants: p.applicants,
                      confirmed: p.confirmed, rate: p.rate, color: m.color,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <title>{`${m.name} (ปี ${p.year}) — คะแนนเฉลี่ย: ${p.avgScore.toFixed(2)}, สมัคร: ${formatNumber(p.applicants)}, ยืนยัน: ${formatNumber(p.confirmed)}`}</title>
                </circle>
              );
            })
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              top: `${(hoveredPoint.svgY / svgH) * 100}%`,
              left: `${(hoveredPoint.svgX / svgW) * 100}%`,
              transform: "translate(-50%, -130%)",
              background: "#111313",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "var(--text-caption)",
              fontWeight: 700,
              boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
              pointerEvents: "none",
              zIndex: 20,
              whiteSpace: "nowrap",
              minWidth: "210px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: hoveredPoint.color, flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-label)", fontWeight: 800 }}>{hoveredPoint.major}</span>
            </div>
            <div style={{ color: "#aaa", fontSize: "var(--text-caption)", marginBottom: "7px" }}>
              ปีการศึกษา {hoveredPoint.year} · TCAS รอบ 3
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "4px 16px", fontSize: "var(--text-caption)" }}>
              <span style={{ color: "#bbb" }}>คะแนนเฉลี่ย</span>
              <span style={{ color: "#ffd54f", fontWeight: 900 }}>{hoveredPoint.avgScore.toFixed(3)}</span>
              <span style={{ color: "#bbb" }}>ผู้สมัคร</span>
              <span style={{ color: "#81d4fa", fontWeight: 900 }}>{formatNumber(hoveredPoint.applicants)} คน</span>
              <span style={{ color: "#bbb" }}>ยืนยันสิทธิ์</span>
              <span style={{ color: "#a5d6a7", fontWeight: 900 }}>{formatNumber(hoveredPoint.confirmed)} คน</span>
              <span style={{ color: "#bbb" }}>อัตราการยืนยัน</span>
              <span style={{ color: "#f48fb1", fontWeight: 900 }}>{hoveredPoint.rate.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function AdmissionsAnalyticsDashboard({ snapshot }: { snapshot: PageData<"dashboard"> }) {
  const { majorRows, rounds, roundStatuses, years } = snapshot;
  const sortedOverviews = [...years].sort((first, second) => first.year - second.year);
  const availableYears = sortedOverviews.map((overview) => overview.year);
  const firstYear = availableYears[0];
  const lastYear = availableYears[availableYears.length - 1];
  const [analysisYear, setAnalysisYear] = useState<Year>(() => lastYear);
  const statusLabels = [
    "ผู้สมัคร",
    "ผู้มีสิทธิ์",
    ...Array.from(new Set(roundStatuses.map((status) => status.label))).filter(
      (label) => label !== "ผู้สมัคร" && label !== "ผู้มีสิทธิ์"
    ),
  ];
  const roundCodes = Array.from(new Set(rounds.map((round) => round.code))).sort();
  const defaultStatus = "ผู้สมัคร";
  const [selectedStatus, setSelectedStatus] = useState(() => defaultStatus);
  const [selectedRoundCode, setSelectedRoundCode] = useState(() => roundCodes[0]);
  const hasManyYears = availableYears.length > 4;

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    majorRows.forEach((m) => {
      if (!map.has(m.code)) {
        map.set(m.code, { code: m.code, name: m.name });
      }
    });
    return Array.from(map.values());
  }, [majorRows]);

  const comparisonKpis = [
    { label: "ตัวเลือกทั้งหมด", key: "choices", format: formatNumber },
    { label: "ผู้สมัครไม่ซ้ำ", key: "applicants", format: formatNumber },
    { label: "ยืนยันสิทธิ์", key: "confirmed", format: formatNumber },
    { label: "ผู้สละสิทธิ์", key: "resigned", format: formatNumber },
  ] as const;

  const selectedRound = rounds.find((round) => round.code === selectedRoundCode);
  const roundStatusValues = availableYears.map((year) => {
    const round = rounds.find((item) => item.year === year && item.code === selectedRoundCode);
    if (!round) return 0;
    if (selectedStatus === "ผู้สมัคร") return round.applicants;
    if (selectedStatus === "ผู้มีสิทธิ์") {
      return round.eligible ?? round.confirmed;
    }
    return roundStatuses.find((status) => (
      status.year === year
      && status.code === selectedRoundCode
      && status.label === selectedStatus
    ))?.applicants ?? 0;
  });
  const maxRoundChartValue = Math.max(...roundStatusValues, 1);

  const majorGroups = [...groupRows(majorRows, (major) => `${major.code}-${major.name}`).entries()]
    .sort(([, firstRows], [, secondRows]) => (
      secondRows.reduce((sum, row) => sum + row.applicants, 0)
      - firstRows.reduce((sum, row) => sum + row.applicants, 0)
    ));

  const tcasRoundSlices = useMemo(() => {
    const tcasColors: Record<string, string> = {
      TCAS1: "#477ca8",
      TCAS2: "#c56100",
      TCAS3: "#2e7d32",
      TCAS4: "#8c67a8",
    };
    const map = new Map<string, { code: string; name: string; choices: number }>();
    rounds.forEach((r) => {
      const existing = map.get(r.code) || { code: r.code, name: r.name, choices: 0 };
      existing.choices += r.choices;
      map.set(r.code, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((item) => ({
        label: `${item.code} — ${item.name}`,
        value: item.choices,
        color: tcasColors[item.code] || "#666666",
      }));
  }, [rounds]);

  const majorSlices = useMemo(() => {
    const map = new Map<string, { code: string; name: string; choices: number }>();
    majorRows.forEach((m) => {
      const key = m.majorKey;
      const existing = map.get(key) || { code: m.code, name: m.name, choices: 0 };
      existing.choices += m.choices;
      map.set(key, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.choices - a.choices)
      .map((item, idx) => ({
        label: item.name,
        value: item.choices,
        color: getMajorColor(idx),
      }));
  }, [majorRows]);

  const selectedOverview = sortedOverviews.find((overview) => overview.year === analysisYear) ?? sortedOverviews[sortedOverviews.length - 1];
  const radarMetrics: RadarMetric[] = selectedOverview ? [
    {
      label: "ตัวเลือก",
      value: selectedOverview.choices,
      display: formatNumber(selectedOverview.choices),
      max: Math.max(...years.map((year) => year.choices), 1),
    },
    {
      label: "ผู้สมัคร",
      value: selectedOverview.applicants,
      display: formatNumber(selectedOverview.applicants),
      max: Math.max(...years.map((year) => year.applicants), 1),
    },
    {
      label: "ยืนยันสิทธิ์",
      value: selectedOverview.confirmed,
      display: formatNumber(selectedOverview.confirmed),
      max: Math.max(...years.map((year) => year.confirmed), 1),
    },
    {
      label: "Conversion",
      value: selectedOverview.rate,
      display: `${selectedOverview.rate.toFixed(2)}%`,
      max: Math.max(...years.map((year) => year.rate), 1),
    },
    {
      label: "คะแนนเฉลี่ย",
      value: selectedOverview.avgScore,
      display: selectedOverview.avgScore.toFixed(2),
      max: Math.max(...years.map((year) => year.avgScore), 1),
    },
    {
      label: "แหล่งข้อมูล",
      value: selectedOverview.sourceFiles,
      display: `${formatNumber(selectedOverview.sourceFiles)} ไฟล์`,
      max: Math.max(...years.map((year) => year.sourceFiles), 1),
    },
  ] : [];
  const radarValues = radarMetrics.map((metric) => metric.value / metric.max);

  const yearDelta = (key: string) => {
    const first = sortedOverviews[0]?.[key as keyof YearOverview] ?? 0;
    const last = sortedOverviews[sortedOverviews.length - 1]?.[key as keyof YearOverview] ?? 0;
    return last - first;
  };


  return (
    <main className="app-frame analytics-app-frame">
      <SidebarNavigation activeHref="/dashboard" />

      <section className="analytics-workspace">
        <header className="analytics-header">
          <div>
            <p>Visual Analytics · All-year comparison</p>
            <h1>Admissions Analytics Dashboard</h1>
            <span>เปรียบเทียบทุกปีที่มีในคลังข้อมูลพร้อมกัน โดยไม่ต้องเลือกปีทีละปี</span>
          </div>
          <div className="analytics-year-summary" aria-label="ช่วงปีที่นำมาเปรียบเทียบ">
            <span>เปรียบเทียบทั้งหมด</span>
            <strong>{availableYears.length} ปี</strong>
            <small>{firstYear}–{lastYear}</small>
          </div>
        </header>

        <div className="dashboard-purpose-note">
          <PresentationChartLineIcon aria-hidden="true" />
          <p><strong>Dashboard</strong> แสดงทุกปีเทียบกันในกราฟเดียว ส่วน <Link href="/">Overview</Link> ใช้ดูรายละเอียดเฉพาะปีที่เลือก</p>
          <span className="analytics-health pass">ข้อมูลพร้อมใช้งาน</span>
        </div>

        <section className={`analytics-kpis comparison-kpis ${hasManyYears ? "many-years" : ""}`} aria-label="ตัวชี้วัดเปรียบเทียบทุกปี">
          {comparisonKpis.map((kpi) => {
            const delta = yearDelta(kpi.key);
            const values = sortedOverviews.map((overview) => overview[kpi.key as keyof typeof overview] as number);
            const firstValue = values[0] ?? 0;
            const latestValue = values[values.length - 1] ?? 0;
            const totalValue = kpi.key === "choices"
              ? values.reduce((sum, val) => sum + val, 0)
              : snapshot.allYearPeople[kpi.key];
            const percentChange = firstValue === 0 ? 0 : (delta / firstValue) * 100;
            const minimum = Math.min(...values);
            const maximum = Math.max(...values);
            const range = maximum - minimum || 1;
            const trendPoints = values.map((value, index) => {
              const x = values.length === 1 ? 110 : 12 + (index * 196) / (values.length - 1);
              const y = maximum === minimum ? 35 : 55 - ((value - minimum) / range) * 38;
              return { x, y, value, year: sortedOverviews[index]?.year };
            });
            const directionClass = delta >= 0 ? "up" : "down";
            const directionLabel = delta > 0 ? "เพิ่มขึ้น" : delta < 0 ? "ลดลง" : "ทรงตัว";
            return (
              <article className="kpi-trend-card" key={kpi.label}>
                <header className="kpi-trend-header">
                  <span>{kpi.label}</span>
                  <b className={directionClass} aria-label={`แนวโน้ม${directionLabel}`}>
                    <i aria-hidden="true">{delta > 0 ? "↗" : delta < 0 ? "↘" : "→"}</i>
                    {directionLabel}
                  </b>
                </header>
                <div className="kpi-latest-value">
                  <span>ทั้งหมด</span>
                  <strong>{kpi.format(totalValue)}</strong>
                </div>
                <div className="kpi-sparkline-wrap">
                  <svg className="kpi-sparkline" viewBox="0 0 220 70" role="img" aria-label={`แนวโน้ม${kpi.label}ตั้งแต่ปี ${firstYear} ถึง ${lastYear}`}>
                    <line className="kpi-sparkline-baseline" x1="12" y1="55" x2="208" y2="55" />
                    <polyline
                      className={`kpi-sparkline-line ${directionClass}`}
                      points={trendPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    />
                    {trendPoints.map((point) => (
                      <circle
                        className={`kpi-sparkline-point ${directionClass}`}
                        cx={point.x}
                        cy={point.y}
                        key={point.year}
                        r="4"
                      />
                    ))}
                  </svg>
                  <div className="kpi-trend-years" aria-hidden="true">
                    <span>{firstYear}<strong>{kpi.format(firstValue)}</strong></span>
                    <span style={{ textAlign: "center" }}>2568<strong>{kpi.format(values[1] ?? 0)}</strong></span>
                    <span>{lastYear}<strong>{kpi.format(latestValue)}</strong></span>
                  </div>
                </div>
                <footer className={directionClass}>
                  <strong>{delta > 0 ? "+" : ""}{formatNumber(delta)}</strong>
                  <span>{percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}% จากปี {firstYear}</span>
                </footer>
              </article>
            );
          })}
        </section>

        {/* Section: สัดส่วนผู้สมัครรวมทุกปี แถวที่ 2 (2 วง: TCAS 4 รอบ & ทุกคณะ/สาขาวิชา) */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "22px",
            margin: "24px 0",
          }}
        >
          <DonutChartCard
            title="สัดส่วนรายการสมัครรวมทุกปี (TCAS 4 รอบ)"
            subtitle="รวมจำนวนตัวเลือกสมัครทุกปีการศึกษา แยกตามรอบ TCAS 1 - 4"
            slices={tcasRoundSlices}
            centerLabel="รายการสมัครรวมทุกปี"
          />
          <DonutChartCard
            title="สัดส่วนรายการสมัครรวมทุกปี (ทุกสาขาวิชา)"
            subtitle="รวมจำนวนตัวเลือกสมัครทุกปีการศึกษา แยกตามสาขาวิชา"
            slices={majorSlices}
            centerLabel="รายการสมัครรวมทุกปี"
          />
        </section>

        <section className={`analytics-chart-grid ${hasManyYears ? "many-years" : ""}`} data-year-count={availableYears.length}>
          <RoundComparisonChart rounds={rounds} years={availableYears} />

          <MajorTrendLineCharts
            availableYears={availableYears}
            majorRows={majorRows}
          />

          <Tcas3ScoreScatterPlot
            availableYears={availableYears}
            majorRows={majorRows}
          />
        </section>
      </section>
    </main>
  );
}
