import type { QueryClient } from "../db/neon-client";
import type { DashboardSnapshot } from "../dashboard-types";
import { numberValue, requiredRows } from "./query-helpers";

export async function getBusinessQuestions(client: QueryClient): Promise<DashboardSnapshot["businessQuestions"]> {
  const rows = await requiredRows(client, `
    select question_id, domain, question, mart_object, metrics, decision_owner, decision_use, quality_gate
    from admissions_dw.dw_business_question_catalog
    order by question_id
  `);
  return rows.map((row) => ({
    id: String(row.question_id),
    domain: String(row.domain),
    question: String(row.question),
    martObject: String(row.mart_object),
    metrics: String(row.metrics).split(",").map((metric) => metric.trim()),
    decisionOwner: String(row.decision_owner),
    decisionUse: String(row.decision_use),
    qualityGate: String(row.quality_gate),
  }));
}

export async function getDecisionInsights(client: QueryClient): Promise<DashboardSnapshot["decisionInsights"]> {
  const rows = await requiredRows(client, `
    select insight_id, business_question_id, priority, category, title, summary, mart_object, metric_label, metric_value,
      decision, recommended_action, confidence, quality_gate
    from admissions_dw.mart_decision_insight
    order by priority, insight_id
  `);
  return rows.map((row) => ({
    id: String(row.insight_id),
    businessQuestionId: String(row.business_question_id),
    priority: numberValue(row.priority, "priority"),
    category: String(row.category),
    title: String(row.title),
    summary: String(row.summary),
    martObject: String(row.mart_object),
    metricLabel: String(row.metric_label),
    metricValue: String(row.metric_value),
    decision: String(row.decision),
    recommendedAction: String(row.recommended_action),
    confidence: String(row.confidence) as DashboardSnapshot["decisionInsights"][number]["confidence"],
    qualityGate: String(row.quality_gate),
  }));
}
