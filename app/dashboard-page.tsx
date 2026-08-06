"use client";

import { useMemo, useState } from "react";
import {
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import {
  type DashboardSnapshot,
  type Year,
} from "./data/dashboard-types";
import { AdmissionsDecisionCenter } from "./admissions-decision-center";
import { AdmissionsAnalyticsDashboard } from "./analytics-dashboard";
import { SidebarNavigation } from "./sidebar-navigation";

export type PageName =
  | "Overview"
  | "Dashboard"
  | "Warehouse"
  | "Technical"
  | "Rounds"
  | "Majors"
  | "Quality"
  | "Insights";

const pageHref: Record<PageName, string> = {
  Overview: "/",
  Dashboard: "/dashboard",
  Warehouse: "/warehouse",
  Technical: "/technical",
  Rounds: "/rounds",
  Majors: "/majors",
  Quality: "/quality",
  Insights: "/insights",
};

const pageMeta: Record<PageName, { eyebrow: string; title: string; copy: string }> = {
  Overview: {
    eyebrow: "Engineering Admissions Analytics",
    title: "TCAS Admissions Data Warehouse",
    copy: "ดูภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน แยกตามปีการศึกษาที่เลือก ครบ TCAS รอบ 1-4 โดยข้อมูล trace กลับไปยัง Neon PostgreSQL marts, dimensional facts และ governed lineage ได้",
  },
  Dashboard: {
    eyebrow: "Visual Analytics",
    title: "Admissions Analytics Dashboard",
    copy: "สำรวจแนวโน้ม เปรียบเทียบผลลัพธ์ และวิเคราะห์ความสัมพันธ์ของข้อมูลรับสมัครผ่านกราฟแบบ interactive",
  },
  Warehouse: {
    eyebrow: "Warehouse Architecture",
    title: "Warehouse, Lineage และ Core Model",
    copy: "ตรวจสอบเส้นทางข้อมูลตั้งแต่ Excel source, staging CSV, core facts, governed marts, query contract และ dashboard-ready snapshot",
  },
  Technical: {
    eyebrow: "Technical Architecture",
    title: "Project Technical Overview",
    copy: "อธิบายเส้นทางข้อมูลตั้งแต่ Excel ผ่าน ETL, privacy boundary, dimensional warehouse และ governed marts จนเป็น Dashboard พร้อม production runtime, quality gates และหลักฐานที่ตรวจสอบย้อนกลับได้",
  },
  Rounds: {
    eyebrow: "Round Performance",
    title: "TCAS Round Analytics",
    copy: "แยกข้อมูลรายรอบ TCAS1 Portfolio, TCAS2 Quota, TCAS3 Admission และ TCAS4 Direct Admission",
  },
  Majors: {
    eyebrow: "Major Ranking",
    title: "Major Demand and Conversion",
    copy: "ดู demand, confirmed applicants, conversion rate และ year-over-year movement ของแต่ละสาขา",
  },
  Quality: {
    eyebrow: "Data Quality",
    title: "Data Quality and Status Distribution",
    copy: "ตรวจคุณภาพข้อมูลพร้อมนิยาม metric, source object, validation rule, missing values, PII boundary และการกระจายสถานะ TCAS จาก processed admissions data",
  },
  Insights: {
    eyebrow: "Decision Intelligence",
    title: "Business Questions and Decision Insights",
    copy: "ตอบคำถามเชิงธุรกิจจาก decision marts พร้อม metric, recommended action, confidence, quality gate และ lineage กลับไปยัง warehouse object ที่ใช้ตัดสินใจ",
  },
};

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

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export function DashboardPage({ activePage, snapshot }: { activePage: PageName; snapshot: DashboardSnapshot }) {
  if (activePage === "Dashboard") {
    return <AdmissionsAnalyticsDashboard snapshot={snapshot} />;
  }

  if (activePage === "Insights") {
    return <AdmissionsDecisionCenter snapshot={snapshot} />;
  }

  return <StandardDashboardPage activePage={activePage} snapshot={snapshot} />;
}

function StandardDashboardPage({ activePage, snapshot }: { activePage: PageName; snapshot: DashboardSnapshot }) {
  const selectableYears = useMemo(
    () => [...snapshot.years].sort((first, second) => second.year - first.year),
    [snapshot.years],
  );
  const [selectedYear, setSelectedYear] = useState<Year>(() => selectableYears[0]?.year ?? 0);
  const [majorQuery, setMajorQuery] = useState("");
  const detail = "Dashboard พร้อมใช้งานจาก admissions warehouse ที่ตัด PII แล้ว";
  const meta = pageMeta[activePage];
  const {
    dataCatalogRows,
    etlValidationChecks,
    lineageEdges,
    majorRows,
    qualityMetricDefinitions,
    rounds,
    statuses,
    warehouseQueries,
    warehouseSnapshot,
    years,
    runtime,
    businessQuestions,
    decisionInsights,
    warehouseHealth,
    decisionMartContract,
  } = snapshot;

  const current = years.find((year) => year.year === selectedYear) ?? selectableYears[0];
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

  const visibleMajors = filteredMajors;
  const maxApplicants = Math.max(...filteredMajors.map((major) => major.applicants), 1);
  const visibleStatuses = statuses.filter((status) => status.year === selectedYear);
  const visibleRounds = activePage === "Overview"
    ? rounds.filter((round) => round.year === selectedYear)
    : rounds;
  const sortedInsights = decisionInsights.slice().sort((a, b) => a.priority - b.priority);
  const executivePriorities = sortedInsights.slice(0, 3);
  const insightCategories = Array.from(new Set(sortedInsights.map((insight) => insight.category)));
  const questionDomains = Array.from(new Set(businessQuestions.map((question) => question.domain)));

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

  const qualityCards = qualityMetricDefinitions.map(({ label, value }) => [label, value] as const);
  const isOverview = activePage === "Overview";
  const showKpiStrip = isOverview;
  const showStatusPanel = isOverview || activePage === "Quality";
  const showMajorsPanel = isOverview || activePage === "Majors";
  const showQualityPanel = activePage === "Quality";
  const showRoundsPanel = isOverview || activePage === "Rounds";
  const showInsightsPanel = activePage === "Insights";
  const showDashboardGrid = showStatusPanel || showMajorsPanel || showQualityPanel || showRoundsPanel;
  const showWarehousePanel = activePage === "Warehouse";
  const showTechnicalPanel = activePage === "Technical";
  const isFocusedPage = !isOverview;

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref={pageHref[activePage]} />

      <section className="workspace" data-page={activePage}>
        <div className="page-transition" key={activePage}>
        <section id="overview" className="hero-panel">
          <div>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            <p>{meta.copy}</p>
            <div className="snapshot-meta" aria-label="Warehouse snapshot metadata">
              <span>{warehouseSnapshot.dashboardMode}</span>
              <span>{warehouseSnapshot.schema}</span>
              <span>{runtime.source}</span>
              <span>exported {warehouseSnapshot.exportedAt}</span>
            </div>
          </div>
          {activePage !== "Technical" && <div className="hero-controls">
            <label className="year-select">
              <span>ปีการศึกษา</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) as Year)}>
                {selectableYears.map((year) => (
                  <option value={year.year} key={year.year}>{year.year}</option>
                ))}
              </select>
            </label>
          </div>}
        </section>

        {showTechnicalPanel && (
          <section id="technical" className="technical-layout" aria-label="Project technical architecture">
            <article className="panel technical-flow-panel">
              <div className="panel-title">
                <div>
                  <p className="technical-kicker">Architecture walkthrough</p>
                  <h2>End-to-End Data Architecture</h2>
                </div>
                <span className="mini-pill">7 connected layers</span>
              </div>
              <figure className="technical-flow-figure">
                {/* eslint-disable-next-line @next/next/no-img-element -- static generated architecture asset is served by the current runtime */}
                <img
                  alt="Flow จาก Excel ผ่าน ETL, PII-free CSV, Neon PostgreSQL, Fact และ Dimension, Data Mart ไปยัง Dashboard"
                  src="/technical-data-architecture-flow.png"
                />
                <figcaption>
                  ข้อมูลจะถูกทำให้สะอาด ปลอด PII และมีโครงสร้างมากขึ้นในแต่ละชั้น ก่อนกลายเป็นข้อมูลพร้อมตัดสินใจบน Dashboard
                </figcaption>
              </figure>
              <div className="technical-stage-grid">
                {[
                  ["01", "Excel", "Source", "ไฟล์รับสมัครต้นทางระดับผู้สมัคร ใช้เป็นหลักฐานดิบและยังมี PII"],
                  ["02", "ETL", "Transform", "อ่าน ทำความสะอาด normalize, deduplicate และ aggregate ข้อมูล"],
                  ["03", "PII-free CSV", "Privacy boundary", "เก็บเฉพาะข้อมูลสรุป โดยไม่ส่งชื่อ เลขบัตร โทรศัพท์ หรืออีเมลออกจาก source"],
                  ["04", "Neon PostgreSQL", "Warehouse storage", "รวมข้อมูลใน schema admissions_dw เพื่อ query, audit และรันซ้ำได้"],
                  ["05", "Fact + Dimension", "Core model", "แยกค่าที่วัดได้ออกจากมิติ ปี รอบ สาขา และสถานะ พร้อมกำหนด grain"],
                  ["06", "Data Mart", "Decision layer", "สรุป metric ตามคำถาม เช่น year summary, conversion และ round efficiency"],
                  ["07", "Dashboard", "Presentation", "แสดงข้อมูลจาก governed mart ผ่าน server-side loader โดย UI ไม่เป็นแหล่งเก็บตัวเลข"],
                ].map(([number, title, layer, copy]) => (
                  <section key={number}>
                    <span>{number}</span>
                    <div>
                      <small>{layer}</small>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel technical-hierarchy-panel">
              <div className="panel-title">
                <div>
                  <p className="technical-kicker">Layered system view</p>
                  <h2>Data Hierarchy</h2>
                </div>
                <span className="mini-pill">5 levels</span>
              </div>
              <p className="technical-hierarchy-intro">
                แต่ละชั้นใช้ผลลัพธ์ที่ผ่านการควบคุมจากชั้นด้านล่าง ทำให้แยกหน้าที่ ตรวจสอบ lineage และเปลี่ยนแปลงระบบได้โดยไม่ผูกทุกส่วนเข้าด้วยกัน
              </p>
              <ol className="technical-hierarchy" aria-label="Data platform hierarchy from presentation to source">
                {([
                  ["05", "Presentation", "Decision experience", ["Dashboard", "Insights", "Reports"]],
                  ["04", "Semantic", "Business-ready metrics", ["Executive mart", "Major conversion", "Decision insights"]],
                  ["03", "Warehouse", "Governed dimensional model", ["Fact tables", "Conformed dimensions", "Quality & lineage"]],
                  ["02", "Integration", "Clean and privacy-safe data", ["ETL", "Normalized staging", "PII boundary"]],
                  ["01", "Source", "Owned raw evidence", ["Admissions Excel", "GA4 aggregate reports"]],
                ] as const).map(([level, title, description, items]) => (
                  <li className={`technical-hierarchy-level level-${level}`} key={level}>
                    <span className="technical-hierarchy-number">L{level}</span>
                    <div className="technical-hierarchy-copy">
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </div>
                    <div className="technical-hierarchy-items">
                      {items.map((item) => <span key={item}>{item}</span>)}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="technical-drilldown" aria-label="Admissions analytical drill-down hierarchy">
                <strong>Analytical drill-down</strong>
                <div>
                  {[
                    ["01", "Academic Year"],
                    ["02", "TCAS Round"],
                    ["03", "Faculty / Major"],
                    ["04", "Applicant Status"],
                  ].map(([number, label]) => (
                    <span key={number}><b>{number}</b>{label}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel technical-runtime-panel">
              <div className="panel-title">
                <h2>Production Runtime</h2>
                <span className={`health-status ${warehouseHealth.status}`}>{warehouseHealth.status}</span>
              </div>
              <div className="runtime-paths">
                <section>
                  <span>Primary</span>
                  <strong>Server-side Neon query</strong>
                  <code>DATABASE_URL → adapter → admissions_dw marts</code>
                  <p>Credential อยู่ฝั่ง Server และไม่ถูกส่งไปยัง Browser</p>
                </section>
                <section>
                  <span>Fallback</span>
                  <strong>Generated warehouse artifact</strong>
                  <code>query results → validated JSON → Dashboard</code>
                  <p>ใช้เมื่อ live query ไม่พร้อม โดยยังคง trace กลับไปยัง query contract ได้</p>
                </section>
              </div>
            </article>

            <article className="panel technical-evidence-panel">
              <div className="panel-title">
                <h2>Current Technical Evidence</h2>
                <span className="mini-pill">warehouse snapshot</span>
              </div>
              <dl>
                <div><dt>Source rows</dt><dd>{formatNumber(warehouseSnapshot.sourceRows)}</dd></div>
                <div><dt>Source files</dt><dd>{warehouseSnapshot.sourceFiles}</dd></div>
                <div><dt>PII exported</dt><dd>{warehouseSnapshot.piiExportedColumns}</dd></div>
                <div><dt>Lineage edges</dt><dd>{warehouseSnapshot.lineageEdges}</dd></div>
              </dl>
            </article>

            <article className="panel technical-topics-panel">
              <div className="panel-title">
                <h2>Technical Talking Points</h2>
                <span className="mini-pill">presentation ready</span>
              </div>
              <div className="technical-topic-list">
                {[
                  ["ETL & Privacy", "ใช้ applicant identifier เฉพาะใน memory เพื่อหา unique applicants แล้วตัด PII ก่อน export"],
                  ["Star Schema & Grain", "Fact เก็บค่าที่วัดได้ ส่วน Dimension ทำให้ group ตามปี รอบ สาขา และสถานะได้สม่ำเสมอ"],
                  ["Marts & Query Contract", "Dashboard ใช้ metric ที่นิยามจาก mart/view เดียวกัน จึงไม่คำนวณซ้ำใน UI"],
                  ["Quality & Lineage", "ตรวจ missing values, source coverage, PII boundary และ trace จาก Dashboard กลับถึง source"],
                  ["Repeatable Delivery", "Load แบบ upsert และทดสอบ data build, validation, static-data policy และ rendered output ก่อน publish"],
                ].map(([title, copy], index) => (
                  <section key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{title}</strong><p>{copy}</p></div>
                  </section>
                ))}
              </div>
            </article>
          </section>
        )}

        {showKpiStrip && (
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
        )}

        {showDashboardGrid && (
        <section className={`dashboard-grid ${isFocusedPage ? "focused-grid" : ""}`}>
          {showStatusPanel && (
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
          )}

          {showMajorsPanel && (
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
                <span>{isOverview ? "ประเภท" : "Δ เทียบปีก่อน"}</span>
              </div>
              {visibleMajors.map((major, index) => (
                <div className="major-row" role="row" key={`${major.year}-${major.code}-${major.name}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{major.name}</strong>
                  <span className="value-with-bar">
                    {formatNumber(major.applicants)}
                    <i style={{ width: `${(major.applicants / maxApplicants) * 100}%` }} />
                  </span>
                  <span>{formatNumber(major.confirmed)}</span>
                  <span>{major.rate.toFixed(2)}%</span>
                  {isOverview
                    ? <span>{major.type}</span>
                    : <span className={`change-chip ${deltaClass(major.applicantChange)}`}>{formatSigned(major.applicantChange)}</span>}
                </div>
              ))}
            </div>
          </article>
          )}

          {showQualityPanel && (
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
            {activePage === "Quality" && (
              <>
                <div className="health-inline" aria-label="Warehouse health and freshness">
                  <strong>Warehouse health: {warehouseHealth.status}</strong>
                  <span>last refresh {warehouseHealth.lastRefreshAt}</span>
                  <span>{warehouseHealth.qualityChecksFailed} failed checks</span>
                  <span>{warehouseHealth.freshnessSlaHours}h freshness SLA</span>
                </div>
                <div className="quality-definitions" aria-label="Data quality metric definitions">
                  {qualityMetricDefinitions.map((metric) => (
                    <section key={metric.label}>
                      <strong>{metric.label}</strong>
                      <span>{metric.sourceObject}</span>
                      <p>{metric.definition}</p>
                      <small>{metric.rule}</small>
                    </section>
                  ))}
                </div>
              </>
            )}
          </article>
          )}

          {showRoundsPanel && (
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
                      <td><span className="rate-chip">{round.rate.toFixed(2)}%</span></td>
                      <td>{round.files}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          )}

        </section>
        )}

        {showInsightsPanel && (
          <section className="insights-layout" aria-label="Business decision insights">
            <article className="panel executive-priority-panel">
              <div className="panel-title">
                <h2>Executive action priorities</h2>
                <span className="mini-pill">top {executivePriorities.length}</span>
              </div>
              <div className="priority-strip">
                {executivePriorities.map((insight) => (
                  <section key={insight.id}>
                    <span>{insight.category}</span>
                    <strong>{insight.title}</strong>
                    <p>{insight.recommendedAction}</p>
                    <small>{insight.metricValue} · {insight.martObject}</small>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel insight-category-panel">
              <div className="panel-title">
                <h2>Insight categories</h2>
                <span className="mini-pill">{insightCategories.length} groups</span>
              </div>
              <div className="category-filter-list" aria-label="Insight category filters">
                {insightCategories.map((category) => (
                  <a href={`#insight-${slug(category)}`} key={category}>
                    {category}
                    <strong>{decisionInsights.filter((insight) => insight.category === category).length}</strong>
                  </a>
                ))}
              </div>
            </article>

            <article className="panel insights-panel">
              <div className="panel-title">
                <h2>Decision insights from governed marts</h2>
                <span className="mini-pill">{decisionInsights.length} insights</span>
              </div>
              <div className="insight-grid">
                {insightCategories.map((category) => (
                  <div className="insight-category-group" id={`insight-${slug(category)}`} key={category}>
                    <h2>{category}</h2>
                    {sortedInsights
                      .filter((insight) => insight.category === category)
                      .map((insight) => (
                    <section className={`insight-card ${slug(insight.category)}`} key={insight.id}>
                      <div className="insight-card-head">
                        <span>{insight.id}</span>
                        <b>{insight.confidence}</b>
                      </div>
                      <h2>{insight.title}</h2>
                      <p>{insight.summary}</p>
                      <dl>
                        <div>
                          <dt>{insight.metricLabel}</dt>
                          <dd>{insight.metricValue}</dd>
                        </div>
                        <div>
                          <dt>Mart</dt>
                          <dd>{insight.martObject}</dd>
                        </div>
                        <div>
                          <dt>Decision</dt>
                          <dd>{insight.decision}</dd>
                        </div>
                      </dl>
                      <strong className="action-line">{insight.recommendedAction}</strong>
                      <small>{insight.qualityGate}</small>
                    </section>
                      ))}
                  </div>
                ))}
              </div>
            </article>

            <article className="panel business-question-panel">
              <div className="panel-title">
                <h2>Business question catalog</h2>
                <span className="mini-pill">{businessQuestions.length} questions</span>
              </div>
              <div className="business-question-list">
                {questionDomains.map((domain) => (
                  <div className="question-domain-group" key={domain}>
                    <h2>{domain}</h2>
                    {businessQuestions
                      .filter((question) => question.domain === domain)
                      .map((question) => (
                        <section key={question.id}>
                          <span>{question.id}</span>
                          <strong>{question.question}</strong>
                          <p>{question.decisionUse}</p>
                          <small>{question.martObject} · {question.qualityGate}</small>
                        </section>
                      ))}
                  </div>
                ))}
              </div>
            </article>

            <article className="panel health-panel">
              <div className="panel-title">
                <h2>Warehouse health and freshness</h2>
                <span className={`health-status ${warehouseHealth.status}`}>{warehouseHealth.status}</span>
              </div>
              <dl className="health-grid">
                <div>
                  <dt>Last refresh</dt>
                  <dd>{warehouseHealth.lastRefreshAt}</dd>
                </div>
                <div>
                  <dt>Freshness SLA</dt>
                  <dd>{warehouseHealth.freshnessSlaHours}h</dd>
                </div>
                <div>
                  <dt>Source rows</dt>
                  <dd>{formatNumber(warehouseHealth.sourceRows)}</dd>
                </div>
                <div>
                  <dt>Source files</dt>
                  <dd>{warehouseHealth.sourceFiles}</dd>
                </div>
                <div>
                  <dt>Quality failed</dt>
                  <dd>{warehouseHealth.qualityChecksFailed}</dd>
                </div>
                <div>
                  <dt>PII exported</dt>
                  <dd>{warehouseHealth.piiExportedColumns}</dd>
                </div>
              </dl>
              <p>{warehouseHealth.notes}</p>
            </article>

            <article className="panel decision-mart-panel">
              <div className="panel-title">
                <h2>Decision mart contract</h2>
                <ChartBarSquareIcon className="panel-icon" aria-hidden="true" />
              </div>
              <div className="mart-contract-list">
                {decisionMartContract.map((mart) => (
                  <section key={mart.martObject}>
                    <strong>{mart.martObject}</strong>
                    <span>{mart.grain}</span>
                    <p>{mart.purpose}</p>
                    <small>{mart.sourceObjects}</small>
                  </section>
                ))}
              </div>
            </article>
          </section>
        )}

        {showWarehousePanel && (
        <section id="warehouse" className="panel warehouse-panel">
          <div className="panel-title">
            <h2>Warehouse, marts และ lineage ที่ใช้งานจริง</h2>
            <span className="mini-pill">governed DW</span>
          </div>
          <div className="warehouse-flow">
            {[
              ["Source", "Excel admissions files"],
              ["Staging", "PII-free processed CSV"],
              ["Core DW", "facts + dimensions"],
              ["Marts", "year, round, major conversion"],
              ["Dashboard", "interactive BI view"],
            ].map(([title, copy]) => (
              <div key={title}>
                <strong>{title}</strong>
                <span>{copy}</span>
              </div>
            ))}
          </div>
          {activePage === "Warehouse" && (
            <div className="warehouse-evidence">
              <article className="evidence-card catalog-card">
                <div className="panel-title">
                  <h2>Data catalog evidence</h2>
                  <span className="mini-pill">{warehouseSnapshot.catalogRows} catalog rows</span>
                </div>
                <div className="catalog-table" role="table" aria-label="Warehouse dataset catalog">
                  <div className="catalog-head" role="row">
                    <span>Dataset</span>
                    <span>Layer</span>
                    <span>Grain</span>
                    <span>Evidence</span>
                    <span>Sensitivity</span>
                  </div>
                  {dataCatalogRows.map(([dataset, layer, grain, evidence, sensitivity]) => (
                    <div className="catalog-row" role="row" key={dataset}>
                      <strong>{dataset}</strong>
                      <span>{layer}</span>
                      <span>{grain}</span>
                      <span>{evidence}</span>
                      <span>{sensitivity}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="evidence-card lineage-card">
                <div className="panel-title">
                  <h2>Lineage edges</h2>
                  <span className="mini-pill">{warehouseSnapshot.lineageEdges} edges</span>
                </div>
                <div className="lineage-list">
                  {lineageEdges.map(([from, to, transform]) => (
                    <div key={`${from}-${to}`}>
                      <strong>{from}</strong>
                      <span>{transform}</span>
                      <b>{to}</b>
                    </div>
                  ))}
                </div>
              </article>

              <article className="evidence-card query-card">
                <div className="panel-title">
                  <h2>Dashboard query contract</h2>
                  <span className="mini-pill">{warehouseSnapshot.sourceSystem}</span>
                </div>
                <div className="query-list">
                  {warehouseQueries.map((query) => (
                    <section key={query.name}>
                      <strong>{query.name}</strong>
                      <span>{query.object}</span>
                      <code>{query.sql}</code>
                    </section>
                  ))}
                </div>
              </article>

              <article className="evidence-card validation-card">
                <div className="panel-title">
                  <h2>ETL validation checks</h2>
                  <span className="mini-pill">all pass</span>
                </div>
                <div className="validation-list">
                  {etlValidationChecks.map(([name, evidence, result]) => (
                    <div key={name}>
                      <strong>{name}</strong>
                      <span>{evidence}</span>
                      <b>{result}</b>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}
        </section>
        )}

        <section id="reports" className="detail-bar" aria-live="polite">
          {detail}
        </section>
        </div>
      </section>
    </main>
  );
}
