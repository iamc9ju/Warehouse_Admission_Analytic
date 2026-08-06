"use client";

import { useState } from "react";
import Link from "next/link";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import type { DashboardSnapshot, MajorRow, Year } from "./data/dashboard-types";
import { SidebarNavigation } from "./sidebar-navigation";

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

function radarPolygon(values: number[], radius = 112) {
  return values
    .map((value, index) => {
      const point = polarPoint(index, values.length, radius * Math.max(value, 0.08));
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

export function AdmissionsAnalyticsDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { majorRows, rounds, roundStatuses, statuses, warehouseHealth, years } = snapshot;
  const sortedOverviews = [...years].sort((first, second) => first.year - second.year);
  const availableYears = sortedOverviews.map((overview) => overview.year);
  const firstYear = availableYears[0];
  const lastYear = availableYears[availableYears.length - 1];
  const [analysisYear, setAnalysisYear] = useState<Year>(() => lastYear);
  const statusLabels = [
    "ผู้สมัคร",
    ...Array.from(new Set(roundStatuses.map((status) => status.label))).filter((label) => label !== "ผู้สมัคร"),
  ];
  const roundCodes = Array.from(new Set(rounds.map((round) => round.code))).sort();
  const defaultStatus = "ผู้สมัคร";
  const [selectedStatus, setSelectedStatus] = useState(() => defaultStatus);
  const [selectedRoundCode, setSelectedRoundCode] = useState(() => roundCodes[0]);
  const hasManyYears = availableYears.length > 4;

  const comparisonKpis = [
    { label: "ตัวเลือกทั้งหมด", key: "choices", format: formatNumber },
    { label: "ผู้สมัครไม่ซ้ำ", key: "applicants", format: formatNumber },
    { label: "ยืนยันสิทธิ์", key: "confirmed", format: formatNumber },
    { label: "อัตรายืนยันสิทธิ์", key: "rate", format: (value: number) => `${value.toFixed(2)}%` },
  ] as const;

  const selectedRound = rounds.find((round) => round.code === selectedRoundCode);
  const roundStatusValues = availableYears.map((year) => {
    const round = rounds.find((item) => item.year === year && item.code === selectedRoundCode);
    if (!round) return 0;
    if (selectedStatus === "ผู้สมัคร") return round.applicants;
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
  const maxMajorApplicants = Math.max(...majorRows.map((major) => major.applicants), 1);

  const statusGroups = [...groupRows(statuses, (status) => status.label).entries()]
    .sort(([, firstRows], [, secondRows]) => (
      secondRows.reduce((sum, row) => sum + row.choices, 0)
      - firstRows.reduce((sum, row) => sum + row.choices, 0)
    ))
    .slice(0, 6);
  const maxStatusShare = Math.max(...statuses.map((status) => status.share), 1);

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

  const yearDelta = (key: "choices" | "applicants" | "confirmed" | "rate") => {
    const first = sortedOverviews[0]?.[key] ?? 0;
    const last = sortedOverviews[sortedOverviews.length - 1]?.[key] ?? 0;
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
  const maxRoundVal = Math.max(...rounds.map((r) => Math.max(r.applicants, r.confirmed)), 1);

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
            const values = sortedOverviews.map((overview) => overview[kpi.key]);
            const firstValue = values[0] ?? 0;
            const latestValue = values[values.length - 1] ?? 0;
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
                  <span>ปีล่าสุด {lastYear}</span>
                  <strong>{kpi.format(latestValue)}</strong>
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
                    <span>{lastYear}<strong>{kpi.format(latestValue)}</strong></span>
                  </div>
                </div>
                <footer className={directionClass}>
                  <strong>{delta > 0 ? "+" : ""}{kpi.key === "rate" ? `${delta.toFixed(2)} จุด` : formatNumber(delta)}</strong>
                  <span>{percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}% จากปี {firstYear}</span>
                </footer>
              </article>
            );
          })}
        </section>

        <section className={`analytics-chart-grid ${hasManyYears ? "many-years" : ""}`} data-year-count={availableYears.length}>
          <article className="analytics-card year-comparison-card" style={{ gridColumn: "1 / -1" }}>
            <header>
              <div>
                <span>Round YoY Comparison</span>
                <h2>ภาพรวมผู้สมัครและยืนยันสิทธิ์แต่ละรอบทุกปี</h2>
              </div>
              <div className="analytics-legend" style={{ gap: "10px 18px", margin: 0 }}>
                <span><i style={{ background: "#e8d8c3", border: "1px solid #bd9d75" }} />2568 ผู้สมัคร</span>
                <span><i style={{ background: "#4a7bb0" }} />2568 ยืนยันสิทธิ์</span>
                <span><i style={{ background: "#f5c38b", border: "1px solid #c56100" }} />2569 ผู้สมัคร</span>
                <span><i style={{ background: "#2e7d32" }} />2569 ยืนยันสิทธิ์</span>
              </div>
            </header>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "18px",
                marginTop: "12px",
              }}
            >
              {roundGroups.map((group) => {
                const maxInGroup = Math.max(...group.rows.map((r) => Math.max(r.applicants, r.confirmed)), 1);
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

                    <div className="year-bars" style={{ height: "150px", justifyContent: "space-around", borderBottom: "1px solid #ddd7d0", paddingBottom: "4px" }}>
                      {availableYears.map((year) => {
                        const row = group.rows.find((r) => r.year === year);
                        const appVal = row?.applicants ?? 0;
                        const confVal = row?.confirmed ?? 0;
                        const confPct = appVal > 0 ? (confVal / appVal) * 100 : 0;
                        return (
                          <div key={year} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                            <i
                              title={`${year} ${group.code}: ผู้สมัคร ${formatNumber(appVal)} คน, ยืนยันสิทธิ์ ${formatNumber(confVal)} คน (${confPct.toFixed(1)}%)`}
                              style={{
                                height: `${(appVal / maxInGroup) * 82}%`,
                                background: year === 2568 ? "#e8d8c3" : "#f5c38b",
                                border: `1px solid ${year === 2568 ? "#bd9d75" : "#c56100"}`,
                                position: "relative",
                                overflow: "visible",
                                borderRadius: "4px 4px 0 0",
                                width: "42px",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: `${confPct}%`,
                                  background: year === 2568 ? "#4a7bb0" : "#2e7d32",
                                  borderRadius: confPct >= 98 ? "3px 3px 0 0" : "0",
                                  transition: "height 300ms ease",
                                }}
                              />
                              <b style={{ position: "absolute", top: "-22px", left: "50%", transform: "translateX(-50%)", fontSize: "11px", whiteSpace: "nowrap", color: "#333" }}>
                                {formatNumber(appVal)}
                              </b>
                              {confVal > 0 && (
                                <small
                                  style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    fontSize: "10px",
                                    color: "#fff",
                                    fontWeight: 750,
                                    whiteSpace: "nowrap",
                                    zIndex: 2,
                                    pointerEvents: "none",
                                  }}
                                >
                                  {formatNumber(confVal)}
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

          <article className="analytics-card major-ranking-card">
            <header>
              <div>
                <span>Major YoY Comparison</span>
                <h2>ผู้สมัครและยืนยันสิทธิ์แต่ละสาขาวิชา ทุกปี</h2>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div className="analytics-legend" style={{ gap: "10px 18px", margin: 0 }}>
                  <span><i style={{ background: "#e8d8c3", border: "1px solid #bd9d75" }} />2568 ผู้สมัคร</span>
                  <span><i style={{ background: "#4a7bb0" }} />2568 ยืนยันสิทธิ์</span>
                  <span><i style={{ background: "#f5c38b", border: "1px solid #c56100" }} />2569 ผู้สมัคร</span>
                  <span><i style={{ background: "#2e7d32" }} />2569 ยืนยันสิทธิ์</span>
                </div>
                <Link href="/majors">ดูรายละเอียดเจาะลึก</Link>
              </div>
            </header>
            <div className="major-comparison-chart">
              {majorGroups.slice(0, 7).map(([, rows], index) => (
                <section key={`${rows[0].code}-${rows[0].name}`}>
                  <div className="comparison-row-label"><b>{index + 1}</b><small>{rows[0].name}</small></div>
                  <div className="comparison-series" style={{ display: "grid", gap: "8px" }}>
                    {availableYears.map((year) => {
                      const row = rows.find((item) => item.year === year) as MajorRow | undefined;
                      const applicants = row?.applicants ?? 0;
                      const confirmed = row?.confirmed ?? 0;
                      const confPct = applicants > 0 ? (confirmed / applicants) * 100 : 0;
                      const outerWidthPct = (applicants / maxMajorApplicants) * 100;
                      return (
                        <div key={year} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 750, color: "#666", width: "36px" }}>{year}</span>
                          <i
                            title={`${year} ${rows[0].name}: ผู้สมัคร ${formatNumber(applicants)} คน, ยืนยันสิทธิ์ ${formatNumber(confirmed)} คน (${row?.rate.toFixed(2)}%)`}
                            style={{
                              flex: 1,
                              height: "22px",
                              background: "#f0ece7",
                              borderRadius: "5px",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: `${outerWidthPct}%`,
                                background: year === 2568 ? "#e8d8c3" : "#f5c38b",
                                border: `1px solid ${year === 2568 ? "#bd9d75" : "#c56100"}`,
                                borderRadius: "5px",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  bottom: 0,
                                  left: 0,
                                  width: `${confPct}%`,
                                  background: year === 2568 ? "#4a7bb0" : "#2e7d32",
                                  borderRadius: "4px 0 0 4px",
                                  transition: "width 300ms ease",
                                }}
                              />
                            </span>
                          </i>
                          <strong style={{ fontSize: "12px", width: "52px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#333" }}>
                            {formatNumber(applicants)}
                          </strong>
                          <span style={{ fontSize: "11px", color: year === 2568 ? "#2b5684" : "#1b5e20", fontWeight: 750, width: "96px", textAlign: "right", whiteSpace: "nowrap" }}>
                            ยืนยัน {formatNumber(confirmed)} <small style={{ fontWeight: 600, color: "#666" }}>({row ? `${row.rate.toFixed(2)}%` : "—"})</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
