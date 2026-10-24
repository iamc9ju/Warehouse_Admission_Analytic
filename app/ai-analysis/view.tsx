"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SparklesIcon, ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { SidebarNavigation } from "../sidebar-navigation";
import { DEFINITIONS, PROMPT_VERSION, RULES, SECTION_TITLES, type AnalysisState, type Fact, type Scope } from "./report-types";
import styles from "./view.module.css";
import { STATUS_COLUMNS, statusMetrics } from "./status-metrics";

const number = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const date = (s: string) => new Date(s).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

function FactTable({ facts }: { facts: Fact[] }) {
  return <div className={styles.tableWrap}><table className={styles.table}>
    <caption>คนไม่ซ้ำต่อสถานะตาม Dashboard คนเดียวอาจมีหลายสถานะ ห้ามบวกทุกสถานะเป็นยอดรวม · — หมายถึงรายงานเก่ายังไม่มีข้อมูล</caption>
    <thead><tr><th>ปี / กลุ่ม</th><th>ผู้สมัคร</th><th>ผู้มีสิทธิ์</th><th>ยืนยันสิทธิ์</th>{STATUS_COLUMNS.map(([key,label]) => <th key={key}>{label}</th>)}<th>อัตรายืนยัน / ผู้มีสิทธิ์</th></tr></thead>
    <tbody>{facts.map(f => {const counts = statusMetrics(f); return <tr key={f.id}><th scope="row">{f.year} · {f.name}{f.grain === "major" ? ` (${f.programType})` : ""}</th><td>{number(f.applicants)}</td><td>{number(f.eligible)}</td><td>{number(f.confirmed)}</td>{STATUS_COLUMNS.map(([key]) => <td key={key}>{counts[key] === undefined ? "—" : number(counts[key])}</td>)}<td>{f.eligibleRate === null ? "ไม่มีฐานคำนวณ" : `${number(f.eligibleRate)}%`}</td></tr>;})}</tbody>
  </table></div>;
}

function StatusTables({ facts }: { facts: Fact[] }) {
  const rows = facts.filter(f => f.statuses);
  if (!rows.length) return <p className={styles.hint}>ฉบับนี้ยังไม่มีรายละเอียดสถานะ กดสร้างบทวิเคราะห์ใหม่เพื่อเพิ่มข้อมูล</p>;
  return <>
    <h3>สถานะผู้สมัครตามวิธีนับเดียวกับ Dashboard</h3>
    <FactTable facts={rows} />
    <details className={styles.evidence}><summary>ดูทุกสถานะจริงและจำนวนตัวเลือกสมัคร</summary><div className={styles.tableWrap}><table className={styles.table}><caption>คนไม่ซ้ำต่อสถานะ สถานะอาจซ้อนกันได้ สัดส่วนใช้ผู้สมัครของกลุ่มเป็นตัวหาร ห้ามบวกจำนวนคนทุกสถานะเป็นยอดรวม</caption><thead><tr><th>ปี / กลุ่ม</th><th>สถานะ</th><th>คน</th><th>ตัวเลือกสมัคร</th><th>ต่อผู้สมัคร</th></tr></thead><tbody>{rows.flatMap(f => f.statuses!.map(s => <tr key={`${f.id}:${s.label}`}><th scope="row">{f.year} · {f.name}{f.grain === "major" ? ` (${f.programType})` : ""}</th><td>{s.label}</td><td>{number(s.applicants)}</td><td>{number(s.choices)}</td><td>{f.applicants ? `${number(s.applicants * 100 / f.applicants)}%` : "ไม่มีฐานคำนวณ"}</td></tr>))}</tbody></table></div></details>
  </>;
}

function YearSummaries({ section, facts }: {section: NonNullable<AnalysisState["report"]>["content"]["sections"][number]; facts: Fact[]}) {
  if (section.title === SECTION_TITLES[0] || !section.yearSummaries) return null;
  return <div className={styles.yearSummaries}>{[...section.yearSummaries].sort((a,b) => a.year-b.year).map(summary => <section key={summary.year}>
    <h3>ปี {summary.year}</h3><p>{summary.observation}</p>
    <details className={styles.evidence}><summary>ดูหลักฐานปี {summary.year}</summary><FactTable facts={facts.filter(f => summary.evidenceIds.includes(f.id))} /></details>
  </section>)}</div>;
}

export function AnalysisView() {
  const [state, setState] = useState<AnalysisState>();
  const [scope, setScope] = useState<Scope>();
  const [reading, setReading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const requestCounter = useRef(0);
  const scopeRef = useRef<Scope | undefined>(undefined);
  const mounted = useRef(true);

  const load = useCallback(async (selected?: Scope, reportId?: string, quiet = false) => {
    const request = ++requestCounter.current;
    if (!quiet) { setReading(true); setError(""); }
    try {
      const query = new URLSearchParams();
      if (selected) { query.set("startYear", String(selected.startYear)); query.set("endYear", String(selected.endYear)); }
      if (reportId) query.set("reportId", reportId);
      const response = await fetch(`/api/ai-analysis?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "อ่านรายงานไม่สำเร็จ");
      if (mounted.current && request === requestCounter.current) {
        setState(body); setScope(body.scope); scopeRef.current = body.scope;
      }
    } catch (err) {
      if (mounted.current && request === requestCounter.current) setError(err instanceof Error ? err.message : "เชื่อมต่อไม่ได้");
    } finally { if (mounted.current && request === requestCounter.current) setReading(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let saved: Scope | undefined;
    try {
      const value = JSON.parse(localStorage.getItem("tcas_ai_report_scope") || "null");
      if (Number.isInteger(value?.startYear) && Number.isInteger(value?.endYear)) saved = value;
      // Remove the old chatbot's browser key. New reports use a server-side key only.
      localStorage.removeItem("tcas_gemini_api_key");
    } catch { /* Browser storage can be unavailable. */ }
    const initialRead = setTimeout(() => { void load(saved); }, 0);
    return () => { mounted.current = false; clearTimeout(initialRead); };
  }, [load]);

  useEffect(() => {
    if (!state?.generating) return;
    const interval = setInterval(() => { if (!document.hidden) void load(scopeRef.current, undefined, true); }, 5000);
    return () => clearInterval(interval);
  }, [state?.generating, load]);

  // Opening the page or returning to the tab only reads saved reports; never generates one.
  useEffect(() => {
    const refresh = () => { if (!document.hidden) void load(scopeRef.current, undefined, true); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);

  function changeScope(next: Scope) {
    setScope(next); scopeRef.current = next;
    try { localStorage.setItem("tcas_ai_report_scope", JSON.stringify(next)); } catch { /* optional */ }
    void load(next);
  }

  async function generate() {
    if (!scope || reading || generating || state?.generating) return;
    setGenerating(true); setError("");
    try {
      const response = await fetch("/api/ai-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scope) });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 409) await load(scope, undefined, true);
        throw new Error(body.error || "สร้างบทวิเคราะห์ไม่สำเร็จ");
      }
      if (mounted.current) await load(scope, body.report.id, true);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "เชื่อมต่อไม่ได้ รายงานเดิมยังอยู่");
    } finally { if (mounted.current) setGenerating(false); }
  }

  const report = state?.report;
  const visibleSections = report?.content.sections.filter(section => SECTION_TITLES.some(title => title === section.title)) ?? [];
  const busy = generating || Boolean(state?.generating);
  const stale = report && (report.input.fingerprint !== state?.currentFingerprint || report.promptVersion !== PROMPT_VERSION);
  const wrongScope = state && scope && (scope.startYear !== state.scope.startYear || scope.endYear !== state.scope.endYear);

  return <main className="app-frame">
    <SidebarNavigation activeHref="/ai-analysis" />
    <section className="workspace" data-page="AI Analysis"><div className="page-transition">
      <section className="hero-panel"><div><p className="eyebrow">Admissions intelligence · Gemini</p><h1>AI Analysis</h1><p>สรุปสถานการณ์รับสมัคร พร้อมหลักฐานและแนวทางดำเนินการเบื้องต้น</p></div></section>
      <section className={`panel ${styles.toolbar}`} aria-label="ขอบเขตบทวิเคราะห์">
        <div className={styles.filters}>
          <label>ตั้งแต่ปี<select aria-label="ปีเริ่มต้น" value={scope?.startYear ?? ""} disabled={!state || busy || reading} onChange={e => changeScope({ startYear: Number(e.target.value), endYear: Math.max(Number(e.target.value), scope!.endYear) })}>{!state && <option value="">กำลังอ่านข้อมูล</option>}{state?.availableYears.map(y => <option key={y}>{y}</option>)}</select></label>
          <label>ถึงปี<select aria-label="ปีสิ้นสุด" value={scope?.endYear ?? ""} disabled={!state || busy || reading} onChange={e => changeScope({ startYear: Math.min(scope!.startYear, Number(e.target.value)), endYear: Number(e.target.value) })}>{!state && <option value="">กำลังอ่านข้อมูล</option>}{state?.availableYears.map(y => <option key={y}>{y}</option>)}</select></label>
        </div>
        <div className={styles.buttons}><button type="button" className={styles.secondary} disabled={reading || generating} onClick={() => void load(scope)}><ArrowPathIcon aria-hidden="true" />ตรวจข้อมูลล่าสุด</button><button type="button" className={styles.primary} disabled={!state?.configured || reading || busy || wrongScope} onClick={() => void generate()}><SparklesIcon aria-hidden="true" />{busy ? "กำลังสร้างบทวิเคราะห์…" : report ? "สร้างบทวิเคราะห์ใหม่" : "สร้างบทวิเคราะห์"}</button></div>
      </section>
      <div aria-live="polite">
        {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => void load(scope)}>ลองอ่านข้อมูลอีกครั้ง</button></div>}
        {state && !state.configured && <p className={styles.banner}>ยังไม่ได้ตั้งค่า Gemini ฝั่งเซิร์ฟเวอร์ อ่านรายงานเดิมได้ แต่ยังสร้างใหม่ไม่ได้</p>}
        {busy && <p className={styles.banner} role="status">กำลังให้ Gemini สร้างรายงาน คุณเปลี่ยนหน้าแล้วกลับมาอ่านได้ ระบบจะบันทึกเมื่อสร้างสำเร็จ รายงานเดิมยังอยู่</p>}
        {stale && <p className={styles.banner}>รายงานนี้ใช้ข้อมูลหรือรูปแบบเดิม กดสร้างบทวิเคราะห์ใหม่เพื่อใช้อัตรายืนยันต่อผู้มีสิทธิ์และสรุปแยกครบตามช่วงปีที่เลือก</p>}
        {reading && <p className={styles.hint} role="status">กำลังอ่านรายงานที่บันทึกไว้…</p>}
      </div>
      {state && !wrongScope && <>
        <div className={styles.meta}><span>ข้อมูลในคลังโหลดล่าสุด {date(state.currentDataLoadedAt)}</span><span>สร้างใหม่เมื่อกดปุ่มเท่านั้น · ส่งเฉพาะข้อมูลสรุปให้ Gemini</span></div>
        {report ? <>
          <section className={styles.reportHeader}><div><p className="eyebrow">Saved analysis</p><h2>สถานการณ์รับสมัคร ปี {report.input.scope.startYear}{report.input.scope.endYear !== report.input.scope.startYear ? `–${report.input.scope.endYear}` : ""}</h2><p className={styles.hint}>สร้าง {date(report.createdAt)} · {report.model} · {report.input.baselineYear ? `ฉบับเก่า: มีข้อมูลนอกช่วงปี ${report.input.baselineYear}` : "ใช้เฉพาะช่วงปีที่เลือก"}</p></div>
          <label className={styles.history}>ฉบับที่บันทึกไว้<select aria-label="เลือกฉบับรายงาน" value={report.id} disabled={reading || busy} onChange={e => void load(scope, e.target.value)}>{state.history.map((h,i) => <option key={h.id} value={h.id}>{date(h.createdAt)}{i === 0 ? " · ล่าสุด" : ""}</option>)}{!state.history.some(h => h.id === report.id) && <option value={report.id}>{date(report.createdAt)}</option>}</select></label></section>
          <section className={`panel ${styles.reference}`}><h2>ตัวเลขหลักของช่วงปีที่วิเคราะห์</h2><FactTable facts={report.input.facts.filter(f => f.grain === "year" && f.year >= report.input.scope.startYear)} /></section>
          <div className={styles.reportGrid}><nav className={`panel ${styles.contents}`} aria-label="หัวข้อรายงาน"><p className="eyebrow">ในรายงานฉบับนี้</p>{visibleSections.map((s,i) => <a key={s.title} href={`#analysis-section-${i}`}>{i+1}. {s.title}</a>)}</nav>
          <div className={styles.sections}>{visibleSections.map((section,i) => <article id={`analysis-section-${i}`} className={`panel ${styles.section}`} key={section.title}><p className="eyebrow">{String(i+1).padStart(2,"0")} / ANALYSIS</p><h2>{section.title}</h2><YearSummaries section={section} facts={report.input.facts} />{section.title === "การใช้สิทธิ์และสถานะที่ควรติดตาม" && <StatusTables facts={report.input.facts.filter(f => f.grain === "year")} />}{section.items.map((item,j) => <div className={styles.finding} key={j}><h3>ข้อค้นพบ</h3><p>{item.observation}</p><div className={styles.interpretation}><h3>การตีความ / ข้อสันนิษฐาน</h3><p>{item.interpretation}</p></div><h3>สิ่งที่ควรดำเนินการ / ตรวจเพิ่ม</h3><p>{item.recommendation}</p>{item.evidenceIds.length > 0 && <details className={styles.evidence}><summary>ดูตัวเลขอ้างอิง ({item.evidenceIds.length} รายการ)</summary><FactTable facts={report.input.facts.filter(f => item.evidenceIds.includes(f.id))} /><StatusTables facts={report.input.facts.filter(f => item.evidenceIds.includes(f.id))} /></details>}</div>)}</article>)}</div></div>
          <details className={`panel ${styles.reference}`}><summary>ข้อมูลสรุปและสัญญาณที่ใช้สร้างฉบับนี้</summary><FactTable facts={report.input.facts} /><p>{report.input.rules.description}</p>{report.input.signals.map((s,i) => <p key={i}>{s.year} · {s.name} · {s.kind === "watch" ? "ควรติดตาม" : "เชิงบวก"}: {s.reason}{s.applicantChangePct !== undefined ? ` · ผู้สมัคร ${s.applicantChangePct}%${s.rateChangePp === undefined ? "" : ` · อัตรายืนยันต่อผู้มีสิทธิ์ ${s.rateChangePp} จุดเปอร์เซ็นต์`}` : ""}</p>)}</details>
        </> : !reading && <section className={`panel ${styles.empty}`}><DocumentTextIcon aria-hidden="true" /><h2>ยังไม่มีบทวิเคราะห์สำหรับช่วงปีนี้</h2><p>สร้างรายงาน 7 หัวข้อจากข้อมูลจริง แล้วกลับมาอ่านได้ทุกเมื่อ</p><div className={styles.outline}>{SECTION_TITLES.map((t,i) => <span key={t}>{i+1}. {t}</span>)}</div></section>}
      </>}
      <details className={`panel ${styles.reference}`}><summary>นิยามการนับและเกณฑ์วิเคราะห์{report ? "ที่ใช้ในรายงานฉบับนี้" : ""}</summary>{Object.entries(report?.input.definitions ?? DEFINITIONS).map(([key,text]) => <p key={key}>{text}</p>)}<p>{(report?.input.rules ?? RULES).description}</p></details>
      <p className={styles.hint}>บทวิเคราะห์สร้างโดย AI ควรตรวจทานตัวเลขและข้อเสนอแนะก่อนใช้ตัดสินใจ เกณฑ์เฝ้าติดตามเป็นเกณฑ์เบื้องต้น ไม่ใช่การยืนยันสาเหตุหรือความมีนัยสำคัญทางสถิติ</p>
    </div></section>
  </main>;
}
