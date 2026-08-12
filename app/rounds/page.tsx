"use client";

import { useMemo, useState } from "react";
import snapshotData from "../data/generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot } from "../data/dashboard-types";
import { SidebarNavigation } from "../sidebar-navigation";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function RoundsPage() {
  const snapshot = snapshotData as unknown as DashboardSnapshot;
  const { rounds, roundStatuses, years } = snapshot;

  const availableYears = useMemo(
    () => [...years].map((y) => y.year).sort((a, b) => a - b),
    [years]
  );

  const statusLabels = useMemo(
    () => [
      "ผู้สมัคร",
      ...Array.from(new Set(roundStatuses.map((status) => status.label))).filter((label) => label !== "ผู้สมัคร"),
    ],
    [roundStatuses]
  );

  const roundCodes = useMemo(
    () => Array.from(new Set(rounds.map((round) => round.code))).sort(),
    [rounds]
  );

  const [selectedStatus, setSelectedStatus] = useState(() => "ผู้สมัคร");
  const [selectedRoundCode, setSelectedRoundCode] = useState(() => roundCodes[0] ?? "TCAS1");

  const selectedRoundMeta = rounds.find((r) => r.code === selectedRoundCode);

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

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/rounds" />

      <section className="workspace" data-page="Rounds">
        <div className="page-transition" key="Rounds">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Round Performance</p>
              <h1>TCAS Round Analytics</h1>
              <p>แยกข้อมูลรายรอบ TCAS1 Portfolio, TCAS2 Quota, TCAS3 Admission และ TCAS4 Direct Admission</p>
            </div>
          </section>

          <section className="dashboard-grid focused-grid">
            <article className="panel analytics-card round-performance-card" style={{ gridColumn: "1 / -1" }}>
              <header>
                <div>
                  <span>ROUND YOY COMPARISON</span>
                  <h2>ผู้สมัครและยืนยันสิทธิ์แต่ละรอบ TCAS ทุกปี</h2>
                </div>
                <div className="round-chart-filters" style={{ display: "flex", gap: "1rem" }}>
                  <label className="round-chart-select">
                    <span>TCAS STATUS</span>
                    <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                      {statusLabels.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="round-chart-select">
                    <span>TCAS ROUND</span>
                    <select value={selectedRoundCode} onChange={(event) => setSelectedRoundCode(event.target.value)}>
                      {roundCodes.map((code) => {
                        const round = rounds.find((item) => item.code === code);
                        return (
                          <option key={code} value={code}>
                            {code} — {round?.name}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>
              </header>

              <div className="vertical-round-chart" aria-label={`${selectedStatus} และ ${selectedRoundCode} เปรียบเทียบตามปี`}>
                <div className="vertical-chart-heading">
                  <strong>{selectedRoundCode} · {selectedRoundMeta?.name} — {selectedStatus}</strong>
                  <span>{selectedStatus}ของรอบที่เลือก เปรียบเทียบตามปีการศึกษา</span>
                </div>
                <div className="vertical-series-legend" aria-label="คำอธิบายชุดข้อมูล">
                  <span>
                    <i className="round-series" />
                    {selectedRoundCode}: {selectedStatus}
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
                <div className="vertical-chart-footer">
                  <span>ปีการศึกษา</span>
                  <small>หน่วย: คน/รายการตามระดับข้อมูลในคลัง</small>
                </div>
              </div>
            </article>

            <article id="rounds" className="panel rounds-panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-title">
                <h2>ภาพรวม TCAS รอบ 1-4 ทุกปี</h2>
                <span className="mini-pill">{rounds.length} round rows</span>
              </div>
              <div className="round-table-wrap">
                <table className="round-table">
                  <thead>
                    <tr>
                      <th>TCAS</th>
                      <th>Choices</th>
                      <th>Unique Applicants</th>
                      <th>Confirmed</th>
                      <th>Rate</th>
                      <th>Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((round) => (
                      <tr key={`${round.year}-${round.code}`}>
                        <td>
                          <span className={`round-year y${round.year}`}>{round.year}</span>
                          <strong>{round.code}</strong>
                          <small>{round.name}</small>
                        </td>
                        <td>{formatNumber(round.choices)}</td>
                        <td>{formatNumber(round.applicants)}</td>
                        <td>{formatNumber(round.confirmed)}</td>
                        <td>
                          <span className="rate-chip">{round.rate.toFixed(2)}%</span>
                        </td>
                        <td>{round.files}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
