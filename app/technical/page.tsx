import { SidebarNavigation } from "../sidebar-navigation";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function TechnicalPage() {
  const snapshot = await loadDashboardSnapshot();
  const { warehouseHealth, warehouseSnapshot } = snapshot;

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/technical" />

      <section className="workspace" data-page="Technical">
        <div className="page-transition" key="Technical">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Technical Architecture</p>
              <h1>Project Technical Overview</h1>
              <p>อธิบายเส้นทางข้อมูลตั้งแต่ Excel ผ่าน ETL, privacy boundary, dimensional warehouse และ governed marts จนเป็น Dashboard พร้อม production runtime, quality gates และหลักฐานที่ตรวจสอบย้อนกลับได้</p>
            </div>
          </section>

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
                  ["03", "PII-safe staging", "Privacy boundary", "คง grain ระดับตัวเลือกสมัครด้วย HMAC token โดยไม่ส่งชื่อ เลขประจำตัว โทรศัพท์ หรืออีเมลออกจาก source"],
                  ["04", "Neon PostgreSQL", "Warehouse storage", "รวมข้อมูลใน schema admissions_dw เพื่อ query, audit และรันซ้ำได้"],
                  ["05", "Single Fact + Dimension", "Core model", "fact_admission เชื่อมทุก dimension และเก็บ score ที่ grain หนึ่งตัวเลือกสมัคร"],
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
                  ["03", "Warehouse", "Governed dimensional model", ["fact_admission", "Conformed dimensions", "Quality & lineage"]],
                  ["02", "Integration", "Clean and privacy-safe data", ["ETL", "Normalized staging", "PII boundary"]],
                  ["01", "Source", "Owned raw evidence", ["Admissions Excel 2567-2569", "16 governed workbooks"]],
                ] as const).map(([level, title, description, items]) => (
                  <li className={`technical-hierarchy-level level-${level}`} key={level}>
                    <span className="technical-hierarchy-number">L{level}</span>
                    <div className="technical-hierarchy-copy">
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </div>
                    <div className="technical-hierarchy-items">
                      {items.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
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
                    <span key={number}>
                      <b>{number}</b>
                      {label}
                    </span>
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
                <div>
                  <dt>Source rows</dt>
                  <dd>{formatNumber(warehouseSnapshot.sourceRows)}</dd>
                </div>
                <div>
                  <dt>Source files</dt>
                  <dd>{warehouseSnapshot.sourceFiles}</dd>
                </div>
                <div>
                  <dt>PII exported</dt>
                  <dd>{warehouseSnapshot.piiExportedColumns}</dd>
                </div>
                <div>
                  <dt>Lineage edges</dt>
                  <dd>{warehouseSnapshot.lineageEdges}</dd>
                </div>
              </dl>
            </article>

            <article className="panel technical-topics-panel">
              <div className="panel-title">
                <h2>Technical Talking Points</h2>
                <span className="mini-pill">presentation ready</span>
              </div>
              <div className="technical-topic-list">
                {[
                  ["ETL & Privacy", "ใช้ applicant identifier เฉพาะใน memory เพื่อสร้าง HMAC token แล้วตัด direct identity/contact fields ก่อน export"],
                  ["Star Schema & Grain", "fact_admission ตารางเดียวเก็บหนึ่งตัวเลือกสมัครพร้อม score และ foreign key ของทุก dimension"],
                  ["Marts & Query Contract", "Dashboard ใช้ metric ที่นิยามจาก mart/view เดียวกัน จึงไม่คำนวณซ้ำใน UI"],
                  ["Quality & Lineage", "ตรวจ missing values, source coverage, PII boundary และ trace จาก Dashboard กลับถึง source"],
                  ["Repeatable Delivery", "Load แบบ upsert และทดสอบ data build, validation, static-data policy และ rendered output ก่อน publish"],
                ].map(([title, copy], index) => (
                  <section key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
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
