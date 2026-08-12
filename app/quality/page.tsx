"use client";

import { useMemo, useState } from "react";
import snapshotData from "../data/generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot, Year } from "../data/dashboard-types";
import { SidebarNavigation } from "../sidebar-navigation";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function QualityPage() {
  const snapshot = snapshotData as unknown as DashboardSnapshot;
  const { qualityMetricDefinitions, statuses, warehouseHealth, years } = snapshot;

  const selectableYears = useMemo(
    () => [...years].sort((first, second) => second.year - first.year),
    [years]
  );
  const [selectedYear, setSelectedYear] = useState<Year>(() => selectableYears[0]?.year ?? 0);

  const visibleStatuses = statuses.filter((status) => status.year === selectedYear);
  const qualityCards = qualityMetricDefinitions.map(({ label, value }) => [label, value] as const);

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/quality" />

      <section className="workspace" data-page="Quality">
        <div className="page-transition" key="Quality">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Data Quality</p>
              <h1>Data Quality and Status Distribution</h1>
              <p>ตรวจคุณภาพข้อมูลพร้อมนิยาม metric, source object, validation rule, missing values, PII boundary และการกระจายสถานะ TCAS จาก processed admissions data</p>
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
            <article id="quality" className="panel status-panel">
              <div className="panel-title">
                <h2>การกระจายสถานะ TCAS ปี {selectedYear} ทุก round</h2>
              </div>
              <div className="status-list">
                {visibleStatuses.map((status) => (
                  <div className="status-item" key={`${selectedYear}-${status.label}`}>
                    <span className={`status-badge ${status.tone}`}>{status.label.slice(0, 1)}</span>
                    <div>
                      <strong>{status.label}</strong>
                      <small>{formatNumber(status.choices)} choices</small>
                    </div>
                    <div className="bar-track">
                      <span style={{ width: `${status.share}%` }} />
                    </div>
                    <b>{status.share.toFixed(2)}%</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel quality-panel">
              <div className="panel-title">
                <h2>คุณภาพข้อมูล (Data Quality)</h2>
              </div>
              <dl className="quality-grid">
                {qualityCards.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="health-inline" aria-label="Warehouse health and freshness">
                <strong>Warehouse health: {warehouseHealth.status}</strong>
                <span>last refresh {warehouseHealth.lastRefreshAt}</span>
                <span>{warehouseHealth.qualityChecksFailed} failed checks</span>
                <span>{warehouseHealth.freshnessSlaHours}h freshness SLA</span>
              </div>

              <div className="quality-definitions" aria-label="Data quality metric definitions">
                {qualityMetricDefinitions.map((metric) => (
                  <section key={metric.label}>
                    <div>
                      <strong>{metric.label}</strong>
                      <small>{metric.sourceObject}</small>
                    </div>
                    <p>{metric.rule}</p>
                    <span>{metric.value}</span>
                  </section>
                ))}
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
