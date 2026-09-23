"use client";

import { useMemo, useState } from "react";
import type { PageData } from "../data/page-data-types";
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

export function MajorsView({ snapshot }: { snapshot: PageData<"majors"> }) {
  const { majorRows, majorStatuses, years } = snapshot;

  const availableYears = useMemo(
    () => [...years].map((y) => y.year).sort((a, b) => a - b),
    [years]
  );

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, { key: string; code: string; name: string }>();
    majorRows.forEach((m) => {
      const key = m.majorKey;
      if (!map.has(key)) {
        map.set(key, { key, code: m.code, name: m.name });
      }
    });
    return Array.from(map.values());
  }, [majorRows]);

  const allStatusLabels = useMemo(
    () => [
      "ผู้สมัคร",
      ...Array.from(
        new Set([
          ...majorStatuses.map((s) => s.label),
        ])
      ).filter((label) => label !== "ผู้สมัคร"),
    ],
    [majorStatuses]
  );

  const [selectedMajorStatus, setSelectedMajorStatus] = useState(() => "ผู้สมัคร");
  const [selectedMajorKey, setSelectedMajorKey] = useState(() => uniqueMajors[0]?.key ?? "");

  const selectedMajorMeta = uniqueMajors.find((m) => m.key === selectedMajorKey);

  const majorStatusValues = availableYears.map((year) => {
    const row = majorRows.find((m) => m.year === year && m.majorKey === selectedMajorKey);
    if (!row) return 0;
    if (selectedMajorStatus === "ผู้สมัคร") return row.applicants;
    if (selectedMajorStatus === "ยืนยันสิทธิ์") return row.confirmed;
    return majorStatuses.find((status) => (
      status.year === year
      && status.majorKey === selectedMajorKey
      && status.name === selectedMajorMeta?.name
      && status.label === selectedMajorStatus
    ))?.applicants ?? 0;
  });

  const maxSelectedMajorChartValue = Math.max(...majorStatusValues, 1);

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
                    <select value={selectedMajorKey} onChange={(event) => setSelectedMajorKey(event.target.value)}>
                      {uniqueMajors.map((m) => (
                        <option key={m.key} value={m.key}>
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
          </section>
        </div>
      </section>
    </main>
  );
}
