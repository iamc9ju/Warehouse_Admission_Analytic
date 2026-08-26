"use client";

import { useMemo, useState } from "react";
import type { DashboardSnapshot, Year } from "./data/dashboard-types";
import { SidebarNavigation } from "./sidebar-navigation";
import { DonutChartCard, getMajorColor, tcasColors } from "./donut-chart-card";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
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

  const resignedCount = useMemo(() => {
    return statuses
      .filter((s) => s.year === selectedYear && (s.label === "สละสิทธิ์" || s.label === "สละสิทธิ์ในรอบ 2"))
      .reduce((sum, s) => sum + s.choices, 0);
  }, [statuses, selectedYear]);

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
      name: `ผู้สละสิทธิ์ (${selectedYear})`,
      value: formatNumber(resignedCount),
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

  const tcasRoundSlices = useMemo(() => {
    const map = new Map<string, { code: string; name: string; applicants: number }>();
    rounds
      .filter((r) => r.year === selectedYear)
      .forEach((r) => {
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
  }, [rounds, selectedYear]);

  const majorSlices = useMemo(() => {
    const map = new Map<string, { code: string; name: string; applicants: number }>();
    majorRows
      .filter((m) => m.year === selectedYear)
      .forEach((m) => {
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
  }, [majorRows, selectedYear]);

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
            <section
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "22px",
              }}
            >
              <DonutChartCard
                title={`สัดส่วนผู้สมัครปี ${selectedYear} (TCAS 4 รอบ)`}
                subtitle={`จำนวนผู้สมัครปีการศึกษา ${selectedYear} แยกตามรอบ TCAS 1 - 4`}
                slices={tcasRoundSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={`ผู้สมัครปี ${selectedYear}`}
                centerSubtext={`100% (ปี ${selectedYear})`}
              />
              <DonutChartCard
                title={`สัดส่วนผู้สมัครปี ${selectedYear} (ทุกสาขาวิชา)`}
                subtitle={`จำนวนผู้สมัครปีการศึกษา ${selectedYear} แยกตามสาขาวิชา`}
                slices={majorSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={`ผู้สมัครปี ${selectedYear}`}
                centerSubtext={`100% (ปี ${selectedYear})`}
              />
            </section>

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
