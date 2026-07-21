"use client";

import type { ComponentType, MouseEvent, SVGProps } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AcademicCapIcon,
  CheckIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  HomeIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

type Year = 2568 | 2569;

type YearOverview = {
  year: Year;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  sourceFiles: number;
  avgScore: number;
};

type MajorRow = {
  year: Year;
  code: string;
  name: string;
  type: string;
  applicants: number;
  confirmed: number;
  rate: number;
  avgScore: number;
  applicantChange?: number;
};

type StatusRow = {
  year: Year;
  label: string;
  choices: number;
  share: number;
  tone: "green" | "amber" | "blue" | "red" | "muted" | "purple" | "orange";
};

type RoundRow = {
  year: Year;
  code: string;
  name: string;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  files: number;
};

type InsightDialog = {
  title: string;
  description: string;
};

export type PageName =
  | "Overview"
  | "Warehouse"
  | "Rounds"
  | "Majors"
  | "Quality";

const years: YearOverview[] = [
  { year: 2568, choices: 4853, applicants: 3597, confirmed: 528, rate: 14.68, sourceFiles: 6, avgScore: 21.7825 },
  { year: 2569, choices: 4579, applicants: 3443, confirmed: 545, rate: 15.83, sourceFiles: 5, avgScore: 19.101 },
];

const majorRows: MajorRow[] = [
  { year: 2568, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน", type: "ภาคปกติ", applicants: 827, confirmed: 60, rate: 7.26, avgScore: 35.6516 },
  { year: 2568, code: "E04", name: "วิศวกรรมโยธา-ชลประทาน", type: "ภาคปกติ", applicants: 750, confirmed: 60, rate: 8, avgScore: 49.224 },
  { year: 2568, code: "E29", name: "วิศวกรรมคอมพิวเตอร์", type: "ภาคปกติ", applicants: 741, confirmed: 63, rate: 8.5, avgScore: 40.7674 },
  { year: 2568, code: "E24", name: "วิศวกรรมอุตสาหการ-โลจิสติกส์", type: "ภาคปกติ", applicants: 527, confirmed: 62, rate: 11.76, avgScore: 35.7684 },
  { year: 2568, code: "E03", name: "วิศวกรรมเครื่องกล", type: "ภาคปกติ", applicants: 517, confirmed: 48, rate: 9.28, avgScore: 35.6015 },
  { year: 2568, code: "E37", name: "วิศวกรรมเครื่องกล-เกษตร", type: "ภาคปกติ", applicants: 411, confirmed: 56, rate: 13.63, avgScore: 46.0421 },
  { year: 2568, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 335, confirmed: 52, rate: 15.52, avgScore: 33.0021 },
  { year: 2568, code: "E36", name: "วิศวกรรมอาหาร", type: "ภาคปกติ", applicants: 313, confirmed: 57, rate: 18.21, avgScore: 34.5253 },
  { year: 2568, code: "E03", name: "วิศวกรรมเครื่องกล (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 293, confirmed: 35, rate: 11.95, avgScore: 31.1507 },
  { year: 2568, code: "E39", name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม", type: "ภาคปกติ", applicants: 139, confirmed: 35, rate: 25.18, avgScore: 43.2799 },
  { year: 2569, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน", type: "ภาคปกติ", applicants: 825, confirmed: 63, rate: 7.64, avgScore: 35.7908, applicantChange: -2 },
  { year: 2569, code: "E24", name: "วิศวกรรมอุตสาหการ-โลจิสติกส์", type: "ภาคปกติ", applicants: 684, confirmed: 62, rate: 9.06, avgScore: 35.9961, applicantChange: 157 },
  { year: 2569, code: "E29", name: "วิศวกรรมคอมพิวเตอร์", type: "ภาคปกติ", applicants: 680, confirmed: 67, rate: 9.85, avgScore: 40.0213, applicantChange: -61 },
  { year: 2569, code: "E04", name: "วิศวกรรมโยธา-ชลประทาน", type: "ภาคปกติ", applicants: 602, confirmed: 62, rate: 10.3, avgScore: 47.2472, applicantChange: -148 },
  { year: 2569, code: "E03", name: "วิศวกรรมเครื่องกล", type: "ภาคปกติ", applicants: 543, confirmed: 51, rate: 9.39, avgScore: 35.5185, applicantChange: 26 },
  { year: 2569, code: "E38", name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 343, confirmed: 52, rate: 15.16, avgScore: 34.1846, applicantChange: 8 },
  { year: 2569, code: "E36", name: "วิศวกรรมอาหาร", type: "ภาคปกติ", applicants: 294, confirmed: 59, rate: 20.07, avgScore: 33.6946, applicantChange: -19 },
  { year: 2569, code: "E03", name: "วิศวกรรมเครื่องกล (ภาคพิเศษ)", type: "ภาคพิเศษ", applicants: 286, confirmed: 34, rate: 11.89, avgScore: 33.1081, applicantChange: -7 },
  { year: 2569, code: "E37", name: "วิศวกรรมเครื่องกล-เกษตร", type: "ภาคปกติ", applicants: 214, confirmed: 59, rate: 27.57, avgScore: 30.2993, applicantChange: -197 },
  { year: 2569, code: "E39", name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม", type: "ภาคปกติ", applicants: 108, confirmed: 36, rate: 33.33, avgScore: 30.836, applicantChange: -31 },
];

const statuses: StatusRow[] = [
  { year: 2568, label: "ไม่ผ่านการคัดเลือก", choices: 2551, share: 52.57, tone: "green" },
  { year: 2568, label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า", choices: 1097, share: 22.6, tone: "amber" },
  { year: 2568, label: "ยืนยันสิทธิ์", choices: 528, share: 10.88, tone: "orange" },
  { year: 2568, label: "ผู้สมัคร", choices: 400, share: 8.24, tone: "blue" },
  { year: 2568, label: "ยืนยันที่อื่นแล้ว", choices: 191, share: 3.94, tone: "blue" },
  { year: 2568, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 34, share: 0.7, tone: "purple" },
  { year: 2568, label: "สละสิทธิ์", choices: 24, share: 0.49, tone: "red" },
  { year: 2568, label: "ไม่ใช้สิทธิ์", choices: 18, share: 0.37, tone: "muted" },
  { year: 2568, label: "สละสิทธิ์ในรอบ 2", choices: 8, share: 0.16, tone: "orange" },
  { year: 2568, label: "ผ่านการคัดเลือก", choices: 1, share: 0.02, tone: "green" },
  { year: 2569, label: "ไม่ผ่านการคัดเลือก", choices: 2552, share: 55.73, tone: "green" },
  { year: 2569, label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า", choices: 1191, share: 26.01, tone: "amber" },
  { year: 2569, label: "ยืนยันสิทธิ์", choices: 545, share: 11.9, tone: "orange" },
  { year: 2569, label: "ยืนยันที่อื่นแล้ว", choices: 210, share: 4.59, tone: "blue" },
  { year: 2569, label: "ไม่ใช้สิทธิ์", choices: 30, share: 0.66, tone: "muted" },
  { year: 2569, label: "สละสิทธิ์", choices: 26, share: 0.57, tone: "red" },
  { year: 2569, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 18, share: 0.39, tone: "purple" },
  { year: 2569, label: "สละสิทธิ์ในรอบ 2", choices: 6, share: 0.13, tone: "orange" },
  { year: 2569, label: "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2", choices: 1, share: 0.02, tone: "green" },
];

const rounds: RoundRow[] = [
  { year: 2568, code: "TCAS1", name: "Portfolio", choices: 1385, applicants: 1320, confirmed: 191, rate: 14.47, files: 2 },
  { year: 2568, code: "TCAS2", name: "Quota", choices: 519, applicants: 518, confirmed: 112, rate: 21.62, files: 2 },
  { year: 2568, code: "TCAS3", name: "Admission", choices: 2711, applicants: 1810, confirmed: 214, rate: 11.82, files: 1 },
  { year: 2568, code: "TCAS4", name: "Direct Admission", choices: 238, applicants: 238, confirmed: 11, rate: 4.62, files: 1 },
  { year: 2569, code: "TCAS1", name: "Portfolio", choices: 1391, applicants: 1324, confirmed: 163, rate: 12.31, files: 1 },
  { year: 2569, code: "TCAS2", name: "Quota", choices: 614, applicants: 614, confirmed: 90, rate: 14.66, files: 2 },
  { year: 2569, code: "TCAS3", name: "Admission", choices: 2379, applicants: 1620, confirmed: 283, rate: 17.47, files: 1 },
  { year: 2569, code: "TCAS4", name: "Direct Admission", choices: 195, applicants: 195, confirmed: 9, rate: 4.62, files: 1 },
];

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
    copy: "ภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน ครบ TCAS รอบ 1-4 ปี 2568 และ 2569 ผ่าน ETL เข้า Neon PostgreSQL, dimensional facts, governed marts และ dashboard",
  },
  Warehouse: {
    eyebrow: "Warehouse Architecture",
    title: "Warehouse, Lineage และ Core Model",
    copy: "ตรวจสอบเส้นทางข้อมูลตั้งแต่ Excel source, staging CSV, core facts, governed marts และ dashboard-ready views",
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
    copy: "ตรวจคุณภาพข้อมูล, missing values, PII boundary และการกระจายสถานะ TCAS จาก processed admissions data",
  },
};

const pipeline = ["Source", "Staging", "Core DW", "Marts", "Dashboard"];

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
    clock: ClockIcon,
  };
  const HeroIcon = icons[name] ?? Squares2X2Icon;
  return <HeroIcon className={`ui-icon ui-icon-${name}`} aria-hidden="true" />;
}

export function DashboardPage({ activePage }: { activePage: PageName }) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<Year>(2569);
  const [showAllStatus, setShowAllStatus] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const [showAllRounds, setShowAllRounds] = useState(false);
  const [majorQuery, setMajorQuery] = useState("");
  const [detail, setDetail] = useState("Dashboard พร้อมใช้งานจาก admissions warehouse ที่ตัด PII แล้ว");
  const [dialog, setDialog] = useState<InsightDialog | null>(null);
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

  const visibleMajors = showAllMajors ? filteredMajors : filteredMajors.slice(0, 10);
  const maxApplicants = Math.max(...filteredMajors.map((major) => major.applicants), 1);
  const visibleStatuses = showAllStatus
    ? statuses.filter((status) => status.year === selectedYear)
    : statuses.filter((status) => status.year === selectedYear).slice(0, 8);
  const visibleRounds = showAllRounds ? rounds : rounds.filter((round) => round.year === selectedYear);

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

  const qualityCards = [
    ["Source rows", "9,432"],
    ["Missing score", "0"],
    ["Missing major", "0"],
    ["PII exported", "0 columns"],
    ["Active source groups", "1"],
    ["Source files", "11"],
    ["Catalog rows", "7"],
    ["Lineage edges", "7"],
  ];
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

  useEffect(() => {
    if (!dialog) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialog(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [dialog]);

  function openInsight(title: string, description: string) {
    setDetail(`${title}: ${description}`);
    setDialog({ title, description });
  }

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
          <span className="brand-mark">DW</span>
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

        <section className="sidebar-status" aria-label="Warehouse status">
          <div>
            <span className="online-dot" />
            <strong>Data Warehouse</strong>
            <small>Online</small>
          </div>
          <div className="status-divider" />
          <div>
            <Icon name="clock" />
            <span>Last sync</span>
            <strong>2 นาทีที่แล้ว</strong>
          </div>
        </section>
      </aside>

      <section className="workspace" data-page={activePage}>
        <div className="page-transition" key={activePage}>
        <section id="overview" className="hero-panel">
          <div>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            <p>{meta.copy}</p>
          </div>
          <div className="hero-controls">
            <label className="year-select">
              <span>ปีการศึกษา</span>
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) as Year)}>
                <option value={2569}>2569</option>
                <option value={2568}>2568</option>
              </select>
            </label>
            <div className="pipeline-tabs" aria-label="Warehouse pipeline">
              {pipeline.map((item) => (
                <button type="button" key={item} onClick={() => openInsight(item, "active warehouse stage")}>
                  {item}
                </button>
              ))}
            </div>
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
              <button type="button" onClick={() => setShowAllStatus((value) => !value)}>
                {showAllStatus ? "ย่อ" : "ดูทั้งหมด"}
              </button>
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
            <button type="button" className="link-button" onClick={() => setShowAllStatus((value) => !value)}>
              ดูรายละเอียดทั้งหมด
            </button>
          </article>
          )}

          {showMajorsPanel && (
          <article id="majors" className="panel majors-panel">
            <div className="panel-title">
              <h2>Top 10 สาขาวิชา ปี {selectedYear}</h2>
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
            <button type="button" className="link-button" onClick={() => setShowAllMajors((value) => !value)}>
              {showAllMajors ? "แสดง Top 10" : "ดูรายละเอียดทั้งหมด"}
            </button>
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
            <button type="button" className="link-button" onClick={() => openInsight("Data quality checks pass", "missing score 0, missing major 0, PII exported 0 columns")}>
              ดูรายละเอียดคุณภาพข้อมูล
            </button>
          </article>
          )}

          {showRoundsPanel && (
          <article id="rounds" className="panel rounds-panel">
            <div className="panel-title">
              <h2>ภาพรวม TCAS รอบ 1-4 ที่โหลดเข้า warehouse</h2>
              <button type="button" onClick={() => setShowAllRounds((value) => !value)}>
                {showAllRounds ? `เฉพาะ ${selectedYear}` : "ดูทุกปี"}
              </button>
            </div>
            <table>
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
                    <td>{round.year} · {round.code} ({round.name})</td>
                    <td>{formatNumber(round.choices)}</td>
                    <td>{formatNumber(round.applicants)}</td>
                    <td>{formatNumber(round.confirmed)}</td>
                    <td>{round.rate.toFixed(2)}%</td>
                    <td>{round.files}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="link-button" onClick={() => openInsight("fact_admission_round_overview", "แสดง grain: academic year + TCAS round")}>
              ดูรายละเอียดทั้งหมด
            </button>
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
            <div className="compare-chart">
              {[
                ["ผู้สมัครไม่ซ้ำ", years[0].applicants, years[1].applicants, 3600],
                ["ยืนยันสิทธิ์", years[0].confirmed, years[1].confirmed, 600],
                ["อัตราการยืนยัน", years[0].rate, years[1].rate, 20],
              ].map(([label, first, second, max]) => (
                <div className="chart-group" key={label}>
                  <div className="bars">
                    <span className="year-68" style={{ height: `${(Number(first) / Number(max)) * 100}%` }}><b>{typeof first === "number" && first < 100 ? `${first}%` : formatNumber(Number(first))}</b></span>
                    <span className="year-69" style={{ height: `${(Number(second) / Number(max)) * 100}%` }}><b>{typeof second === "number" && second < 100 ? `${second}%` : formatNumber(Number(second))}</b></span>
                  </div>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <button type="button" className="link-button" onClick={() => openInsight("เปรียบเทียบ TCAS", "ปี 2569 applicants ลดลง แต่ confirmed และ confirmed rate เพิ่มขึ้น")}>
              ดูการเปรียบเทียบราย round
            </button>
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
              <button type="button" key={title} onClick={() => openInsight(title, copy)}>
                <strong>{title}</strong>
                <span>{copy}</span>
              </button>
            ))}
          </div>
        </section>
        )}

        <section id="reports" className="detail-bar" aria-live="polite">
          {detail}
        </section>
        </div>
      </section>

      {dialog && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)}>
          <section
            aria-labelledby="insight-dialog-title"
            aria-describedby="insight-dialog-description"
            aria-modal="true"
            className="insight-dialog"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-success-icon">
              <CheckIcon aria-hidden="true" />
            </div>
            <div className="dialog-header">
              <h2 id="insight-dialog-title">{dialog.title}</h2>
              <p id="insight-dialog-description">{dialog.description}</p>
            </div>
            <button type="button" className="dialog-close-button" onClick={() => setDialog(null)}>
              กลับสู่ dashboard
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
