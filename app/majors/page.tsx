"use client";

import { useMemo, useState } from "react";
import snapshotData from "../data/generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot, Year } from "../data/dashboard-types";
import { SidebarNavigation } from "../sidebar-navigation";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSigned(value?: number) {
  if (value === undefined || value === 0) {
    return value === 0 ? "0" : "baseline";
  }
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function deltaClass(value?: number) {
  if (!value) return "neutral";
  return value > 0 ? "positive" : "negative";
}

export default function MajorsPage() {
  const snapshot = snapshotData as unknown as DashboardSnapshot;
  const { majorRows, roundStatuses, statuses, years } = snapshot;

  const selectableYears = useMemo(
    () => [...years].sort((first, second) => second.year - first.year),
    [years]
  );
  const [selectedYear, setSelectedYear] = useState<Year>(() => selectableYears[0]?.year ?? 0);
  const [majorQuery, setMajorQuery] = useState("");

  const availableYears = useMemo(
    () => [...years].map((y) => y.year).sort((a, b) => a - b),
    [years]
  );

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    majorRows.forEach((m) => {
      if (!map.has(m.code)) {
        map.set(m.code, { code: m.code, name: m.name });
      }
    });
    return Array.from(map.values());
  }, [majorRows]);

  const allStatusLabels = useMemo(
    () => [
      "ผู้สมัคร",
      ...Array.from(
        new Set([
          ...statuses.map((s) => s.label),
          ...roundStatuses.map((s) => s.label),
        ])
      ).filter((label) => label !== "ผู้สมัคร"),
    ],
    [statuses, roundStatuses]
  );

  const [selectedMajorStatus, setSelectedMajorStatus] = useState(() => "ผู้สมัคร");
  const [selectedMajorCode, setSelectedMajorCode] = useState(() => uniqueMajors[0]?.code ?? "");

  const selectedMajorMeta = uniqueMajors.find((m) => m.code === selectedMajorCode);

  const majorStatusValues = availableYears.map((year) => {
    const row = majorRows.find((m) => m.year === year && m.code === selectedMajorCode);
    if (!row) return 0;
    if (selectedMajorStatus === "ผู้สมัคร") return row.applicants;
    if (selectedMajorStatus === "ยืนยันสิทธิ์") return row.confirmed;
    const statusRow = statuses.find((s) => s.year === year && s.label === selectedMajorStatus);
    const totalApplicantsInYear = years.find((y) => y.year === year)?.applicants || 1;
    const totalStatusInYear = statusRow?.choices || 0;
    return Math.round((row.applicants / totalApplicantsInYear) * totalStatusInYear);
  });

  const maxSelectedMajorChartValue = Math.max(...majorStatusValues, 1);

  const filteredMajors = useMemo(() => {
    const normalizedQuery = majorQuery.trim().toLowerCase();
    return majorRows
      .filter((major) => major.year === selectedYear)
      .filter((major) => {
        if (!normalizedQuery) return true;
        return `${major.code} ${major.name} ${major.type}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => b.applicants - a.applicants);
  }, [majorQuery, majorRows, selectedYear]);

  const maxApplicants = Math.max(...filteredMajors.map((major) => major.applicants), 1);

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/majors" />

      <section className="workspace" data-page="Majors">
        <div className="page-transition" key="Majors">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Major Ranking</p>
              <h1>Major Demand and Conversion</h1>
              <p>ดู demand, confirmed applicants, conversion rate และ year-over-year movement ของแต่ละสาขา</p>
            </div>
            <div className="hero-controls">
              <label className="year-select">
                <span>ปีการศึกษา</span>
                <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) as Year)}>
                  {selectableYears.map((year) => (
                    <option value={year.year} key={year.year}>
                      {year.year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="dashboard-grid focused-grid">
            <article className="panel analytics-card round-performance-card" style={{ gridColumn: "1 / -1" }}>
              <header>
                <div>
                  <span>MAJOR YOY COMPARISON</span>
                  <h2>ผู้สมัครและยืนยันสิทธิ์แต่ละสาขาวิชา ทุกปี</h2>
                </div>
                <div className="round-chart-filters" style={{ display: "flex", gap: "1rem" }}>
                  <label className="round-chart-select">
                    <span>STATUS</span>
                    <select value={selectedMajorStatus} onChange={(event) => setSelectedMajorStatus(event.target.value)}>
                      {allStatusLabels.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="round-chart-select">
                    <span>สาขาวิชา</span>
                    <select value={selectedMajorCode} onChange={(event) => setSelectedMajorCode(event.target.value)}>
                      {uniqueMajors.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </header>
              <div className="vertical-round-chart" aria-label={`${selectedMajorStatus} และ ${selectedMajorMeta?.name} เปรียบเทียบตามปี`}>
                <div className="vertical-chart-heading">
                  <strong>{selectedMajorMeta?.name} — {selectedMajorStatus}</strong>
                  <span>{selectedMajorStatus}ของสาขาที่เลือก เปรียบเทียบตามปีการศึกษา</span>
                </div>
                <div className="vertical-series-legend" aria-label="คำอธิบายชุดข้อมูล">
                  <span>
                    <i className="status-series" style={{ background: "#c56100" }} />
                    {selectedMajorMeta?.name}: {selectedMajorStatus}
                  </span>
                </div>
                <div className="vertical-chart-plot">
                  <div className="vertical-grid-lines" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  {availableYears.map((year, index) => {
                    const value = majorStatusValues[index];
                    const barHeight = Math.max((value / maxSelectedMajorChartValue) * 82, value > 0 ? 4 : 0);
                    return (
                      <div className="vertical-bar-column" key={year}>
                        <div className="vertical-bar-track single-series">
                          <strong style={{ bottom: `calc(${barHeight}% + 7px)` }}>{formatNumber(value)}</strong>
                          <i style={{ height: `${barHeight}%`, background: "#c56100" }} />
                        </div>
                        <span>{year}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="vertical-chart-footer">
                  <span>ปีการศึกษา</span>
                  <small>หน่วย: คน ตามระดับข้อมูลในคลัง</small>
                </div>
              </div>
            </article>

            <article id="majors" className="panel majors-panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-title">
                <h2>ทุกสาขาวิชา ปี {selectedYear}</h2>
                <input
                  aria-label="ค้นหาสาขา"
                  placeholder="ค้นหาสาขา"
                  value={majorQuery}
                  onChange={(event) => setMajorQuery(event.target.value)}
                />
              </div>
              <div className="major-table" role="table" aria-label="Major ranking">
                <div className="major-head" role="row">
                  <span>ลำดับ</span>
                  <span>สาขา</span>
                  <span>ผู้สมัคร</span>
                  <span>ยืนยันสิทธิ์</span>
                  <span>อัตรา</span>
                  <span>Δ เทียบปีก่อน</span>
                </div>
                {filteredMajors.map((major, index) => (
                  <div className="major-row" role="row" key={`${major.year}-${major.code}-${major.name}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{major.name}</strong>
                    <span className="value-with-bar">
                      {formatNumber(major.applicants)}
                      <i style={{ width: `${(major.applicants / maxApplicants) * 100}%` }} />
                    </span>
                    <span>{formatNumber(major.confirmed)}</span>
                    <span>{major.rate.toFixed(2)}%</span>
                    <span className={`change-chip ${deltaClass(major.applicantChange)}`}>
                      {formatSigned(major.applicantChange)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
