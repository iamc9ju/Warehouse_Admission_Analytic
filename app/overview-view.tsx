"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OverviewPageData } from "./data/page-data-types";
import { SidebarNavigation } from "./sidebar-navigation";
import { DonutChartCard, getMajorColor, tcasColors } from "./donut-chart-card";


function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function OverviewView({ snapshot }: { snapshot: OverviewPageData }) {
  const { majorRows, rounds, years } = snapshot;
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectableYears = useMemo(
    () => snapshot.availableYears.map((year) => ({ year })).sort((first, second) => second.year - first.year),
    [snapshot.availableYears]
  );
  const selectedYear = snapshot.selectedYear;
  const setSelectedYear = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    router.push(`/?${params.toString()}`, { scroll: false });
  };
  const [majorQuery, setMajorQuery] = useState("");

  const current = years.find((year) => year.year === selectedYear) ?? years[0];

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
      value: formatNumber(current.resigned),
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
    const map = new Map<string, { code: string; name: string; type?: string; choices: number }>();
    rounds
      .filter((r) => r.year === selectedYear)
      .forEach((r) => {
        const existing = map.get(r.code) || { code: r.code, name: r.name, choices: 0 };
        existing.choices += r.choices;
        map.set(r.code, existing);
      });
    return Array.from(map.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((item) => ({
        label: `${item.code} — ${item.name}`,
        value: item.choices,
        color: tcasColors[item.code] || "#666666",
      }));
  }, [rounds, selectedYear]);

  const majorSlices = useMemo(() => {
    const map = new Map<string, { code: string; name: string; type?: string; choices: number }>();
    majorRows
      .filter((m) => m.year === selectedYear)
      .forEach((m) => {
        const key = m.majorKey;
        const existing = map.get(key) || { code: m.code, name: m.name, type: m.type, choices: 0 };
        existing.choices += m.choices;
        map.set(key, existing);
      });
    return Array.from(map.values())
      .sort((a, b) => b.choices - a.choices)
      .map((item) => ({
        label: item.name,
        value: item.choices,
        color: getMajorColor(item.name, item.type),
      }));
  }, [majorRows, selectedYear]);

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
              <p>ดูภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน: TCAS รอบ 1-4 ปี 2567-2569 โดย trace กลับไปยัง single fact และ governed lineage ได้</p>
            </div>
            <div className="hero-controls">
              <label className="year-select">
                <span>ปีการศึกษา</span>
                <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
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
                title={`สัดส่วนรายการสมัครปี ${selectedYear} (TCAS 4 รอบ)`}
                subtitle={`จำนวนตัวเลือกสมัครปีการศึกษา ${selectedYear} แยกตามรอบ TCAS 1 - 4`}
                slices={tcasRoundSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={`รายการสมัครปี ${selectedYear}`}
                centerSubtext={`100% (ปี ${selectedYear})`}
              />
              <DonutChartCard
                title={`สัดส่วนรายการสมัครปี ${selectedYear} (ทุกสาขาวิชา)`}
                subtitle={`จำนวนตัวเลือกสมัครปีการศึกษา ${selectedYear} แยกตามสาขาวิชา`}
                slices={majorSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={`รายการสมัครปี ${selectedYear}`}
                centerSubtext={`100% (ปี ${selectedYear})`}
              />
            </section>

            <article className="panel" style={{gridColumn:"1 / -1"}}>
              <h2>TCAS {selectedYear}: ผู้สมัคร → ผู้มีสิทธิ์ → ยืนยันสิทธิ์</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:24}}>
              {visibleRounds.map(r => <section key={r.code}><h3 style={{color:tcasColors[r.code]}}>{r.code} · {r.name}</h3>
                <svg viewBox="0 0 300 330" role="img" aria-label={`${r.code} ผู้สมัคร ${r.applicants} ผู้มีสิทธิ์ ${r.eligible ?? '—'} ยืนยันสิทธิ์ ${r.confirmed}`} style={{width:"100%"}}>
                {[{label:"ผู้สมัคร",value:r.applicants,points:"5,5 295,5 248,105 52,105"},{label:"ผู้มีสิทธิ์",value:r.eligible,points:"54,110 246,110 199,210 101,210"},{label:"ยืนยันสิทธิ์",value:r.confirmed,points:"103,215 197,215 150,325"}].map((v,i)=><g key={v.label}><polygon points={v.points} fill={tcasColors[r.code]} opacity={1-i*.12}/><text x="150" y={40+i*104} textAnchor="middle" fill="white" fontSize="16">{v.label}</text><text x="150" y={68+i*104} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{v.value === undefined ? '—' : formatNumber(v.value)}</text></g>)}
                </svg><p>อัตรายืนยันจากผู้มีสิทธิ์: {r.eligible ? `${(r.confirmed/r.eligible*100).toFixed(1)}%` : '—'}</p>
              </section>)}
              </div><small>รูปกรวยแสดงลำดับขั้น พื้นที่ไม่ได้แทนสัดส่วนจำนวนคน</small>
            </article>
            <article className="panel" style={{gridColumn:"1 / -1"}}><h2>สถิติรายสาขา ปี {selectedYear}</h2>
              <input aria-label="ค้นหาสาขา" placeholder="ค้นหาสาขา" value={majorQuery} onChange={e=>setMajorQuery(e.target.value)}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24}}>{filteredMajors.map(m=><section key={m.majorKey} style={{padding:16,borderLeft:`4px solid ${getMajorColor(m.name, m.type)}`}}><h3 style={{color:getMajorColor(m.name, m.type)}}>{m.name}</h3>{[{label:"ผู้สมัคร",value:m.applicants},{label:"ผู้มีสิทธิ์",value:m.eligible},{label:"ยืนยันสิทธิ์",value:m.confirmed}].map(v=><div key={v.label} style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span>{v.label}</span><strong>{v.value === undefined ? '—' : formatNumber(v.value)}</strong></div><div style={{background:"#eee",height:12,marginTop:6}}><div style={{background:getMajorColor(m.name, m.type),height:"100%",width:`${(v.value ?? 0)/maxApplicants*100}%`}}/></div></div>)}</section>)}</div><small>ใช้มาตราส่วนจำนวนคนเดียวกันทุกสาขา</small>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
