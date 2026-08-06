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
  const { majorRows, rounds, statuses, warehouseHealth, years } = snapshot;
  const sortedOverviews = [...years].sort((first, second) => first.year - second.year);
  const availableYears = sortedOverviews.map((overview) => overview.year);
  const firstYear = availableYears[0];
  const lastYear = availableYears[availableYears.length - 1];
  const [analysisYear, setAnalysisYear] = useState<Year>(() => lastYear);
  const statusLabels = Array.from(new Set(statuses.map((status) => status.label)));
  const roundCodes = Array.from(new Set(rounds.map((round) => round.code))).sort();
  const defaultStatus = statusLabels.includes("ผู้สมัคร") ? "ผู้สมัคร" : statusLabels[0];
  const [roundChartSelection, setRoundChartSelection] = useState(() => `status:${defaultStatus}`);
  const hasManyYears = availableYears.length > 4;

  const comparisonKpis = [
    { label: "ตัวเลือกทั้งหมด", key: "choices", format: formatNumber },
    { label: "ผู้สมัครไม่ซ้ำ", key: "applicants", format: formatNumber },
    { label: "ยืนยันสิทธิ์", key: "confirmed", format: formatNumber },
    { label: "อัตรายืนยันสิทธิ์", key: "rate", format: (value: number) => `${value.toFixed(2)}%` },
  ] as const;

  const [roundChartType, roundChartKey] = roundChartSelection.split(":", 2);
  const selectedRound = rounds.find((round) => round.code === roundChartKey);
  const roundChartValues = availableYears.map((year) => {
    if (roundChartType === "status") {
      return statuses.find((status) => status.year === year && status.label === roundChartKey)?.choices ?? 0;
    }
    return rounds.find((round) => round.year === year && round.code === roundChartKey)?.applicants ?? 0;
  });
  const maxRoundChartValue = Math.max(...roundChartValues, 1);
  const roundChartTitle = roundChartType === "status" ? roundChartKey : `${roundChartKey} · ${selectedRound?.name ?? ""}`;
  const roundChartDescription = roundChartType === "status"
    ? "จำนวนตัวเลือกที่มีสถานะนี้"
    : "จำนวนผู้สมัครไม่ซ้ำในรอบนี้";

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

  const selectedMajors = majorRows.filter((major) => major.year === analysisYear);
  const demandThreshold = selectedMajors.reduce((sum, major) => sum + major.applicants, 0) / Math.max(selectedMajors.length, 1);
  const conversionThreshold = selectedMajors.reduce((sum, major) => sum + major.rate, 0) / Math.max(selectedMajors.length, 1);
  const quadrants = [
    {
      key: "grow",
      label: "เร่งต่อยอด",
      description: "Demand ต่ำ · Conversion สูง",
      rows: selectedMajors.filter((major) => major.applicants < demandThreshold && major.rate >= conversionThreshold),
    },
    {
      key: "star",
      label: "ดาวเด่น",
      description: "Demand สูง · Conversion สูง",
      rows: selectedMajors.filter((major) => major.applicants >= demandThreshold && major.rate >= conversionThreshold),
    },
    {
      key: "watch",
      label: "เฝ้าระวัง",
      description: "Demand ต่ำ · Conversion ต่ำ",
      rows: selectedMajors.filter((major) => major.applicants < demandThreshold && major.rate < conversionThreshold),
    },
    {
      key: "convert",
      label: "โอกาสเพิ่ม Conversion",
      description: "Demand สูง · Conversion ต่ำ",
      rows: selectedMajors.filter((major) => major.applicants >= demandThreshold && major.rate < conversionThreshold),
    },
  ];

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
            return (
              <article key={kpi.label}>
                <span>{kpi.label}</span>
                <div className="kpi-year-values">
                  {sortedOverviews.map((overview) => (
                    <div key={overview.year}>
                      <span><i style={{ background: colorForYear(overview.year, availableYears) }} />{overview.year}</span>
                      <strong>{kpi.format(overview[kpi.key])}</strong>
                    </div>
                  ))}
                </div>
                <small className={delta >= 0 ? "up" : "down"}>
                  {delta > 0 ? "+" : ""}{kpi.key === "rate" ? `${delta.toFixed(2)} จุด` : formatNumber(delta)} จาก {firstYear} ถึง {lastYear}
                </small>
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
              <label className="round-chart-select">
                <span>เลือกข้อมูล</span>
                <select value={roundChartSelection} onChange={(event) => setRoundChartSelection(event.target.value)}>
                  <optgroup label="TCAS Status">
                    {statusLabels.map((label) => <option key={label} value={`status:${label}`}>{label}</option>)}
                  </optgroup>
                  <optgroup label="รอบ TCAS">
                    {roundCodes.map((code) => {
                      const round = rounds.find((item) => item.code === code);
                      return <option key={code} value={`round:${code}`}>{code} — {round?.name}</option>;
                    })}
                  </optgroup>
                </select>
              </label>
            </header>
            <div className="vertical-round-chart" aria-label={`${roundChartTitle} เปรียบเทียบตามปี`}>
              <div className="vertical-chart-heading">
                <strong>{roundChartTitle}</strong>
                <span>{roundChartDescription}</span>
              </div>
              <div className="vertical-chart-plot">
                <div className="vertical-grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
                {availableYears.map((year, index) => {
                  const value = roundChartValues[index];
                  const barHeight = Math.max((value / maxRoundChartValue) * 88, value > 0 ? 4 : 0);
                  return (
                    <div className="vertical-bar-column" key={year}>
                      <div className="vertical-bar-track">
                        <strong style={{ bottom: `calc(${barHeight}% + 7px)` }}>{formatNumber(value)}</strong>
                        <i style={{ height: `${barHeight}%`, background: colorForYear(year, availableYears) }} />
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
              <div className="analytics-year-control" aria-label="เลือกปีสำหรับ Radar และ Block Quadrant">
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

          <article className="analytics-card opportunity-card quadrant-card">
            <header>
              <div><span>Block Quadrant · Opportunity Matrix</span><h2>จัดกลุ่มสาขาตาม Demand และ Conversion</h2></div>
              <strong className="selected-year-pill">ปี {analysisYear}</strong>
            </header>
            <div className="quadrant-axis-label top">Conversion สูง</div>
            <div className="block-quadrant" aria-label={`Block Quadrant แบ่งสาขาปี ${analysisYear} เป็น 4 กลุ่ม`}>
              {quadrants.map((quadrant) => (
                <section className={`quadrant-block ${quadrant.key}`} key={quadrant.key}>
                  <header><div><strong>{quadrant.label}</strong><span>{quadrant.description}</span></div><b>{quadrant.rows.length}</b></header>
                  <div className="quadrant-programs">
                    {quadrant.rows.length ? quadrant.rows.map((major) => (
                      <div key={`${major.code}-${major.name}`} title={major.name}>
                        <span>{major.name}</span>
                        <small>{formatNumber(major.applicants)} คน · {major.rate.toFixed(2)}%</small>
                      </div>
                    )) : <p>ยังไม่มีสาขาในกลุ่มนี้</p>}
                  </div>
                </section>
              ))}
            </div>
            <div className="quadrant-axis-label bottom">Demand ต่ำ <span>เส้นแบ่ง: {formatNumber(Math.round(demandThreshold))} คน · {conversionThreshold.toFixed(2)}%</span> Demand สูง</div>
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
