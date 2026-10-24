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
import type { DashboardSnapshot } from "../data/dashboard-types";
import type { PageData } from "../data/page-data-types";
import { SidebarNavigation } from "../sidebar-navigation";

type Question = DashboardSnapshot["businessQuestions"][number];
type Insight = DashboardSnapshot["decisionInsights"][number];

const recommendedQuestionIds = ["BQ-001", "BQ-007", "BQ-008"];
const visibleCategories = [
  "ทั้งหมด",
  // "แนะนำ",
  "Demand",
  "Round Strategy",
];

const thaiRecommendedActions: Record<string, string> = {
  "BQ-002": "เพิ่มทรัพยากรด้านการสื่อสารก่อนและระหว่างช่วงยืนยันสิทธิ์ TCAS3",
  "BQ-007": "ทบทวนข้อความของหลักสูตรและเปรียบเทียบ positioning กับคู่แข่ง",
  "BQ-008": "สื่อสารผลลัพธ์ด้านโลจิสติกส์และรักษาข้อความที่สร้าง conversion",
  "BQ-009": "ทบทวนการสื่อสารและการเข้าถึงกลุ่มผู้สมัครเป้าหมาย",
};

const rateQuestionIds = new Set(["BQ-001", "BQ-002", "BQ-009"]);

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function eligibleRate(row: { confirmed: number; eligible?: number }) {
  return row.eligible && row.eligible > 0 ? row.confirmed / row.eligible * 100 : null;
}

function formatRate(rate: number | null) {
  return rate === null ? "ไม่มีฐานคำนวณ" : `${rate.toFixed(1)}%`;
}

function withQuestionMark(question: string) {
  return /[?？]$/.test(question.trim()) ? question : `${question}?`;
}

function confidenceLabel(confidence: Insight["confidence"]) {
  if (confidence === "High") return "ความเชื่อมั่นสูง";
  if (confidence === "Medium") return "ความเชื่อมั่นปานกลาง";
  return "ความเชื่อมั่นต่ำ";
}


function EligibilityComparison({ eligibleCount, confirmedCount }: { eligibleCount: number; confirmedCount: number }) {
  const rate = eligibleRate({ confirmed: confirmedCount, eligible: eligibleCount });
  return (
              <section className="rate-comparison" aria-label="เปรียบเทียบผู้มีสิทธิ์กับยืนยันสิทธิ์">
                <h3>เปรียบเทียบผู้มีสิทธิ์กับยืนยันสิทธิ์จริง</h3>
                <div className="rate-row">
                  <span>จำนวนคนมีสิทธิ์</span>
                  <div className="rate-track"><i style={{ width: "100%", background: "#477ca8" }} /></div>
                  <b>{formatNumber(eligibleCount)} คน ({eligibleCount > 0 ? "100%" : "ไม่มีฐานคำนวณ"})</b>
                </div>
                <div className="rate-row average">
                  <span>คนที่ยืนยันจริง</span>
                  <div className="rate-track"><i style={{ width: `${Math.min(rate ?? 0, 100)}%`, background: "#2e7d32" }} /></div>
                  <b>{formatNumber(confirmedCount)} คน ({formatRate(rate)})</b>
                </div>
                <div className="rate-axis" aria-hidden="true">
                  {["0%", "20%", "40%", "60%", "80%", "100%"].map((tick) => <span key={tick}>{tick}</span>)}
                </div>
              </section>
  );
}

export function AdmissionsDecisionCenter({ snapshot }: { snapshot: PageData<"insights"> }) {
  const { businessQuestions, decisionInsights, majorRows, rounds, years } = snapshot;
  const latestYear = Math.max(...years.map((year) => year.year));
  const latestYearOverview = years.find((year) => year.year === latestYear);
  const activeBusinessQuestions = businessQuestions;
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

  const majorsByApplicants = useMemo(() => majorRows
    .filter((major) => major.year === latestYear)
    .sort((a, b) => b.applicants - a.applicants
      || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)
      || (a.type < b.type ? -1 : a.type > b.type ? 1 : 0)),
  [majorRows, latestYear]);
  const majorsByFewestApplicants = useMemo(() => [...majorsByApplicants]
    .sort((a, b) => a.applicants - b.applicants
      || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)
      || (a.type < b.type ? -1 : a.type > b.type ? 1 : 0)),
  [majorsByApplicants]);
  const selectedMajor = majorRows.find(
    (major) => major.year === latestYear && selectedInsight.title.includes(major.name),
  );
  const defaultMajor = majorRows.find(
    (major) => major.year === latestYear && major.name === "วิศวกรรมโยธา-โครงสร้างพื้นฐาน",
  );
  const answerMajor = selectedQuestion.id === "BQ-001"
    ? majorsByApplicants[0]
    : selectedQuestion.id === "BQ-009"
      ? majorsByFewestApplicants[0]
      : selectedMajor ?? defaultMajor;
  const isPrimaryAnswer = selectedQuestion.id === "BQ-001";
  const selectedRound = selectedQuestion.id === "BQ-002"
    ? [...rounds.filter((round) => round.year === latestYear)].sort((a, b) => b.confirmed - a.confirmed)[0]
    : undefined;
  const confirmedCount = selectedRound ? selectedRound.confirmed : (answerMajor?.confirmed ?? 0);
  const applicantsCount = selectedRound ? selectedRound.applicants : (answerMajor?.applicants ?? 0);
  const eligibleCount = selectedRound
    ? (selectedRound.eligible ?? 0)
    : (answerMajor?.eligible ?? 0);

  const selectedRate = eligibleRate({ confirmed: confirmedCount, eligible: eligibleCount });
  const comparisonRate = latestYearOverview ? eligibleRate(latestYearOverview) : null;
  const rateGap = Math.max(0, (comparisonRate ?? 0) - (selectedRate ?? 0));
  const showsRateComparison = rateQuestionIds.has(selectedQuestion.id);
  const answerTitle = isPrimaryAnswer
    ? (answerMajor?.name ?? "ไม่มีข้อมูลสาขา")
    : selectedInsight.title;
  const answerSummary = isPrimaryAnswer
    ? `ปี ${latestYear} มีผู้สมัครมากที่สุด ${formatNumber(answerMajor?.applicants ?? 0)} คน และอัตรายืนยันต่อผู้มีสิทธิ์ ${formatRate(selectedRate)}`
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

  const runnerUps = useMemo(() => {
    if (selectedQuestion.id === "BQ-001") {
      return majorsByApplicants
        .slice(1, 5)
        .map((m) => ({
          key: m.majorKey,
          applicants: m.applicants,
          eligible: m.eligible ?? 0,
          confirmed: m.confirmed,
          name: m.name,
          displayValue: `ผู้สมัคร ${formatNumber(m.applicants)} คน (ยืนยันสิทธิ์ ${formatRate(eligibleRate(m))})`,
        }));
    }
    if (selectedQuestion.id === "BQ-002") {
      const tcasRounds = rounds.filter((r) => r.year === latestYear && r.code !== "TCAS3");
      return [...tcasRounds]
        .sort((a, b) => (eligibleRate(b) ?? -Infinity) - (eligibleRate(a) ?? -Infinity))
        .map((r) => ({
          key: r.code,
          applicants: r.applicants,
          eligible: r.eligible ?? 0,
          confirmed: r.confirmed,
          name: `${r.code} — ${r.name}`,
          displayValue: `ยืนยันสิทธิ์ ${formatRate(eligibleRate(r))}`,
        }));
    }
    if (selectedQuestion.id === "BQ-007") {
      return majorRows
        .filter((m) => m.year === latestYear && m.name !== "วิศวกรรมเครื่องกล-เกษตร" && (m.applicantChange ?? 0) < 0)
        .sort((a, b) => (a.applicantChange ?? 0) - (b.applicantChange ?? 0))
        .slice(0, 4)
        .map((m) => ({
          key: m.majorKey,
          applicants: m.applicants,
          eligible: m.eligible ?? 0,
          confirmed: m.confirmed,
          name: m.name,
          displayValue: `ลดลง ${Math.abs(m.applicantChange ?? 0)} คนจากปี ${latestYear - 1}`,
        }));
    }
    if (selectedQuestion.id === "BQ-008") {
      return majorRows
        .filter((m) => m.year === latestYear && m.name !== "วิศวกรรมอุตสาหการ-โลจิสติกส์" && (m.applicantChange ?? 0) > 0)
        .sort((a, b) => (b.applicantChange ?? 0) - (a.applicantChange ?? 0))
        .slice(0, 4)
        .map((m) => ({
          key: m.majorKey,
          applicants: m.applicants,
          eligible: m.eligible ?? 0,
          confirmed: m.confirmed,
          name: m.name,
          displayValue: `เพิ่มขึ้น +${m.applicantChange} คน`,
        }));
    }
    if (selectedQuestion.id === "BQ-009") {
      return majorsByFewestApplicants
        .slice(1, 5)
        .map((m) => ({
          key: m.majorKey,
          applicants: m.applicants,
          eligible: m.eligible ?? 0,
          confirmed: m.confirmed,
          name: m.name,
          displayValue: `ผู้สมัคร ${formatNumber(m.applicants)} คน`,
        }));
    }
    return [];
  }, [selectedQuestion.id, majorRows, rounds, latestYear, majorsByApplicants, majorsByFewestApplicants]);

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
              ข้อมูลพร้อมใช้งาน
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
                    <dd>{formatNumber(answerMajor?.applicants ?? 0)} <small>คน</small></dd>
                  </div>
                  <div>
                    <dt>อัตรายืนยันต่อผู้มีสิทธิ์</dt>
                    <dd>{formatRate(selectedRate)}</dd>
                  </div>
                  <div>
                    <dt>ผู้มีสิทธิ์</dt>
                    <dd>{formatNumber(eligibleCount)} <small>คน</small></dd>
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
              <EligibilityComparison eligibleCount={eligibleCount} confirmedCount={confirmedCount} />
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
              </div> */}
          </article>

          {runnerUps.length > 0 && (
            <section className="runner-ups-section" aria-label="อันดับรองลงมา" key={selectedQuestion.id}>
              <h3>อันดับรองลงมา</h3>
              {runnerUps.map((item, idx) => (
                <details className="runner-up-card" key={item.key}>
                  <summary>
                    <span className="runner-up-rank">{idx + 2}</span>
                    <span className="runner-up-heading"><strong>{item.name}</strong><small>{item.displayValue}</small></span>
                    <ChevronRightIcon className="runner-up-chevron" aria-hidden="true" />
                  </summary>
                  <div className="runner-up-content">
                    <dl className="answer-metrics">
                      <div><dt>ผู้สมัคร</dt><dd>{formatNumber(item.applicants)} <small>คน</small></dd></div>
                      <div><dt>ผู้มีสิทธิ์</dt><dd>{formatNumber(item.eligible)} <small>คน</small></dd></div>
                      <div><dt>ยืนยันสิทธิ์</dt><dd>{formatNumber(item.confirmed)} <small>คน</small></dd></div>
                    </dl>
                    <EligibilityComparison eligibleCount={item.eligible} confirmedCount={item.confirmed} />
                  </div>
                </details>
              ))}
            </section>
          )}


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
        วิศวกรรมเครื่องกล-เกษตรเป็น demand drop risk. Demand Conversion Round Strategy Program Portfolio.
        Business question catalog. mart_major_opportunity.
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
