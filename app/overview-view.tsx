"use client";

import { useMemo, useState } from "react";
import type { DashboardSnapshot, Year } from "./data/dashboard-types";
import { SidebarNavigation } from "./sidebar-navigation";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

type RadarMetric = {
  label: string;
  value: number;
  display: string;
  max: number;
};

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

export function OverviewView({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { majorRows, rounds, statuses, years } = snapshot;

  const selectableYears = useMemo(
    () => [...years].sort((first, second) => second.year - first.year),
    [years]
  );
  const [selectedYear, setSelectedYear] = useState<Year>(() => selectableYears[0]?.year ?? 0);
  const [majorQuery, setMajorQuery] = useState("");

  const current = years.find((year) => year.year === selectedYear) ?? selectableYears[0];

  const statCards = [
    {
      name: `ผู้สมัครไม่ซ้ำ (${selectedYear})`,
      value: formatNumber(current.applicants),
      change: `เฉพาะปี ${selectedYear}`,
      changeType: "neutral",
    },
    {
      name: `ผู้ยืนยันสิทธิ์ (${selectedYear})`,
      value: formatNumber(current.confirmed),
      change: `เฉพาะปี ${selectedYear}`,
      changeType: "neutral",
    },
    {
      name: `อัตราการยืนยัน (${selectedYear})`,
      value: `${current.rate.toFixed(2)}%`,
      change: `เฉพาะปี ${selectedYear}`,
      changeType: "neutral",
    },
    {
      name: `จำนวนตัวเลือก (${selectedYear})`,
      value: formatNumber(current.choices),
      change: `เฉพาะปี ${selectedYear}`,
      changeType: "neutral",
    },
  ];

  const radarMetrics: RadarMetric[] = current
    ? [
        {
          label: "ตัวเลือก",
          value: current.choices,
          display: formatNumber(current.choices),
          max: Math.max(...years.map((year) => year.choices), 1),
        },
        {
          label: "ผู้สมัคร",
          value: current.applicants,
          display: formatNumber(current.applicants),
          max: Math.max(...years.map((year) => year.applicants), 1),
        },
        {
          label: "ยืนยันสิทธิ์",
          value: current.confirmed,
          display: formatNumber(current.confirmed),
          max: Math.max(...years.map((year) => year.confirmed), 1),
        },
        {
          label: "Conversion",
          value: current.rate,
          display: `${current.rate.toFixed(2)}%`,
          max: Math.max(...years.map((year) => year.rate), 1),
        },
        {
          label: "คะแนนเฉลี่ย",
          value: current.avgScore,
          display: current.avgScore.toFixed(2),
          max: Math.max(...years.map((year) => year.avgScore), 1),
        },
      ]
    : [];
  const radarValues = radarMetrics.map((metric) => metric.value / metric.max);

  const visibleStatuses = statuses.filter((status) => status.year === selectedYear);

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
  const visibleRounds = rounds.filter((round) => round.year === selectedYear);

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/" />

      <section className="workspace" data-page="Overview">
        <div className="page-transition" key="Overview">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Engineering Admissions Analytics</p>
              <h1>TCAS Admissions Data Warehouse</h1>
              <p>ดูภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน: TCAS รอบ 1-3 ปี 2567 และรอบ 1-4 ปี 2568-2569 โดย trace กลับไปยัง single fact และ governed lineage ได้</p>
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

          <section className="kpi-strip" aria-label="Key metrics">
            {statCards.map((stat, index) => (
              <article
                className={`metric-card ${index === 0 ? "first" : ""} ${index === statCards.length - 1 ? "last" : ""}`}
                key={stat.name}
              >
                <div className="metric-label">{stat.name}</div>
                <div className={`metric-change ${stat.changeType}`}>{stat.change}</div>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel analytics-card radar-card" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-title">
                <div>
                  <p className="technical-kicker">5-axis Profile</p>
                  <h2>โปรไฟล์ภาพรวม 5 ด้าน ปี {selectedYear}</h2>
                </div>
                <span className="mini-pill">ปี {selectedYear}</span>
              </div>
              <div className="radar-layout">
                <svg className="radar-chart" role="img" aria-label={`กราฟเรดาร์ 5 ด้าน ปี ${selectedYear}`} viewBox="0 0 360 360">
                  {[0.25, 0.5, 0.75, 1].map((level) => (
                    <polygon
                      className="radar-grid"
                      key={level}
                      points={radarMetrics
                        .map((_, index) => {
                          const point = polarPoint(index, radarMetrics.length, 112 * level);
                          return `${point.x},${point.y}`;
                        })
                        .join(" ")}
                    />
                  ))}
                  {radarMetrics.map((metric, index) => {
                    const axis = polarPoint(index, radarMetrics.length, 112);
                    const label = polarPoint(index, radarMetrics.length, 145);
                    return (
                      <g key={metric.label}>
                        <line className="radar-axis" x1="180" y1="180" x2={axis.x} y2={axis.y} />
                        <text className="radar-label" x={label.x} y={label.y}>
                          {metric.label}
                        </text>
                      </g>
                    );
                  })}
                  <polygon className="radar-area" points={radarPolygon(radarValues)} />
                  {radarValues.map((value, index) => {
                    const point = polarPoint(index, radarValues.length, 112 * Math.max(value, 0.08));
                    return <circle className="radar-point" cx={point.x} cy={point.y} key={radarMetrics[index].label} r="5" />;
                  })}
                </svg>
                <div className="radar-metrics" aria-label={`ค่าตัวชี้วัดปี ${selectedYear}`}>
                  {radarMetrics.map((metric) => (
                    <div key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.display}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

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

            <article id="majors" className="panel majors-panel">
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
                  <span>ประเภท</span>
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
                    <span>{major.type}</span>
                  </div>
                ))}
              </div>
            </article>

            <article id="rounds" className="panel rounds-panel">
              <div className="panel-title">
                <h2>ภาพรวม TCAS รอบ 1-4 ปี {selectedYear}</h2>
                <span className="mini-pill">{visibleRounds.length} round rows</span>
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
                    {visibleRounds.map((round) => (
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
