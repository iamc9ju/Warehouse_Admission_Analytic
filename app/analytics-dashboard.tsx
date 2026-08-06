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
          <article className="analytics-card year-comparison-card">
            <header><div><span>Year Comparison</span><h2>ภาพรวมทุกปีที่มีข้อมูล</h2></div></header>
            <div className="year-comparison-chart">
              {[
                { label: "ผู้สมัคร", key: "applicants", max: Math.max(...years.map((year) => year.applicants), 1) },
                { label: "ยืนยันสิทธิ์", key: "confirmed", max: Math.max(...years.map((year) => year.confirmed), 1) },
                { label: "อัตรายืนยัน", key: "rate", max: Math.max(...years.map((year) => year.rate), 1), rate: true },
              ].map((metric) => (
                <div className="year-bar-group" key={metric.label}>
                  <div className="year-bars">
                    {sortedOverviews.map((overview) => {
                      const value = overview[metric.key as "applicants" | "confirmed" | "rate"];
                      return (
                        <i key={overview.year} style={{ height: `${(value / metric.max) * 90}%`, background: colorForYear(overview.year, availableYears) }}>
                          <b>{metric.rate ? `${value.toFixed(2)}%` : formatNumber(value)}</b>
                        </i>
                      );
                    })}
                  </div>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
            <div className="analytics-legend">
              {availableYears.map((year) => <span key={year}><i style={{ background: colorForYear(year, availableYears) }} />{year}</span>)}
            </div>
          </article>

          <article className="analytics-card round-performance-card">
            <header>
              <div><span>Status & Round Comparison</span><h2>สถานะและรอบ TCAS เปรียบเทียบตามปี</h2></div>
              <div className="round-chart-filters">
                <label className="round-chart-select">
                  <span>TCAS Status</span>
                  <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                    {statusLabels.map((label) => <option key={label} value={label}>{label}</option>)}
                  </select>
                </label>
                <label className="round-chart-select">
                  <span>TCAS Round</span>
                  <select value={selectedRoundCode} onChange={(event) => setSelectedRoundCode(event.target.value)}>
                    {roundCodes.map((code) => {
                      const round = rounds.find((item) => item.code === code);
                      return <option key={code} value={code}>{code} — {round?.name}</option>;
                    })}
                  </select>
                </label>
              </div>
            </header>
            <div className="vertical-round-chart" aria-label={`${selectedStatus} และ ${selectedRoundCode} เปรียบเทียบตามปี`}>
              <div className="vertical-chart-heading">
                <strong>{selectedRoundCode} · {selectedRound?.name} — {selectedStatus}</strong>
                <span>{selectedStatus}ของรอบที่เลือก เปรียบเทียบตามปีการศึกษา</span>
              </div>
              <div className="vertical-series-legend" aria-label="คำอธิบายชุดข้อมูล">
                <span><i className="round-series" />{selectedRoundCode}: {selectedStatus}</span>
              </div>
              <div className="vertical-chart-plot">
                <div className="vertical-grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
                {availableYears.map((year, index) => {
                  const value = roundStatusValues[index];
                  const barHeight = Math.max((value / maxRoundChartValue) * 82, value > 0 ? 4 : 0);
                  return (
                    <div className="vertical-bar-column" key={year}>
                      <div className="vertical-bar-track single-series">
                        <strong style={{ bottom: `calc(${barHeight}% + 7px)` }}>{formatNumber(value)}</strong>
                        <i style={{ height: `${barHeight}%`, background: "#477ca8" }} />
                      </div>
                      <span>{year}</span>
                    </div>
                  );
                })}
              </div>
              <div className="vertical-chart-footer"><span>ปีการศึกษา</span><small>หน่วย: คน/รายการตามระดับข้อมูลในคลัง</small></div>
            </div>
          </article>

          <article className="analytics-card radar-card">
            <header>
              <div><span>6-axis Radar Profile</span><h2>โปรไฟล์ภาพรวม 6 ด้าน</h2></div>
              <div className="analytics-year-control" aria-label="เลือกปีสำหรับ Radar">
                <span>ปี</span>
                {availableYears.map((year) => (
                  <button className={analysisYear === year ? "active" : ""} key={year} onClick={() => setAnalysisYear(year)} type="button">{year}</button>
                ))}
              </div>
            </header>
            <div className="radar-layout">
              <svg className="radar-chart" role="img" aria-label={`กราฟเรดาร์ 6 ด้าน ปี ${analysisYear}`} viewBox="0 0 360 360">
                {[0.25, 0.5, 0.75, 1].map((level) => (
                  <polygon
                    className="radar-grid"
                    key={level}
                    points={radarMetrics.map((_, index) => {
                      const point = polarPoint(index, radarMetrics.length, 112 * level);
                      return `${point.x},${point.y}`;
                    }).join(" ")}
                  />
                ))}
                {radarMetrics.map((metric, index) => {
                  const axis = polarPoint(index, radarMetrics.length, 112);
                  const label = polarPoint(index, radarMetrics.length, 145);
                  return (
                    <g key={metric.label}>
                      <line className="radar-axis" x1="180" y1="180" x2={axis.x} y2={axis.y} />
                      <text className="radar-label" x={label.x} y={label.y}>{metric.label}</text>
                    </g>
                  );
                })}
                <polygon className="radar-area" points={radarPolygon(radarValues)} />
                {radarValues.map((value, index) => {
                  const point = polarPoint(index, radarValues.length, 112 * Math.max(value, 0.08));
                  return <circle className="radar-point" cx={point.x} cy={point.y} key={radarMetrics[index].label} r="5" />;
                })}
              </svg>
              <div className="radar-metrics" aria-label={`ค่าตัวชี้วัดปี ${analysisYear}`}>
                {radarMetrics.map((metric) => (
                  <div key={metric.label}><span>{metric.label}</span><strong>{metric.display}</strong></div>
                ))}
              </div>
            </div>
            <p className="chart-method-note">แต่ละแกนเทียบกับค่าสูงสุดของทุกปีที่มีในคลังข้อมูล</p>
          </article>

          <article className="analytics-card status-donut-card status-comparison-card">
            <header><div><span>Status Distribution</span><h2>สัดส่วนสถานะ เปรียบเทียบทุกปี</h2></div></header>
            <div className="status-comparison-chart">
              {statusGroups.map(([label, rows]) => (
                <section key={label}>
                  <strong>{label}</strong>
                  {availableYears.map((year) => {
                    const row = rows.find((item) => item.year === year);
                    const share = row?.share ?? 0;
                    return (
                      <div key={year}>
                        <span>{year}</span>
                        <i><b style={{ width: `${(share / maxStatusShare) * 100}%`, background: colorForYear(year, availableYears) }} /></i>
                        <small>{share.toFixed(2)}%</small>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </article>

          <article className="analytics-card major-ranking-card">
            <header><div><span>Major Ranking</span><h2>สาขาที่มี Demand สูงสุด เปรียบเทียบทุกปี</h2></div><Link href="/majors">ดูรายละเอียด</Link></header>
            <div className="major-comparison-chart">
              {majorGroups.slice(0, 7).map(([, rows], index) => (
                <section key={`${rows[0].code}-${rows[0].name}`}>
                  <div className="comparison-row-label"><b>{index + 1}</b><small>{rows[0].name}</small></div>
                  <div className="comparison-series">
                    {availableYears.map((year) => {
                      const row = rows.find((item) => item.year === year) as MajorRow | undefined;
                      const applicants = row?.applicants ?? 0;
                      return (
                        <div key={year}>
                          <span>{year}</span>
                          <i><b style={{ width: `${(applicants / maxMajorApplicants) * 100}%`, background: colorForYear(year, availableYears) }} /></i>
                          <strong>{formatNumber(applicants)}</strong>
                          <small>{row ? `${row.rate.toFixed(2)}%` : "—"}</small>
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
