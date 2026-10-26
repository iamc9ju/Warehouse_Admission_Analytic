"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OverviewPageData } from "./data/page-data-types";
import { RoundRightsDonuts } from "./round-rights-donuts";
import { MajorRightsChart } from "./major-rights-chart";
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
  const [majorPercent, setMajorPercent] = useState(false);

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

  const roundApplicantSlices = useMemo(() => rounds
    .filter(row => row.year === selectedYear)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(row => ({ label: `${row.code} — ${row.name}`, value: row.applicants,
      color: tcasColors[row.code] ?? "#666666" })), [rounds, selectedYear]);

  const majorApplicantSlices = useMemo(() => majorRows
    .filter(row => row.year === selectedYear)
    .sort((a, b) => b.applicants - a.applicants)
    .map(row => ({
      label: row.type && !row.name.includes(row.type) ? `${row.name} (${row.type})` : row.name,
      value: row.applicants, color: getMajorColor(row.name, row.type),
    })), [majorRows, selectedYear]);

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
              <p className="eyebrow">ENGINEERING ADMISSIONS · ANNUAL SUMMARY</p>
              <h1>ภาพรวมการรับสมัคร ปีการศึกษา {selectedYear}</h1>
              <p>สรุปผู้สมัคร ผลการคัดเลือก และการยืนยันสิทธิ์ TCAS รอบ 1–4 ของปีที่เลือก</p>
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

            <section className="applicant-donut-grid" style={{ gridColumn: "1 / -1" }} aria-label={`ผู้สมัครไม่ซ้ำแยกรอบและสาขาปี ${selectedYear}`}>
              <DonutChartCard
                legendPosition="right"
                title={`สัดส่วนผู้สมัครไม่ซ้ำ ปี ${selectedYear} (แยกรอบ TCAS)`}
                subtitle={`นับคนไม่ซ้ำภายในแต่ละรอบ เฉพาะปีการศึกษา ${selectedYear}`}
                slices={roundApplicantSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={<>ผลรวมรายรอบ<br/>ปี {selectedYear}</>}
                centerSubtext="100% ของผลรวมรายรอบ"
              />
              <DonutChartCard
                legendPosition="right"
                title={`สัดส่วนผู้สมัครไม่ซ้ำ ปี ${selectedYear} (แยกสาขา)`}
                subtitle={`นับคนไม่ซ้ำภายในแต่ละสาขา รวมทุกรอบ เฉพาะปีการศึกษา ${selectedYear}`}
                slices={majorApplicantSlices}
                kicker={`YEAR ${selectedYear} BREAKDOWN`}
                centerLabel={<>ผลรวมรายสาขา<br/>ปี {selectedYear}</>}
                centerSubtext="100% ของผลรวมรายสาขา"
              />
              <p style={{ gridColumn: "1 / -1", margin: 0, color: "#74695d", fontSize: "var(--text-caption)" }}>
                เฉพาะปี {selectedYear} คนเดียวสมัครหลายรอบหรือหลายสาขาจะนับในแต่ละกลุ่ม ยอดกลางวงเป็นผลรวมรายกลุ่ม ไม่ใช่จำนวนคนไม่ซ้ำทั้งปี
              </p>
            </section>

            <article className="panel" style={{gridColumn:"1 / -1"}}>
              <h2>TCAS {selectedYear}: ผู้สมัคร → ผู้มีสิทธิ์ → ยืนยันสิทธิ์</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:24}}>
              {visibleRounds.map(r => <section key={r.code}><h3 style={{color:tcasColors[r.code]}}>{r.code} · {r.name}</h3>
                <svg viewBox="0 0 300 330" role="img" aria-label={`${r.code} ผู้สมัคร ${r.applicants} ผู้มีสิทธิ์ ${r.eligible ?? '—'} ยืนยันสิทธิ์ ${r.confirmed}`} style={{width:"100%"}}>
                {[{label:"ยืนยันสิทธิ์",value:r.confirmed,points:"150,5 195,105 105,105",labelY:76,valueY:98},{label:"ผู้มีสิทธิ์",value:r.eligible,points:"102,110 198,110 243,210 57,210",labelY:151,valueY:179},{label:"ผู้สมัคร",value:r.applicants,points:"54,215 246,215 295,325 5,325",labelY:259,valueY:287}].map((v,i)=><g key={v.label}><polygon points={v.points} fill={tcasColors[r.code]} opacity={.76+i*.12}/><text x="150" y={v.labelY} textAnchor="middle" fill="white" fontSize={i === 0 ? 12 : 16}>{v.label}</text><text x="150" y={v.valueY} textAnchor="middle" fill="white" fontSize={i === 0 ? 16 : 20} fontWeight="bold">{v.value === undefined ? '—' : formatNumber(v.value)}</text></g>)}
                </svg><p>อัตรายืนยันจากผู้มีสิทธิ์: {r.eligible ? `${(r.confirmed/r.eligible*100).toFixed(1)}%` : '—'}</p>
              </section>)}
              </div>
              <small>พีระมิดแสดงลำดับขั้นจากฐานผู้สมัครสู่ยอดผู้ยืนยันสิทธิ์ พื้นที่ไม่ได้แทนสัดส่วนจำนวนคน</small>
            </article>
            <RoundRightsDonuts rows={snapshot.rightsOutcomes} rounds={visibleRounds} year={selectedYear} />
            <article className="panel" style={{gridColumn:"1 / -1"}}>
              <div className="panel-title"><h2>สถิติรายสาขา ปี {selectedYear}</h2>
                <div className="chart-control-group" role="group" aria-label="รูปแบบสถิติรายสาขา">
                  {[false, true].map(mode => <button type="button" key={String(mode)} className="chart-control-button" aria-pressed={majorPercent === mode} onClick={() => setMajorPercent(mode)}>{mode ? "เปอร์เซ็นต์ (%)" : "จำนวนคน"}</button>)}
                </div>
              </div>
              {/*<input aria-label="ค้นหาสาขา" placeholder="ค้นหาสาขา" value={majorQuery} onChange={e=>setMajorQuery(e.target.value)}/>*/}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24}}>{filteredMajors.map(m=><section key={m.majorKey} style={{padding:16,borderLeft:`4px solid ${getMajorColor(m.name, m.type)}`}}><h3 style={{color:getMajorColor(m.name, m.type)}}>{m.name}</h3>{[{label:"ผู้สมัคร",value:m.applicants},{label:"ผู้มีสิทธิ์",value:m.eligible},{label:"ยืนยันสิทธิ์",value:m.confirmed}].map(v=>{
                const percentage = v.value === undefined || m.applicants === 0 ? undefined : v.value / m.applicants * 100;
                const width = majorPercent ? percentage ?? 0 : (v.value ?? 0) / maxApplicants * 100;
                return <div key={v.label} style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span>{v.label}</span><strong>{majorPercent ? percentage === undefined ? '—' : `${percentage.toFixed(1)}%` : v.value === undefined ? '—' : formatNumber(v.value)}</strong></div><div style={{background:"#eee",height:12,marginTop:6}}><div style={{background:getMajorColor(m.name, m.type),height:"100%",width:`${Math.min(100, Math.max(0, width))}%`}}/></div></div>;
              })}</section>)}</div><small>{majorPercent ? "เปอร์เซ็นต์เทียบกับผู้สมัครของแต่ละสาขา (ผู้สมัคร = 100%) · หากไม่มีผู้สมัครจะแสดง —" : "ใช้มาตราส่วนจำนวนคนเดียวกันทุกสาขา"}</small>
            </article>
            <MajorRightsChart key={selectedYear} rows={snapshot.majorRightsOutcomes} majors={majorRows} year={selectedYear} />
          </section>
        </div>
      </section>
    </main>
  );
}
