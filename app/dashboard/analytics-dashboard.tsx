"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import type { DashboardSnapshot, MajorRow, Year, YearOverview } from "../data/dashboard-types";
import { SidebarNavigation } from "../sidebar-navigation";
import { calculateEligibleFromStatusRows } from "../data/eligible-calculator";

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

const majorColors = [
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

function getMajorColor(index: number) {
  return majorColors[index % majorColors.length];
}

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
    const map = new Map<string, { code: string; name: string }>();
    majorRows.forEach((m) => {
      if (!map.has(m.code)) {
        map.set(m.code, { code: m.code, name: m.name });
      }
    });
    return Array.from(map.values());
  }, [majorRows]);

  return (
    <article className="analytics-card major-ranking-card" style={{ gridColumn: "1 / -1" }}>
      <header>
        <div>
          <span>Major YoY Comparison</span>
          <h2>แนวโน้มผู้สมัครและผู้ยืนยันสิทธิ์แต่ละสาขาวิชา ทุกปี</h2>
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
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#777", alignSelf: "center", marginRight: "4px" }}>
          สาขาวิชา:
        </span>
        {uniqueMajors.map((m, idx) => {
          const color = getMajorColor(idx);
          const isHovered = hoveredMajor === m.code;
          const isDimmed = hoveredMajor !== null && !isHovered;
          return (
            <button
              key={m.code}
              type="button"
              onMouseEnter={() => setHoveredMajor(m.code)}
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
              <span style={{ fontSize: "12.5px", fontWeight: 750, color: isHovered ? color : "#333" }}>
                {m.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2 Line Charts in Grid */}
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
  metricKey: "applicants" | "confirmed";
  availableYears: Year[];
  uniqueMajors: { code: string; name: string }[];
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
      const row = majorRows.find((r) => r.code === m.code && r.year === year);
      return {
        year,
        value: row ? row[metricKey] : 0,
      };
    });
    return {
      code: m.code,
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
          <h3 style={{ fontSize: "16px", fontWeight: 850, color: "#111313", margin: 0 }}>{title}</h3>
          <span style={{ fontSize: "12px", color: "#6c6f70", marginTop: "3px", display: "block" }}>{subtitle}</span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            padding: "5px 11px",
            borderRadius: "999px",
            background: metricKey === "applicants" ? "#fff1df" : "#e8f5e8",
            color: metricKey === "applicants" ? "#8d4c05" : "#2f7d32",
            border: `1px solid ${metricKey === "applicants" ? "#f3d2a9" : "#c8e6c9"}`,
            whiteSpace: "nowrap",
          }}
        >
          {metricKey === "applicants" ? "จำนวนคนสมัคร" : "จำนวนยืนยันสิทธิ์"}
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
              <text x={padLeft - 10} y={tick.y + 4} textAnchor="end" fontSize="11" fill="#757575" fontWeight="600">
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
                <text x={x} y={padTop + plotH + 24} textAnchor="middle" fontSize="13" fontWeight="800" fill="#333">
                  ปี {year}
                </text>
              </g>
            );
          })}

          {/* Polylines for each major */}
          {dataByMajor.map((m) => {
            const isHovered = hoveredMajor === m.code;
            const isDimmed = hoveredMajor !== null && !isHovered;
            const pathPoints = m.points.map((p, yearIdx) => `${getX(yearIdx)},${getY(p.value)}`).join(" ");

            return (
              <g
                key={m.code}
                onMouseEnter={() => setHoveredMajor(m.code)}
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
                        fontSize="10"
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
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 10,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: activeTooltip.color }} />
              <span style={{ color: "#dddddd", fontSize: "11px" }}>{activeTooltip.majorName} (ปี {activeTooltip.year})</span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 850 }}>
              {metricKey === "applicants" ? "ผู้สมัคร: " : "ยืนยันสิทธิ์: "}
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

function getPieArcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngleDeg: number, endAngleDeg: number) {
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

type PieSlice = {
  label: string;
  value: number;
  color: string;
};

function DonutChartCard({
  title,
  subtitle,
  slices,
}: {
  title: string;
  subtitle: string;
  slices: PieSlice[];
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
          <span>ALL-YEAR BREAKDOWN</span>
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
              {activeSlice ? activeSlice.label.split(" — ")[0] : "ผู้สมัครรวมทุกปี"}
            </small>
            <strong style={{ fontSize: "17px", fontWeight: 900, color: "#111", margin: "2px 0" }}>
              {formatNumber(activeSlice ? activeSlice.value : total)}
            </strong>
            <span style={{ fontSize: "11px", fontWeight: 800, color: activeSlice ? activeSlice.color : "#444" }}>
              {activeSlice ? `${activeSlice.sharePct.toFixed(2)}%` : "100% (รวมทุกปี)"}
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

export function AdmissionsAnalyticsDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { majorRows, rounds, roundStatuses, statuses, warehouseHealth, years } = snapshot;
  const sortedOverviews = [...years].sort((first, second) => first.year - second.year);
  const availableYears = sortedOverviews.map((overview) => overview.year);
  const firstYear = availableYears[0];
  const lastYear = availableYears[availableYears.length - 1];
  const lastYearOverview = sortedOverviews[sortedOverviews.length - 1];
  const [analysisYear, setAnalysisYear] = useState<Year>(() => lastYear);
  const statusLabels = [
    "ผู้สมัคร",
    "ผู้มีสิทธิ์",
    ...Array.from(new Set(roundStatuses.map((status) => status.label))).filter(
      (label) => label !== "ผู้สมัคร" && label !== "ผู้มีสิทธิ์"
    ),
  ];
  const roundCodes = Array.from(new Set(rounds.map((round) => round.code))).sort();
  const [roundDisplayMode, setRoundDisplayMode] = useState<"value" | "percent">("value");

  const maxOverallApplicants = useMemo(() => {
    return Math.max(...rounds.map((r) => r.applicants), 1);
  }, [rounds]);

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
    { label: "สละสิทธิ์", key: "resigned", format: formatNumber },
  ] as const;

  const selectedRound = rounds.find((round) => round.code === selectedRoundCode);
  const roundStatusValues = availableYears.map((year) => {
    const round = rounds.find((item) => item.year === year && item.code === selectedRoundCode);
    if (!round) return 0;
    if (selectedStatus === "ผู้สมัคร") return round.applicants;
    if (selectedStatus === "ผู้มีสิทธิ์") {
      const items = roundStatuses.filter(
        (rs) => rs.year === year && rs.code === selectedRoundCode
      );
      const val = calculateEligibleFromStatusRows(items, "applicants");
      return val > 0 ? val : Math.max(round.confirmed, Math.round(round.applicants * 0.2376));
    }
    return roundStatuses.find((status) => (
      status.year === year
      && status.code === selectedRoundCode
      && status.label === selectedStatus
    ))?.choices ?? 0;
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
    const map = new Map<string, { code: string; name: string; applicants: number }>();
    rounds.forEach((r) => {
      const existing = map.get(r.code) || { code: r.code, name: r.name, applicants: 0 };
      existing.applicants += r.applicants;
      map.set(r.code, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((item) => ({
        label: `${item.code} — ${item.name}`,
        value: item.applicants,
        color: tcasColors[item.code] || "#666666",
      }));
  }, [rounds]);

  const majorSlices = useMemo(() => {
    const map = new Map<string, { code: string; name: string; applicants: number }>();
    majorRows.forEach((m) => {
      const existing = map.get(m.code) || { code: m.code, name: m.name, applicants: 0 };
      existing.applicants += m.applicants;
      map.set(m.code, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.applicants - a.applicants)
      .map((item, idx) => ({
        label: item.name,
        value: item.applicants,
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
    const first = key === "resigned"
      ? statuses.filter((s) => s.year === sortedOverviews[0]?.year && (s.label === "สละสิทธิ์" || s.label === "สละสิทธิ์ในรอบ 2")).reduce((sum, s) => sum + s.choices, 0)
      : sortedOverviews[0]?.[key as keyof YearOverview] ?? 0;
    const last = key === "resigned"
      ? statuses.filter((s) => s.year === sortedOverviews[sortedOverviews.length - 1]?.year && (s.label === "สละสิทธิ์" || s.label === "สละสิทธิ์ในรอบ 2")).reduce((sum, s) => sum + s.choices, 0)
      : sortedOverviews[sortedOverviews.length - 1]?.[key as keyof YearOverview] ?? 0;
    return last - first;
  };

  const roundGroups = roundCodes.map((code) => {
    const roundMeta = rounds.find((r) => r.code === code);
    return {
      code,
      name: roundMeta?.name ?? "",
      rows: rounds.filter((r) => r.code === code),
    };
  });

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
          <span className={`analytics-health ${warehouseHealth.status}`}>{warehouseHealth.status === "pass" ? "ข้อมูลพร้อมใช้งาน" : "ตรวจสอบข้อมูล"}</span>
        </div>

        <section className={`analytics-kpis comparison-kpis ${hasManyYears ? "many-years" : ""}`} aria-label="ตัวชี้วัดเปรียบเทียบทุกปี">
          {comparisonKpis.map((kpi) => {
            const delta = yearDelta(kpi.key);
            const values = kpi.key === "resigned"
              ? sortedOverviews.map((o) => (
                  statuses
                    .filter((s) => s.year === o.year && (s.label === "สละสิทธิ์" || s.label === "สละสิทธิ์ในรอบ 2"))
                    .reduce((sum, s) => sum + s.choices, 0)
                ))
              : sortedOverviews.map((overview) => overview[kpi.key as keyof typeof overview] as number);
            const firstValue = values[0] ?? 0;
            const latestValue = values[values.length - 1] ?? 0;
            const totalValue = values.reduce((sum, val) => sum + val, 0);
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
            title="สัดส่วนผู้สมัครรวมทุกปี (TCAS 4 รอบ)"
            subtitle="รวมจำนวนผู้สมัครทุกปีการศึกษา แยกตามรอบ TCAS 1 - 4"
            slices={tcasRoundSlices}
          />
          <DonutChartCard
            title="สัดส่วนผู้สมัครรวมทุกปี (ทุกสาขาวิชา)"
            subtitle="รวมจำนวนผู้สมัครทุกปีการศึกษา แยกตามสาขาวิชา"
            slices={majorSlices}
          />
        </section>

        <section className={`analytics-chart-grid ${hasManyYears ? "many-years" : ""}`} data-year-count={availableYears.length}>
          <article className="analytics-card year-comparison-card" style={{ gridColumn: "1 / -1" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span>Round YoY Comparison</span>
                <h2 style={{ margin: "2px 0 0" }}>ภาพรวมผู้สมัคร ผู้มีสิทธิ์ และยืนยันสิทธิ์แต่ละรอบทุกปี</h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div className="analytics-legend" style={{ gap: "12px 18px", margin: 0 }}>
                  <span><i style={{ background: "#c56100", border: "1px solid #c56100" }} />ผู้สมัคร</span>
                  <span><i style={{ background: "#477ca8" }} />ผู้มีสิทธิ์</span>
                  <span><i style={{ background: "#2e7d32" }} />ยืนยันสิทธิ์</span>
                </div>
                {/* f5c38b */}

                <div style={{ display: "flex", background: "#eae2d6", borderRadius: "8px", padding: "3px" }}>
                  <button
                    type="button"
                    onClick={() => setRoundDisplayMode("value")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 750,
                      cursor: "pointer",
                      background: roundDisplayMode === "value" ? "#ffffff" : "transparent",
                      color: roundDisplayMode === "value" ? "#111111" : "#666666",
                      boxShadow: roundDisplayMode === "value" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                      transition: "all 150ms ease",
                    }}
                  >
                    จำนวนคน
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundDisplayMode("percent")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 750,
                      cursor: "pointer",
                      background: roundDisplayMode === "percent" ? "#ffffff" : "transparent",
                      color: roundDisplayMode === "percent" ? "#111111" : "#666666",
                      boxShadow: roundDisplayMode === "percent" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                      transition: "all 150ms ease",
                    }}
                  >
                    เปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>
            </header>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "18px",
                marginTop: "16px",
              }}
            >
              {roundGroups.map((group) => {
                return (
                  <div
                    key={group.code}
                    style={{
                      border: "1px solid #e5ded6",
                      borderRadius: "10px",
                      background: "#fdfbf8",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <strong style={{ fontSize: "16px", color: "#242424" }}>{group.code}</strong>
                      <small style={{ color: "#777", fontSize: "13px", fontWeight: 600 }}>{group.name}</small>
                    </div>

                    <div className="year-bars" style={{ height: "260px", justifyContent: "space-around", borderBottom: "1px solid #ddd7d0", paddingBottom: "4px" }}>
                      {availableYears.map((year) => {
                        const row = group.rows.find((r) => r.year === year);
                        const appVal = row?.applicants ?? 0;
                        const confVal = row?.confirmed ?? 0;

                        const roundStatusItems = roundStatuses.filter(
                          (rs) => rs.year === year && rs.code === group.code
                        );
                        const eligValFromStatuses = calculateEligibleFromStatusRows(roundStatusItems, "applicants");

                        const eligVal = eligValFromStatuses > 0
                          ? Math.min(appVal, Math.max(confVal, eligValFromStatuses))
                          : Math.max(confVal, Math.round(appVal * (lastYearOverview?.rate ? lastYearOverview.rate / 100 : 0.2376)));

                        const containerH = 220;
                        const appBarHeightPx = appVal > 0 ? Math.max(12, Math.round((appVal / maxOverallApplicants) * containerH)) : 0;
                        const eligPctOfApp = appVal > 0 ? (eligVal / appVal) * 100 : 0;
                        const confPctOfApp = appVal > 0 ? (confVal / appVal) * 100 : 0;
                        const confPctOfElig = eligVal > 0 ? (confVal / eligVal) * 100 : 0;

                        return (
                          <div key={year} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                            <i
                              title={`${year} ${group.code}: ผู้สมัคร ${formatNumber(appVal)} คน | ผู้มีสิทธิ์ ${formatNumber(eligVal)} คน (${eligPctOfApp.toFixed(1)}%) | ยืนยันสิทธิ์ ${formatNumber(confVal)} คน (${confPctOfElig.toFixed(1)}% ของผู้มีสิทธิ์)`}
                              style={{
                                height: `${appBarHeightPx}px`,
                                background: "#c56100",
                                border: "1px solid #c56100",
                                position: "relative",
                                overflow: "visible",
                                borderRadius: "4px 4px 0 0",
                                width: "44px",
                                flex: "none",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: `${eligPctOfApp}%`,
                                  background: "#477ca8",
                                  borderRadius: eligPctOfApp >= 98 ? "3px 3px 0 0" : "0",
                                  transition: "height 300ms ease",
                                }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: `${confPctOfApp}%`,
                                  background: "#2e7d32",
                                  borderRadius: confPctOfApp >= 98 ? "3px 3px 0 0" : "0",
                                  transition: "height 300ms ease",
                                }}
                              />
                              <b style={{ position: "absolute", top: "-22px", left: "50%", transform: "translateX(-50%)", fontSize: "11px", whiteSpace: "nowrap", color: "#333" }}>
                                {roundDisplayMode === "value" ? formatNumber(appVal) : (appVal > 0 ? "100%" : "0%")}
                              </b>
                              {confVal > 0 && (
                                <small
                                  style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    fontSize: "10px",
                                    color: "#ffffff",
                                    fontWeight: 800,
                                    whiteSpace: "nowrap",
                                    zIndex: 2,
                                    pointerEvents: "none",
                                  }}
                                >
                                  {roundDisplayMode === "value" ? formatNumber(confVal) : `${confPctOfApp.toFixed(1)}%`}
                                </small>
                              )}
                            </i>
                            <span style={{ fontSize: "13px", fontWeight: 750, marginTop: "8px", color: "#555" }}>ปี {year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <MajorTrendLineCharts
            availableYears={availableYears}
            majorRows={majorRows}
          />
        </section>
      </section>
    </main>
  );
}
