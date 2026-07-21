"use client";

import type { ComponentType, MouseEvent, SVGProps } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  CircleStackIcon,
  HomeIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
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
  type Year,
} from "./data/warehouse-snapshot";

export type PageName =
  | "Overview"
  | "Warehouse"
  | "Rounds"
  | "Majors"
  | "Quality";

const sideLinks = [
  ["Overview", "home", "/"],
  ["Warehouse", "stack", "/warehouse"],
  ["Rounds", "check", "/rounds"],
  ["Majors", "bars", "/majors"],
  ["Quality", "shield", "/quality"],
] as const;

const pageMeta: Record<PageName, { eyebrow: string; title: string; copy: string }> = {
  Overview: {
    eyebrow: "Engineering Admissions Analytics",
    title: "TCAS Admissions Data Warehouse",
    copy: "ภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน ครบ TCAS รอบ 1-4 ปี 2568 และ 2569 จาก exported warehouse snapshot ที่ trace กลับไปยัง Neon PostgreSQL marts, dimensional facts และ governed lineage ได้",
  },
  Warehouse: {
    eyebrow: "Warehouse Architecture",
    title: "Warehouse, Lineage และ Core Model",
    copy: "ตรวจสอบเส้นทางข้อมูลตั้งแต่ Excel source, staging CSV, core facts, governed marts, query contract และ dashboard-ready snapshot",
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

function Icon({ name }: { name: string }) {
  const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    home: HomeIcon,
    stack: CircleStackIcon,
    check: CheckCircleIcon,
    bars: AcademicCapIcon,
    shield: ShieldCheckIcon,
  };
  const HeroIcon = icons[name] ?? Squares2X2Icon;
  return <HeroIcon className={`ui-icon ui-icon-${name}`} aria-hidden="true" />;
}

export function DashboardPage({ activePage }: { activePage: PageName }) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<Year>(2569);
  const [majorQuery, setMajorQuery] = useState("");
  const [detail, setDetail] = useState("Dashboard พร้อมใช้งานจาก admissions warehouse ที่ตัด PII แล้ว");
  const meta = pageMeta[activePage];

  const current = years.find((year) => year.year === selectedYear) ?? years[1];
  const previous = years.find((year) => year.year !== selectedYear) ?? years[0];
  const applicantChange = current.applicants - previous.applicants;
  const confirmedChange = current.confirmed - previous.confirmed;
  const choicesChange = current.choices - previous.choices;
  const rateChange = current.rate - previous.rate;

  const filteredMajors = useMemo(() => {
    const normalizedQuery = majorQuery.trim().toLowerCase();
    return majorRows
      .filter((major) => major.year === selectedYear)
      .filter((major) => {
        if (!normalizedQuery) return true;
        return `${major.code} ${major.name} ${major.type}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => b.applicants - a.applicants);
  }, [majorQuery, selectedYear]);

  const visibleMajors = filteredMajors;
  const maxApplicants = Math.max(...filteredMajors.map((major) => major.applicants), 1);
  const visibleStatuses = statuses.filter((status) => status.year === selectedYear);
  const visibleRounds = rounds;
  const compareMetrics = [
    ["ผู้สมัครไม่ซ้ำ", years[0].applicants, years[1].applicants, 3600],
    ["ยืนยันสิทธิ์", years[0].confirmed, years[1].confirmed, 600],
    ["อัตราการยืนยัน", years[0].rate, years[1].rate, 20],
  ] as const;

  const statCards = [
    {
      name: `ผู้สมัครไม่ซ้ำ (${selectedYear})`,
      value: formatNumber(current.applicants),
      change: `${formatSigned(applicantChange)} vs ${previous.year}`,
      changeType: deltaClass(applicantChange),
    },
    {
      name: `ผู้ยืนยันสิทธิ์ (${selectedYear})`,
      value: formatNumber(current.confirmed),
      change: `${formatSigned(confirmedChange)} vs ${previous.year}`,
      changeType: deltaClass(confirmedChange),
    },
    {
      name: `อัตราการยืนยัน (${selectedYear})`,
      value: `${current.rate.toFixed(2)}%`,
      change: `${rateChange > 0 ? "+" : ""}${rateChange.toFixed(2)} pts`,
      changeType: deltaClass(rateChange),
    },
    {
      name: `จำนวนตัวเลือก (${selectedYear})`,
      value: formatNumber(current.choices),
      change: `${formatSigned(choicesChange)} vs ${previous.year}`,
      changeType: deltaClass(choicesChange),
    },
  ];

  const qualityCards = qualityMetricDefinitions.map(({ label, value }) => [label, value] as const);
  const isOverview = activePage === "Overview";
  const showKpiStrip = isOverview;
  const showStatusPanel = isOverview || activePage === "Quality";
  const showMajorsPanel = isOverview || activePage === "Majors";
  const showQualityPanel = isOverview || activePage === "Quality";
  const showRoundsPanel = isOverview || activePage === "Rounds";
  const showComparePanel = isOverview;
  const showDashboardGrid = showStatusPanel || showMajorsPanel || showQualityPanel || showRoundsPanel || showComparePanel;
  const showWarehousePanel = isOverview || activePage === "Warehouse";
  const isFocusedPage = !isOverview;

  function navigateWithTransition(event: MouseEvent<HTMLAnchorElement>, label: string, href: string) {
    setDetail(`${label} panel is ready`);

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    if (window.location.pathname === href) return;

    const navigate = () => router.push(href);
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };

    if (transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(navigate);
      return;
    }

    navigate();
  }

  return (
    <main className="app-frame">
      <aside className="sidebar" aria-label="Dashboard sidebar">
        <Link className="brand" href="/" onClick={() => setDetail("กลับสู่ภาพรวม TCAS Admissions Data Warehouse")}>
          <span className="brand-mark" aria-hidden="true">
            <Image src="/tcas-dw-cartoon-logo.png" alt="" width={48} height={48} priority />
          </span>
          <span>
            <strong>TCAS DW</strong>
            <small>Engineering Admissions</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="Section navigation">
          {sideLinks.map(([label, icon, href]) => (
            <Link
              className={activePage === label ? "active" : ""}
              href={href}
              key={label}
              onClick={(event) => navigateWithTransition(event, label, href)}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

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
              <span>exported {warehouseSnapshot.exportedAt}</span>
            </div>
          </div>
          <div className="hero-controls">
            <label className="year-select">
              <span>ปีการศึกษา</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) as Year)}>
                <option value={2569}>2569</option>
                <option value={2568}>2568</option>
              </select>
            </label>
          </div>
        </section>

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
                <span>Δ vs 2568</span>
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
                  <span className={`change-chip ${deltaClass(major.applicantChange)}`}>{formatSigned(major.applicantChange)}</span>
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
            )}
          </article>
          )}

          {showRoundsPanel && (
          <article id="rounds" className="panel rounds-panel">
            <div className="panel-title">
              <h2>ภาพรวม TCAS รอบ 1-4 ทุกปีที่โหลดเข้า warehouse</h2>
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

          {showComparePanel && (
          <article className="panel compare-panel">
            <div className="panel-title">
              <h2>เปรียบเทียบ TCAS ปี 2568 vs 2569</h2>
            </div>
            <div className="legend">
              <span><i className="year-68" />2568</span>
              <span><i className="year-69" />2569</span>
            </div>
            <div className="compare-summary" aria-label="Year over year summary">
              <span><strong>-154</strong> applicants</span>
              <span><strong>+17</strong> confirmed</span>
              <span><strong>+1.15 pts</strong> rate</span>
            </div>
            <div className="compare-chart">
              {compareMetrics.map(([label, first, second, max]) => (
                <div className="chart-group" key={label}>
                  <div className="bars">
                    <span className="year-68" style={{ height: `${(Number(first) / Number(max)) * 100}%` }}><b>{typeof first === "number" && first < 100 ? `${first}%` : formatNumber(Number(first))}</b></span>
                    <span className="year-69" style={{ height: `${(Number(second) / Number(max)) * 100}%` }}><b>{typeof second === "number" && second < 100 ? `${second}%` : formatNumber(Number(second))}</b></span>
                  </div>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </article>
          )}
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
