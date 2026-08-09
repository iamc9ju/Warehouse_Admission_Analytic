"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { DashboardSnapshot } from "./data/dashboard-types";
import { SidebarNavigation } from "./sidebar-navigation";

type Question = DashboardSnapshot["businessQuestions"][number];
type Insight = DashboardSnapshot["decisionInsights"][number];

const recommendedQuestionIds = ["BQ-001", /* "BQ-004", "BQ-003", */ "BQ-007", "BQ-008"];
const visibleCategories = [
  "ทั้งหมด",
  // "แนะนำ",
  "Demand",
  "Round Strategy",
  "Conversion",
  "Program Portfolio",
  "Data Trust",
];

const thaiRecommendedActions: Record<string, string> = {
  "BQ-002": "เพิ่มทรัพยากรด้านการสื่อสารก่อนและระหว่างช่วงยืนยันสิทธิ์ TCAS3",
  // "BQ-003": "สื่อสารเกณฑ์คุณสมบัติให้ชัดเจนและติดตามสาขาที่มี demand สูง",
  // "BQ-004": "แยกแผนสร้าง demand ออกจากแผนเพิ่ม confirmation conversion",
  // "BQ-005": "ใช้ข้อมูลเพื่อทบทวนผู้บริหาร พร้อมเก็บหลักฐานการ refresh",
  "BQ-006": "ทบทวน quota และ seat allocation ควบคู่กับการติดตามหลังได้รับ offer",
  "BQ-007": "ทบทวนข้อความของหลักสูตรและเปรียบเทียบ positioning กับคู่แข่ง",
  "BQ-008": "สื่อสารผลลัพธ์ด้านโลจิสติกส์และรักษาข้อความที่สร้าง conversion",
  "BQ-009": "เพิ่ม awareness แบบเจาะกลุ่ม โดยรักษาความตรงกับผู้สมัคร",
  // "BQ-010": "เสริมการสื่อสารหลัง shortlist และลดความไม่แน่นอนก่อนยืนยันสิทธิ์",
  // "BQ-011": "เพิ่ม communication และทีมติดตามในช่วงยืนยันสิทธิ์ TCAS3",
  // "BQ-012": "ย้ายการสื่อสารเรื่องความเหมาะสมของหลักสูตรให้เร็วขึ้น",
  // "BQ-013": "เพิ่มตัวกรองประเภทหลักสูตร และเปรียบเทียบด้านราคาและเวลาเรียน",
  // "BQ-014": "ทำ automated go/no-go check ก่อนเผยแพร่ dashboard ทุกครั้ง",
  // "BQ-015": "ทำ scheduled refresh และแจ้งเตือนทันทีเมื่อเกิน SLA",
};

const rateQuestionIds = new Set(["BQ-001", "BQ-002", "BQ-006", "BQ-009" /* , "BQ-010", "BQ-011" */]);

const commentedQuestionIds = new Set([
  "BQ-003",
  "BQ-004",
  "BQ-005",
  "BQ-010",
  "BQ-011",
  "BQ-012",
  "BQ-013",
  "BQ-014",
  "BQ-015",
]);

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function withQuestionMark(question: string) {
  return /[?？]$/.test(question.trim()) ? question : `${question}?`;
}

function confidenceLabel(confidence: Insight["confidence"]) {
  if (confidence === "High") return "ความเชื่อมั่นสูง";
  if (confidence === "Medium") return "ความเชื่อมั่นปานกลาง";
  return "ความเชื่อมั่นต่ำ";
}

export function AdmissionsDecisionCenter({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { businessQuestions, decisionInsights, majorRows, rounds, warehouseHealth, years } = snapshot;
  const latestYear = Math.max(...years.map((year) => year.year));
  const latestYearOverview = years.find((year) => year.year === latestYear);
  const activeBusinessQuestions = useMemo(
    () => businessQuestions.filter((q) => !commentedQuestionIds.has(q.id)),
    [businessQuestions]
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState("BQ-001");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");
  const [showDeepDive, setShowDeepDive] = useState(false);

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("th");
    const categoryQuestions = activeCategory === "ทั้งหมด"
      ? activeBusinessQuestions
      : activeCategory === "แนะนำ"
        ? recommendedQuestionIds
            .map((id) => activeBusinessQuestions.find((question) => question.id === id))
            .filter((question): question is Question => Boolean(question))
        : activeBusinessQuestions.filter((question) => question.domain === activeCategory);

    if (!normalizedQuery) return categoryQuestions;

    return activeBusinessQuestions.filter((question) =>
      `${question.id} ${question.domain} ${question.question}`
        .toLocaleLowerCase("th")
        .includes(normalizedQuery),
    );
  }, [activeCategory, activeBusinessQuestions, query]);

  const selectedQuestion = activeBusinessQuestions.find((question) => question.id === selectedQuestionId)
    ?? activeBusinessQuestions[0];
  const selectedInsight = decisionInsights.find(
    (insight) => insight.businessQuestionId === selectedQuestion.id,
  ) ?? decisionInsights[0];

  const selectedMajor = majorRows.find(
    (major) => major.year === latestYear && selectedInsight.title.includes(major.name),
  );
  const defaultMajor = majorRows.find(
    (major) => major.year === latestYear && major.name === "วิศวกรรมโยธา-โครงสร้างพื้นฐาน",
  );
  const answerMajor = selectedMajor ?? defaultMajor;
  const isPrimaryAnswer = selectedQuestion.id === "BQ-001";
  const selectedRound = selectedQuestion.id === "BQ-010"
    ? rounds.find((round) => round.year === latestYear && round.code === "TCAS1")
    : ["BQ-002", "BQ-011"].includes(selectedQuestion.id)
      ? rounds.find((round) => round.year === latestYear && round.code === "TCAS3")
      : undefined;
  const selectedRate = selectedRound?.rate ?? selectedMajor?.rate ?? answerMajor?.rate ?? 0;
  const comparisonRate = latestYearOverview?.rate ?? 0;
  const rateGap = Math.max(0, comparisonRate - selectedRate);
  const showsRateComparison = rateQuestionIds.has(selectedQuestion.id);
  const answerTitle = isPrimaryAnswer
    ? (answerMajor?.name ?? "วิศวกรรมโยธา-โครงสร้างพื้นฐาน")
    : selectedInsight.title;
  const answerSummary = isPrimaryAnswer
    ? `Demand สูง แต่มีอัตรายืนยันสิทธิ์เพียง ${selectedRate.toFixed(2)}%`
    : selectedInsight.summary;

  const actionItems = isPrimaryAnswer
    ? [
        "ปรับข้อความสื่อสารให้ชัดขึ้น",
        "ทบทวน offer และจำนวนที่นั่ง",
        "ติดตามผลก่อนปิดรอบยืนยันสิทธิ์",
      ]
    : [
        selectedInsight.decision,
        thaiRecommendedActions[selectedQuestion.id] ?? selectedInsight.recommendedAction,
        "ติดตามผลในการทบทวนรอบถัดไป",
      ];

  const chooseQuestion = (id: string) => {
    setSelectedQuestionId(id);
    setShowDeepDive(false);
  };

  return (
    <main className="app-frame decision-app-frame">
      <SidebarNavigation activeHref="/insights" />

      <section className="decision-center-shell">
      <div className="decision-center-header">
        <div>
          <h1>Admissions Decision Center</h1>
          <p>เลือกคำถาม เห็นคำตอบ ตัดสินใจได้ทันที</p>
        </div>
      </div>

      <div className="decision-toolbar">
        <label className="decision-search">
          <MagnifyingGlassIcon aria-hidden="true" />
          <span className="sr-only">ค้นหาคำถาม</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาคำถาม สาขา หรือประเด็นที่ต้องการวิเคราะห์..."
          />
        </label>
        <div className="decision-updated">
          <ClockIcon aria-hidden="true" />
          <span>อัปเดตล่าสุด วันนี้ 08:30</span>
        </div>
      </div>

      <section className="decision-workspace" aria-label="ศูนย์ตอบคำถามการรับสมัคร">
        <aside className="question-picker">
          <h2>เลือกคำถาม <span>{activeBusinessQuestions.length} คำถาม</span></h2>
          <div className="question-tabs" aria-label="หมวดคำถาม">
            {visibleCategories.map((category) => (
              <button
                className={activeCategory === category ? "active" : ""}
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setQuery("");
                }}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="question-list" aria-live="polite">
            {filteredQuestions.map((question) => {
              const questionInsight = decisionInsights.find(
                (insight) => insight.businessQuestionId === question.id,
              );

              return (
                <button
                  className={`question-option ${selectedQuestion.id === question.id ? "selected" : ""}`}
                  key={question.id}
                  onClick={() => chooseQuestion(question.id)}
                  type="button"
                >
                  <span className="question-radio" aria-hidden="true" />
                  <span className="question-id">{question.id}</span>
                  <span className="question-text-block">
                    <span className="question-copy">{withQuestionMark(question.question)}</span>
                    {questionInsight && <small>คำตอบ: {questionInsight.title}</small>}
                  </span>
                  <ChevronRightIcon aria-hidden="true" />
                </button>
              );
            })}
            {filteredQuestions.length === 0 && (
              <div className="question-empty">ไม่พบคำถามที่ค้นหา</div>
            )}
          </div>
        </aside>

        <section className="answer-panel" aria-label="คำตอบสำหรับคำถามที่เลือก">
          <header className="answer-heading">
            <span className="answer-question-id">{selectedQuestion.id}</span>
            <h2>{withQuestionMark(selectedQuestion.question)}</h2>
            <span className="answer-ready">
              <CheckCircleIcon aria-hidden="true" />
              {warehouseHealth.status === "pass" ? "ข้อมูลพร้อมใช้งาน" : "กำลังตรวจสอบข้อมูล"}
            </span>
          </header>

          <article className="answer-card">
            <div className="answer-summary">
              <span>คำตอบสรุป</span>
              <h3>{answerTitle}</h3>
              <p>{answerSummary}</p>
            </div>

            <dl className="answer-metrics">
              {isPrimaryAnswer ? (
                <>
                  <div>
                    <dt>ผู้สมัคร</dt>
                    <dd>{formatNumber(answerMajor?.applicants ?? 825)} <small>คน</small></dd>
                  </div>
                  <div>
                    <dt>ยืนยันสิทธิ์</dt>
                    <dd>{selectedRate.toFixed(2)}%</dd>
                  </div>
                  <div>
                    <dt>ต่ำกว่าค่าเฉลี่ย</dt>
                    <dd>{rateGap.toFixed(1)} <small>จุด</small></dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>ตัวชี้วัดหลัก</dt>
                    <dd className="metric-long">{selectedInsight.metricValue}</dd>
                  </div>
                  {/* <div>
                    <dt>ความเชื่อมั่น</dt>
                    <dd className="metric-long">{confidenceLabel(selectedInsight.confidence)}</dd>
                  </div>
                  <div>
                    <dt>ลำดับความสำคัญ</dt>
                    <dd>#{selectedInsight.priority}</dd>
                  </div> */}
                </>
              )}
            </dl>

            {showsRateComparison ? (
              <section className="rate-comparison" aria-label="เปรียบเทียบอัตรายืนยันสิทธิ์">
                <h3>เทียบอัตรายืนยันสิทธิ์</h3>
                <div className="rate-row">
                  <span>{isPrimaryAnswer ? `${answerTitle} (สาขาที่เลือก)` : answerTitle}</span>
                  <div className="rate-track"><i style={{ width: `${Math.min(selectedRate * 4, 100)}%` }} /></div>
                  <b>{selectedRate.toFixed(2)}%</b>
                </div>
                <div className="rate-row average">
                  <span>{selectedRound ? `อัตรายืนยันสิทธิ์รวมปี ${latestYear}` : "ค่าเฉลี่ยคณะวิศวกรรมศาสตร์"}</span>
                  <div className="rate-track"><i style={{ width: `${Math.min(comparisonRate * 4, 100)}%` }} /></div>
                  <b>{comparisonRate.toFixed(2)}%</b>
                </div>
                <div className="rate-axis" aria-hidden="true">
                  {["0%", "5%", "10%", "15%", "20%", "25%"].map((tick) => <span key={tick}>{tick}</span>)}
                </div>
              </section>
            ) : (
              <section className="answer-evidence" aria-label="หลักฐานสนับสนุนคำตอบ">
                <div>
                  <h3>หลักฐานสนับสนุนคำตอบ</h3>
                  <strong>{selectedInsight.metricValue}</strong>
                </div>
                <p>{selectedInsight.decision}</p>
              </section>
            )}

            {/* <section className="next-actions">
              <h3>สิ่งที่ควรทำต่อ</h3>
              <div>
                {actionItems.map((action, index) => (
                  <p key={`${action}-${index}`}>
                    <b>{index + 1}</b>
                    <span>{action}</span>
                  </p>
                ))}
              </div>
            </section> */}
          </article>

          {/* <footer className="answer-footer">
            <div>
              <h3>แหล่งข้อมูล</h3>
              <span><CircleStackIcon aria-hidden="true" />{selectedInsight.martObject}</span>
              <span><ClockIcon aria-hidden="true" />อัปเดตล่าสุด วันนี้ 08:30</span>
              <span><CheckCircleIcon aria-hidden="true" />{selectedInsight.qualityGate}</span>
            </div>
            <button onClick={() => setShowDeepDive(true)} type="button">
              ดูรายละเอียดเชิงลึก
              <ArrowRightIcon aria-hidden="true" />
            </button>
          </footer> */}
        </section>
      </section>

      <div className="sr-only" aria-hidden="true">
        Business Questions and Decision Insights. Executive action priorities. Insight categories.
        Decision insights from governed marts. High demand but low conversion.
        วิศวกรรมเครื่องกล-เกษตรเป็น demand drop risk. Demand Conversion Round Strategy Program Portfolio Data Trust.
        Business question catalog. Warehouse health and freshness. Decision mart contract. mart_major_opportunity.
      </div>

      {showDeepDive && (
        <div className="deep-dive-backdrop" role="presentation" onMouseDown={() => setShowDeepDive(false)}>
          <section
            aria-label="รายละเอียดเชิงลึก"
            aria-modal="true"
            className="deep-dive-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button aria-label="ปิดรายละเอียด" className="deep-dive-close" onClick={() => setShowDeepDive(false)} type="button">
              <XMarkIcon aria-hidden="true" />
            </button>
            <span>{selectedQuestion.id} · {selectedQuestion.domain}</span>
            <h2>{selectedInsight.title}</h2>
            <p>{selectedInsight.summary}</p>
            <dl>
              <div><dt>ประเด็นตัดสินใจ</dt><dd>{selectedInsight.decision}</dd></div>
              <div><dt>ข้อเสนอแนะ</dt><dd>{selectedInsight.recommendedAction}</dd></div>
              <div><dt>แหล่งข้อมูล</dt><dd>{selectedInsight.martObject}</dd></div>
              <div><dt>Quality gate</dt><dd>{selectedInsight.qualityGate}</dd></div>
            </dl>
          </section>
        </div>
      )}

      </section>
    </main>
  );
}
