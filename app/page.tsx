type YearOverview = {
  year: number;
  applicationChoices: number;
  uniqueApplicants: number;
  confirmed: number;
  confirmedRate: number;
  avgScore: number;
  applicantsChange?: number;
  confirmedChange?: number;
};

type MajorPerformance = {
  year: number;
  code: string;
  name: string;
  type: string;
  applicants: number;
  confirmed: number;
  rate: number;
  avgScore: number;
  applicantChange?: number;
  confirmedChange?: number;
};

type StatusDistribution = {
  year: number;
  label: string;
  choices: number;
  share: number;
};

type RoundPerformance = {
  year: number;
  code: string;
  name: string;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  sourceFiles: number;
};

type SocialOverview = {
  year: number;
  mentions: number;
  engagement: number;
  engagementPerMention: number;
  sentimentScore: number;
  mentionChange?: number;
  engagementChange?: number;
};

type PlatformSummary = {
  platform: string;
  mentions: number;
  engagement: number;
};

type WarehouseLayer = {
  layer: string;
  purpose: string;
  objects: string;
  status: string;
};

type WarehouseMetric = {
  label: string;
  value: string;
  detail: string;
};

type DataMart = {
  name: string;
  grain: string;
  useCase: string;
};

type LineageStep = {
  step: string;
  title: string;
  detail: string;
};

const navLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#warehouse", label: "Warehouse" },
  { href: "#rounds", label: "Rounds" },
  { href: "#social", label: "Social" },
  { href: "#majors", label: "Majors" },
  { href: "#quality", label: "Quality" },
];

const years: YearOverview[] = [
  {
    year: 2568,
    applicationChoices: 4853,
    uniqueApplicants: 3597,
    confirmed: 528,
    confirmedRate: 14.68,
    avgScore: 21.7825,
  },
  {
    year: 2569,
    applicationChoices: 4579,
    uniqueApplicants: 3443,
    confirmed: 545,
    confirmedRate: 15.83,
    avgScore: 19.101,
    applicantsChange: -154,
    confirmedChange: 17,
  },
];

const majorPerformance: MajorPerformance[] = [
  {
    year: 2569,
    code: "E38",
    name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน",
    type: "ภาคปกติ",
    applicants: 825,
    confirmed: 63,
    rate: 7.64,
    avgScore: 8.9477,
    applicantChange: -2,
    confirmedChange: 3,
  },
  {
    year: 2569,
    code: "E24",
    name: "วิศวกรรมอุตสาหการ-โลจิสติกส์",
    type: "ภาคปกติ",
    applicants: 684,
    confirmed: 62,
    rate: 9.06,
    avgScore: 11.9987,
    applicantChange: 157,
    confirmedChange: 0,
  },
  {
    year: 2569,
    code: "E29",
    name: "วิศวกรรมคอมพิวเตอร์",
    type: "ภาคปกติ",
    applicants: 680,
    confirmed: 67,
    rate: 9.85,
    avgScore: 13.3404,
    applicantChange: -61,
    confirmedChange: 4,
  },
  {
    year: 2569,
    code: "E04",
    name: "วิศวกรรมโยธา-ชลประทาน",
    type: "ภาคปกติ",
    applicants: 602,
    confirmed: 62,
    rate: 10.3,
    avgScore: 9.4494,
    applicantChange: -148,
    confirmedChange: 2,
  },
  {
    year: 2569,
    code: "E03",
    name: "วิศวกรรมเครื่องกล",
    type: "ภาคปกติ",
    applicants: 543,
    confirmed: 51,
    rate: 9.39,
    avgScore: 11.8395,
    applicantChange: 26,
    confirmedChange: 3,
  },
  {
    year: 2569,
    code: "E38",
    name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน (ภาคพิเศษ)",
    type: "ภาคพิเศษ",
    applicants: 343,
    confirmed: 52,
    rate: 15.16,
    avgScore: 8.5462,
    applicantChange: 8,
    confirmedChange: 0,
  },
  {
    year: 2569,
    code: "E36",
    name: "วิศวกรรมอาหาร",
    type: "ภาคปกติ",
    applicants: 294,
    confirmed: 59,
    rate: 20.07,
    avgScore: 11.2315,
    applicantChange: -19,
    confirmedChange: 2,
  },
  {
    year: 2569,
    code: "E03",
    name: "วิศวกรรมเครื่องกล (ภาคพิเศษ)",
    type: "ภาคพิเศษ",
    applicants: 286,
    confirmed: 34,
    rate: 11.89,
    avgScore: 11.036,
    applicantChange: -7,
    confirmedChange: -1,
  },
  {
    year: 2569,
    code: "E37",
    name: "วิศวกรรมเครื่องกล-เกษตร",
    type: "ภาคปกติ",
    applicants: 214,
    confirmed: 59,
    rate: 27.57,
    avgScore: 7.5748,
    applicantChange: -197,
    confirmedChange: 3,
  },
  {
    year: 2569,
    code: "E39",
    name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม",
    type: "ภาคปกติ",
    applicants: 108,
    confirmed: 36,
    rate: 33.33,
    avgScore: 7.709,
    applicantChange: -31,
    confirmedChange: 1,
  },
];

const statusDistribution: StatusDistribution[] = [
  { year: 2569, label: "ไม่ผ่านการคัดเลือก", choices: 2552, share: 55.73 },
  { year: 2569, label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า", choices: 1191, share: 26.01 },
  { year: 2569, label: "ยืนยันสิทธิ์", choices: 545, share: 11.9 },
  { year: 2569, label: "ยืนยันที่อื่นแล้ว", choices: 210, share: 4.59 },
  { year: 2569, label: "ไม่ใช้สิทธิ์", choices: 30, share: 0.66 },
  { year: 2569, label: "สละสิทธิ์", choices: 26, share: 0.57 },
  { year: 2569, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 18, share: 0.39 },
  { year: 2569, label: "สละสิทธิ์ในรอบ 2", choices: 6, share: 0.13 },
  { year: 2569, label: "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2", choices: 1, share: 0.02 },
];

const majorTypeSummary = [
  {
    year: 2569,
    type: "ภาคปกติ",
    applicants: 3950,
    confirmed: 459,
    rate: 11.62,
    avgScore: 9.9794,
  },
  {
    year: 2569,
    type: "ภาคพิเศษ",
    applicants: 629,
    confirmed: 86,
    rate: 13.67,
    avgScore: 9.6132,
  },
];

const roundPerformance: RoundPerformance[] = [
  { year: 2568, code: "TCAS1", name: "Portfolio", choices: 1385, applicants: 1320, confirmed: 191, rate: 14.47, sourceFiles: 2 },
  { year: 2568, code: "TCAS2", name: "Quota", choices: 519, applicants: 518, confirmed: 112, rate: 21.62, sourceFiles: 2 },
  { year: 2568, code: "TCAS3", name: "Admission", choices: 2711, applicants: 1810, confirmed: 214, rate: 11.82, sourceFiles: 1 },
  { year: 2568, code: "TCAS4", name: "Direct Admission", choices: 238, applicants: 238, confirmed: 11, rate: 4.62, sourceFiles: 1 },
  { year: 2569, code: "TCAS1", name: "Portfolio", choices: 1391, applicants: 1324, confirmed: 163, rate: 12.31, sourceFiles: 1 },
  { year: 2569, code: "TCAS2", name: "Quota", choices: 614, applicants: 614, confirmed: 90, rate: 14.66, sourceFiles: 2 },
  { year: 2569, code: "TCAS3", name: "Admission", choices: 2379, applicants: 1620, confirmed: 283, rate: 17.47, sourceFiles: 1 },
  { year: 2569, code: "TCAS4", name: "Direct Admission", choices: 195, applicants: 195, confirmed: 9, rate: 4.62, sourceFiles: 1 },
];

const socialOverview: SocialOverview[] = [
  {
    year: 2568,
    mentions: 41,
    engagement: 259431,
    engagementPerMention: 6327.59,
    sentimentScore: 0,
  },
  {
    year: 2569,
    mentions: 41,
    engagement: 113465,
    engagementPerMention: 2767.44,
    sentimentScore: 0,
    mentionChange: 0,
    engagementChange: -145966,
  },
];

const platformSummary: PlatformSummary[] = [
  { platform: "YouTube API", mentions: 79, engagement: 372815 },
  { platform: "Facebook public search", mentions: 3, engagement: 81 },
];

const warehouseLayers: WarehouseLayer[] = [
  {
    layer: "Source",
    purpose: "เก็บหลักฐานต้นทาง",
    objects: "Excel, YouTube API, GA4 API, manual Facebook search",
    status: "controlled",
  },
  {
    layer: "Staging",
    purpose: "แปลงเป็น aggregate ที่ไม่มี PII",
    objects: "processed CSV, real_data CSV/JSON",
    status: "repeatable",
  },
  {
    layer: "Core",
    purpose: "star schema สำหรับ query ซ้ำได้",
    objects: "dimensions + admissions/social/website facts",
    status: "loaded",
  },
  {
    layer: "Mart",
    purpose: "presentation-ready BI layer",
    objects: "executive, major conversion, channel effectiveness marts",
    status: "published",
  },
  {
    layer: "Governance",
    purpose: "metadata, lineage, refresh และ quality",
    objects: "dataset catalog, lineage edges, refresh runs",
    status: "auditable",
  },
];

const warehouseMetrics: WarehouseMetric[] = [
  { label: "Fact tables", value: "7", detail: "Admissions year/round/major/status, social, website, quality" },
  { label: "Dimensions", value: "8", detail: "Round, faculty, major, status, platform, keyword, sentiment, web channel" },
  { label: "Presentation marts", value: "4", detail: "TCAS year, TCAS round, major conversion, channel effectiveness" },
  { label: "Governance objects", value: "3", detail: "Catalog, lineage, refresh run log" },
];

const dataMarts: DataMart[] = [
  {
    name: "mart_tcas_year_summary",
    grain: "academic year",
    useCase: "ผู้บริหารดู applicants, choices, confirmed และ conversion ครบทุก TCAS round",
  },
  {
    name: "mart_tcas_round_summary",
    grain: "academic year + TCAS round",
    useCase: "เปรียบเทียบ performance ของ Portfolio, Quota, Admission และ Direct Admission",
  },
  {
    name: "mart_major_round_conversion",
    grain: "academic year + TCAS round + major",
    useCase: "จัดอันดับ demand และ conversion ของแต่ละสาขาแยกตามรอบรับสมัคร",
  },
  {
    name: "mart_channel_effectiveness",
    grain: "academic year + channel",
    useCase: "เปรียบเทียบ social platform กับ website channel",
  },
];

const lineageSteps: LineageStep[] = [
  { step: "01", title: "Extract", detail: "Excel/API/manual public search" },
  { step: "02", title: "Clean", detail: "PII removed, aggregates created" },
  { step: "03", title: "Load", detail: "idempotent upsert into Neon" },
  { step: "04", title: "Model", detail: "star schema dimensions and facts" },
  { step: "05", title: "Publish", detail: "marts, quality views and dashboard" },
];

const maxApplicants = Math.max(...majorPerformance.map((major) => major.applicants));
const maxConfirmed = Math.max(...majorPerformance.map((major) => major.confirmed));
const maxPlatformMentions = Math.max(...platformSummary.map((platform) => platform.mentions));

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSigned(value?: number) {
  if (value === undefined) {
    return "baseline";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
}

function changeClass(value?: number) {
  if (value === undefined || value === 0) {
    return "neutral";
  }
  return value > 0 ? "positive" : "negative";
}

export default function Home() {
  const latest = years[1];
  const previous = years[0];
  const latestSocial = socialOverview[1];

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <a className="nav-brand" href="#overview" aria-label="Go to dashboard overview">
          <span>TCAS DW</span>
          <small>Engineering Admissions</small>
        </a>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-status" aria-label="Warehouse status">
          <span />
          Live DW
        </div>
      </nav>

      <section id="overview" className="dashboard-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Engineering Admissions Analytics</p>
          <h1 id="dashboard-title">TCAS Admissions Data Warehouse</h1>
          <p className="header-copy">
            ภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน ครบ TCAS รอบ 1-4
            ปี 2568 และ 2569 ผ่าน ETL เข้า Neon PostgreSQL, dimensional facts,
            governed marts และ dashboard
          </p>
        </div>
        <div className="header-status" aria-label="Data pipeline status">
          <span>Source</span>
          <span>Staging</span>
          <span>Core DW</span>
          <span>Marts</span>
          <span>Dashboard</span>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Key admissions metrics">
        <article className="kpi-card">
          <span className="kpi-label">Unique applicants 2569</span>
          <strong>{formatNumber(latest.uniqueApplicants)}</strong>
          <span className={changeClass(latest.applicantsChange)}>
            {formatSigned(latest.applicantsChange)} vs 2568
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Confirmed applicants 2569</span>
          <strong>{formatNumber(latest.confirmed)}</strong>
          <span className={changeClass(latest.confirmedChange)}>
            {formatSigned(latest.confirmedChange)} vs 2568
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Confirmed rate 2569</span>
          <strong>{latest.confirmedRate.toFixed(2)}%</strong>
          <span className="positive">
            +{(latest.confirmedRate - previous.confirmedRate).toFixed(2)} pts
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Application choices 2569</span>
          <strong>{formatNumber(latest.applicationChoices)}</strong>
          <span className="negative">-274 vs 2568</span>
        </article>
        <article className="kpi-card social-kpi">
          <span className="kpi-label">Social mentions 2569</span>
          <strong>{formatNumber(latestSocial.mentions)}</strong>
          <span className={changeClass(latestSocial.mentionChange)}>
            {formatSigned(latestSocial.mentionChange)} vs 2568
          </span>
        </article>
        <article className="kpi-card social-kpi">
          <span className="kpi-label">Social engagement 2569</span>
          <strong>{formatNumber(latestSocial.engagement)}</strong>
          <span className={changeClass(latestSocial.engagementChange)}>
            {formatSigned(latestSocial.engagementChange)} vs 2568
          </span>
        </article>
      </section>

      <section id="warehouse" className="warehouse-section" aria-label="Data warehouse architecture">
        <article className="panel warehouse-map">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Data warehouse architecture</p>
              <h2>Layered warehouse model</h2>
            </div>
            <span className="pill">governed DW</span>
          </div>
          <div className="layer-flow">
            {warehouseLayers.map((layer) => (
              <div className="layer-card" key={layer.layer}>
                <div>
                  <strong>{layer.layer}</strong>
                  <span>{layer.status}</span>
                </div>
                <p>{layer.purpose}</p>
                <small>{layer.objects}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Warehouse inventory</p>
              <h2>Objects พร้อมสำหรับ BI</h2>
            </div>
          </div>
          <div className="warehouse-metrics">
            {warehouseMetrics.map((metric) => (
              <div className="warehouse-metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid mart-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Presentation marts</p>
              <h2>SQL marts สำหรับ Dashboard</h2>
            </div>
          </div>
          <div className="mart-list">
            {dataMarts.map((mart) => (
              <div className="mart-row" key={mart.name}>
                <code>{mart.name}</code>
                <span>{mart.grain}</span>
                <p>{mart.useCase}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Lineage</p>
              <h2>ตรวจสอบเส้นทางข้อมูล</h2>
            </div>
          </div>
          <div className="lineage-list">
            {lineageSteps.map((item) => (
              <div className="lineage-step" key={item.step}>
                <span>{item.step}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel year-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Year comparison</p>
              <h2>ภาพรวมทุก TCAS rounds ปี 2568 เทียบ 2569</h2>
            </div>
            <span className="subtle-label">fact_admission_year_overview</span>
          </div>
          <div className="year-bars">
            {years.map((year) => (
              <div className="year-row" key={year.year}>
                <div className="year-label">
                  <strong>{year.year}</strong>
                  <span>{formatNumber(year.uniqueApplicants)} applicants</span>
                </div>
                <div className="bar-track" aria-label={`Applicants ${year.year}`}>
                  <span
                    className="bar-fill applicants"
                    style={{
                      width: `${(year.uniqueApplicants / previous.uniqueApplicants) * 100}%`,
                    }}
                  />
                </div>
                <div className="year-rate">{year.confirmedRate.toFixed(2)}%</div>
              </div>
            ))}
          </div>
          <p className="panel-note">
            ปี 2569 มีผู้สมัครไม่ซ้ำข้ามทุก round ลดลง 154 คน แต่ผู้ยืนยันสิทธิ์
            เพิ่มขึ้น 17 คน เมื่อเทียบกับปี 2568
          </p>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Major type</p>
              <h2>ภาคปกติ vs ภาคพิเศษ</h2>
            </div>
          </div>
          <div className="type-grid">
            {majorTypeSummary.map((item) => (
              <div className="type-card" key={item.type}>
                <span>{item.type}</span>
                <strong>{formatNumber(item.applicants)}</strong>
                <small>{item.rate.toFixed(2)}% confirmed rate</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="rounds" className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Round grain fact</p>
            <h2>TCAS รอบ 1-4 ที่โหลดเข้า warehouse</h2>
          </div>
          <span className="subtle-label">fact_admission_round_overview</span>
        </div>
        <div className="round-list">
          {roundPerformance.map((round) => (
            <article className="round-row" key={`${round.year}-${round.code}`}>
              <div>
                <strong>{round.code}</strong>
                <span>{round.year} · {round.name}</span>
              </div>
              <div className="metric-stack">
                <span>{formatNumber(round.choices)}</span>
                <small>choices</small>
              </div>
              <div className="metric-stack">
                <span>{formatNumber(round.applicants)}</span>
                <small>unique applicants</small>
              </div>
              <div className="metric-stack">
                <span>{formatNumber(round.confirmed)}</span>
                <small>confirmed</small>
              </div>
              <div className="metric-stack rate">
                <span>{round.rate.toFixed(2)}%</span>
                <small>rate</small>
              </div>
              <div className="metric-stack">
                <span>{round.sourceFiles}</span>
                <small>files</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="social" className="content-grid social-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Social impact</p>
              <h2>Social Media vs Admissions</h2>
            </div>
            <span className="pill">real sources only</span>
          </div>
          <div className="impact-grid">
            {socialOverview.map((item) => (
              <div className="impact-card" key={item.year}>
                <span>{item.year}</span>
                <strong>{formatNumber(item.mentions)}</strong>
                <small>mentions · {formatNumber(item.engagement)} engagement</small>
                <div className="impact-meter">
                  <span
                    style={{
                      width: `${(item.mentions / latestSocial.mentions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="panel-note">
            ส่วนนี้แสดงเฉพาะ YouTube API และ Facebook public search
            ที่มีหลักฐานไฟล์ต้นทางใน outputs/real_data
          </p>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Platform mix</p>
              <h2>ช่องทางที่สร้างกระแส</h2>
            </div>
            <span className="pill">verified</span>
          </div>
          <div className="platform-list">
            {platformSummary.map((platform) => (
              <div className="platform-row" key={platform.platform}>
                <div>
                  <strong>{platform.platform}</strong>
                  <span>{formatNumber(platform.engagement)} engagement</span>
                </div>
                <div className="platform-bar">
                  <span style={{ width: `${(platform.mentions / maxPlatformMentions) * 100}%` }} />
                </div>
                <b>{formatNumber(platform.mentions)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="majors" className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Major ranking</p>
            <h2>Top majors ปี 2569 จากทุก TCAS rounds</h2>
          </div>
          <span className="subtle-label">sorted by unique applicants</span>
        </div>
        <div className="ranking-list">
          {majorPerformance.map((major, index) => (
            <article className="ranking-row" key={`${major.code}-${major.name}-${major.type}`}>
              <div className="rank-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="major-name">
                <strong>{major.name}</strong>
                <span>
                  {major.code} · {major.type}
                </span>
              </div>
              <div className="metric-stack">
                <span>{formatNumber(major.applicants)}</span>
                <small>applicants</small>
              </div>
              <div className="mini-bars" aria-label={`${major.name} applicant and confirmed bars`}>
                <span
                  className="mini-bar applicants"
                  style={{ width: `${(major.applicants / maxApplicants) * 100}%` }}
                />
                <span
                  className="mini-bar confirmed"
                  style={{ width: `${(major.confirmed / maxConfirmed) * 100}%` }}
                />
              </div>
              <div className="metric-stack">
                <span>{formatNumber(major.confirmed)}</span>
                <small>confirmed</small>
              </div>
              <div className="metric-stack rate">
                <span>{major.rate.toFixed(2)}%</span>
                <small>rate</small>
              </div>
              <div className={`change-badge ${changeClass(major.applicantChange)}`}>
                {formatSigned(major.applicantChange)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="quality" className="content-grid lower-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Status distribution</p>
              <h2>สถานะ TCAS ปี 2569 ทุก round</h2>
            </div>
          </div>
          <div className="status-list">
            {statusDistribution.map((status) => (
              <div className="status-row" key={status.label}>
                <div>
                  <strong>{status.label}</strong>
                  <span>{formatNumber(status.choices)} choices</span>
                </div>
                <div className="status-bar">
                  <span style={{ width: `${status.share}%` }} />
                </div>
                <b>{status.share.toFixed(2)}%</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Data quality</p>
              <h2>พร้อมใช้งานสำหรับ BI</h2>
            </div>
          </div>
          <dl className="quality-list">
            <div>
              <dt>Source rows</dt>
              <dd>9,432</dd>
            </div>
            <div>
              <dt>Missing score</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Missing major</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>PII exported</dt>
              <dd>0 columns</dd>
            </div>
            <div>
              <dt>Displayed social rows</dt>
              <dd>34</dd>
            </div>
            <div>
              <dt>Displayed platforms</dt>
              <dd>2</dd>
            </div>
            <div>
              <dt>Catalog rows</dt>
              <dd>8</dd>
            </div>
            <div>
              <dt>Lineage edges</dt>
              <dd>8</dd>
            </div>
          </dl>
          <p>
            ข้อมูลส่วนบุคคลถูกใช้เฉพาะตอนนับ unique applicants แล้วไม่ถูกส่งออกมาใน
            processed CSV หรือ dashboard นี้ ตอนนี้ admissions warehouse โหลดครบ 11 Excel source files
            ครอบคลุม TCAS รอบ 1-4 ของปี 2568 และ 2569
          </p>
        </article>
      </section>
    </main>
  );
}
