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

const years: YearOverview[] = [
  {
    year: 2568,
    applicationChoices: 2711,
    uniqueApplicants: 1810,
    confirmed: 214,
    confirmedRate: 11.82,
    avgScore: 38.9932,
  },
  {
    year: 2569,
    applicationChoices: 2379,
    uniqueApplicants: 1620,
    confirmed: 283,
    confirmedRate: 17.47,
    avgScore: 36.7647,
    applicantsChange: -190,
    confirmedChange: 69,
  },
];

const majorPerformance: MajorPerformance[] = [
  {
    year: 2569,
    code: "E24",
    name: "วิศวกรรมอุตสาหการ-โลจิสติกส์",
    type: "ภาคปกติ",
    applicants: 400,
    confirmed: 22,
    rate: 5.5,
    avgScore: 35.9961,
    applicantChange: 139,
    confirmedChange: 2,
  },
  {
    year: 2569,
    code: "E03",
    name: "วิศวกรรมเครื่องกล",
    type: "ภาคปกติ",
    applicants: 357,
    confirmed: 34,
    rate: 9.52,
    avgScore: 35.5185,
    applicantChange: -1,
    confirmedChange: 9,
  },
  {
    year: 2569,
    code: "E29",
    name: "วิศวกรรมคอมพิวเตอร์",
    type: "ภาคปกติ",
    applicants: 333,
    confirmed: 48,
    rate: 14.41,
    avgScore: 40.0213,
    applicantChange: -51,
    confirmedChange: 20,
  },
  {
    year: 2569,
    code: "E38",
    name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน",
    type: "ภาคปกติ",
    applicants: 331,
    confirmed: 37,
    rate: 11.18,
    avgScore: 35.7908,
    applicantChange: 23,
    confirmedChange: 18,
  },
  {
    year: 2569,
    code: "E04",
    name: "วิศวกรรมโยธา-ชลประทาน",
    type: "ภาคปกติ",
    applicants: 243,
    confirmed: 19,
    rate: 7.82,
    avgScore: 47.2472,
    applicantChange: -136,
    confirmedChange: -1,
  },
  {
    year: 2569,
    code: "E38",
    name: "วิศวกรรมโยธา-โครงสร้างพื้นฐาน",
    type: "ภาคพิเศษ",
    applicants: 219,
    confirmed: 22,
    rate: 10.05,
    avgScore: 34.1846,
    applicantChange: 8,
    confirmedChange: 0,
  },
  {
    year: 2569,
    code: "E03",
    name: "วิศวกรรมเครื่องกล",
    type: "ภาคพิเศษ",
    applicants: 214,
    confirmed: 25,
    rate: 11.68,
    avgScore: 33.1081,
    applicantChange: -12,
    confirmedChange: 3,
  },
  {
    year: 2569,
    code: "E36",
    name: "วิศวกรรมอาหาร",
    type: "ภาคปกติ",
    applicants: 174,
    confirmed: 31,
    rate: 17.82,
    avgScore: 33.6946,
    applicantChange: -30,
    confirmedChange: 8,
  },
  {
    year: 2569,
    code: "E37",
    name: "วิศวกรรมเครื่องกล-เกษตร",
    type: "ภาคปกติ",
    applicants: 65,
    confirmed: 28,
    rate: 43.08,
    avgScore: 30.2993,
    applicantChange: -241,
    confirmedChange: 5,
  },
  {
    year: 2569,
    code: "E39",
    name: "วิศวกรรมนวัตกรรมเพื่อการเกษตรและอุตสาหกรรม",
    type: "ภาคปกติ",
    applicants: 43,
    confirmed: 17,
    rate: 39.53,
    avgScore: 30.836,
    applicantChange: -31,
    confirmedChange: 5,
  },
];

const statusDistribution: StatusDistribution[] = [
  {
    year: 2569,
    label: "ผ่านการคัดเลือกในลำดับที่ดีกว่า",
    choices: 1191,
    share: 50.06,
  },
  { year: 2569, label: "ไม่ผ่านการคัดเลือก", choices: 870, share: 36.57 },
  { year: 2569, label: "ยืนยันสิทธิ์", choices: 283, share: 11.9 },
  { year: 2569, label: "สละสิทธิ์", choices: 26, share: 1.09 },
  { year: 2569, label: "ไม่ใช้สิทธิ์", choices: 5, share: 0.21 },
  { year: 2569, label: "ไม่เข้าระบบมาดำเนินการใดๆ", choices: 3, share: 0.13 },
];

const majorTypeSummary = [
  {
    year: 2569,
    type: "ภาคปกติ",
    applicants: 1946,
    confirmed: 236,
    rate: 12.13,
    avgScore: 36.1755,
  },
  {
    year: 2569,
    type: "ภาคพิเศษ",
    applicants: 433,
    confirmed: 47,
    rate: 10.85,
    avgScore: 33.6464,
  },
];

const maxApplicants = Math.max(...majorPerformance.map((major) => major.applicants));
const maxConfirmed = Math.max(...majorPerformance.map((major) => major.confirmed));

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

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Engineering Admissions Analytics</p>
          <h1 id="dashboard-title">TCAS รอบ 3 Admissions Dashboard</h1>
          <p className="header-copy">
            ภาพรวมข้อมูลรับสมัครคณะวิศวกรรมศาสตร์ กำแพงแสน จาก Excel ปี 2568 และ
            2569 ผ่าน ETL เข้า Neon PostgreSQL และสรุปผลเป็น analytics views
          </p>
        </div>
        <div className="header-status" aria-label="Data pipeline status">
          <span>Excel</span>
          <span>ETL</span>
          <span>Neon</span>
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
          <span className="negative">-332 vs 2568</span>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel year-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Year comparison</p>
              <h2>ภาพรวมปี 2568 เทียบ 2569</h2>
            </div>
            <span className="pill">TCAS3</span>
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
            ผู้สมัครไม่ซ้ำลดลง 190 คน แต่ผู้ยืนยันสิทธิ์เพิ่มขึ้น 69 คน ทำให้
            confirmed rate ดีขึ้นอย่างชัดเจน
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

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Major ranking</p>
            <h2>Top majors ปี 2569</h2>
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

      <section className="content-grid lower-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Status distribution</p>
              <h2>สถานะ TCAS ปี 2569</h2>
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
              <dd>5,090</dd>
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
          </dl>
          <p>
            ข้อมูลส่วนบุคคลถูกใช้เฉพาะตอนนับ unique applicants แล้วไม่ถูกส่งออกมาใน
            processed CSV หรือ dashboard นี้
          </p>
        </article>
      </section>
    </main>
  );
}
