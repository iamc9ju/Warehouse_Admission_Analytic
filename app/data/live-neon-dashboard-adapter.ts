import artifactSnapshot from "./generated/warehouse-dashboard-snapshot.json";
import type { DashboardSnapshot, MajorRow, RoundRow, StatusRow, YearOverview } from "./dashboard-types";

type QueryClient = {
  query<T extends Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};

type PgModule = {
  Client: new (config: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
    connectionTimeoutMillis?: number;
    query_timeout?: number;
    statement_timeout?: number;
  }) => QueryClient & {
    connect(): Promise<void>;
  };
};

function numberValue(value: unknown, field: string) {
  const parsed = Number(String(value ?? "").replaceAll(",", ""));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Live Neon returned non-numeric ${field}`);
  }
  return parsed;
}

function optionalNumberValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return numberValue(value, field);
}

function sslConfig(databaseUrl: string) {
  return databaseUrl.includes("sslmode=disable") ? undefined : { rejectUnauthorized: false };
}

async function connect(databaseUrl: string): Promise<QueryClient> {
  const pg = (await import("pg")) as unknown as PgModule;
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: sslConfig(databaseUrl),
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
    statement_timeout: 5000,
  });
  await client.connect();
  return client;
}

function enrichQualityMetrics(
  liveRows: Record<string, unknown>[],
  fallback: DashboardSnapshot["qualityMetricDefinitions"],
): DashboardSnapshot["qualityMetricDefinitions"] {
  const fallbackByLabel = new Map(fallback.map((metric) => [metric.label, metric]));
  return liveRows.map((row) => {
    const label = String(row.metric_name);
    const base = fallbackByLabel.get(label);
    return {
      label,
      value: String(row.metric_value),
      sourceObject: String(row.source_object),
      definition: base?.definition ?? "Warehouse quality scorecard metric",
      rule: String(row.validation_rule),
    };
  });
}

async function optionalQuery(client: QueryClient, sql: string): Promise<Record<string, unknown>[] | undefined> {
  try {
    const result = await client.query<Record<string, unknown>>(sql);
    return result.rows.length > 0 ? result.rows : undefined;
  } catch {
    return undefined;
  }
}

export async function loadLiveNeonSnapshot(databaseUrl: string): Promise<DashboardSnapshot> {
  const fallback = artifactSnapshot as DashboardSnapshot;
  const client = await connect(databaseUrl);

  try {
    const [yearResult, roundResult, majorResult, statusResult, qualityResult] = await Promise.all([
      client.query<Record<string, unknown>>(`
        select academic_year, application_choices, unique_applicants, confirmed_applicants, confirmed_rate, source_files, avg_score
        from admissions_dw.mart_admissions_executive_summary
        order by academic_year
      `),
      client.query<Record<string, unknown>>(`
        select academic_year, tcas_round_code, tcas_round_name, choices, unique_applicants, confirmed_applicants, confirmed_rate, source_files
        from admissions_dw.vw_admission_round_overview
        order by academic_year, tcas_round_code
      `),
      client.query<Record<string, unknown>>(`
        select academic_year, major_code, major_name, program_type, applicant_count, confirmed_count, confirmed_rate, avg_score, applicant_change
        from admissions_dw.mart_major_conversion
        order by academic_year, applicant_count desc
      `),
      client.query<Record<string, unknown>>(`
        select academic_year, status_label, choices, share_pct, tone
        from admissions_dw.vw_admission_round_status_distribution
        order by academic_year, choices desc
      `),
      client.query<Record<string, unknown>>(`
        select metric_name, metric_value, source_object, validation_rule
        from admissions_dw.vw_dw_quality_scorecard
        order by metric_name
      `),
    ]);

    const [businessQuestionRows, insightRows, healthRows, decisionMartRows] = await Promise.all([
      optionalQuery(client, `
        select question_id, domain, question, mart_object, metrics, decision_owner, decision_use, quality_gate
        from admissions_dw.dw_business_question_catalog
        order by question_id
      `),
      optionalQuery(client, `
        select insight_id, business_question_id, priority, category, title, summary, mart_object, metric_label, metric_value,
          decision, recommended_action, confidence, quality_gate
        from admissions_dw.mart_decision_insight
        order by priority, insight_id
      `),
      optionalQuery(client, `
        select health_id, status, last_refresh_at, freshness_sla_hours, source_rows, source_files, mart_count,
          quality_checks_passed, quality_checks_failed, pii_exported_columns, artifact_checksum, notes
        from admissions_dw.vw_dw_refresh_health
        order by last_refresh_at desc
        limit 1
      `),
      optionalQuery(client, `
        select mart_object, grain, source_objects, purpose
        from admissions_dw.dw_decision_mart_contract
        order by mart_object
      `),
    ]);

    const years: YearOverview[] = yearResult.rows.map((row) => ({
      year: numberValue(row.academic_year, "academic_year") as YearOverview["year"],
      choices: numberValue(row.application_choices, "application_choices"),
      applicants: numberValue(row.unique_applicants, "unique_applicants"),
      confirmed: numberValue(row.confirmed_applicants, "confirmed_applicants"),
      rate: numberValue(row.confirmed_rate, "confirmed_rate"),
      sourceFiles: numberValue(row.source_files, "source_files"),
      avgScore: numberValue(row.avg_score, "avg_score"),
    }));

    const rounds: RoundRow[] = roundResult.rows.map((row) => ({
      year: numberValue(row.academic_year, "academic_year") as RoundRow["year"],
      code: String(row.tcas_round_code),
      name: String(row.tcas_round_name),
      choices: numberValue(row.choices, "choices"),
      applicants: numberValue(row.unique_applicants, "unique_applicants"),
      confirmed: numberValue(row.confirmed_applicants, "confirmed_applicants"),
      rate: numberValue(row.confirmed_rate, "confirmed_rate"),
      files: numberValue(row.source_files, "source_files"),
    }));

    const majorRows: MajorRow[] = majorResult.rows.map((row) => ({
      year: numberValue(row.academic_year, "academic_year") as MajorRow["year"],
      code: String(row.major_code),
      name: String(row.major_name),
      type: String(row.program_type),
      applicants: numberValue(row.applicant_count, "applicant_count"),
      confirmed: numberValue(row.confirmed_count, "confirmed_count"),
      rate: numberValue(row.confirmed_rate, "confirmed_rate"),
      avgScore: numberValue(row.avg_score, "avg_score"),
      applicantChange: optionalNumberValue(row.applicant_change, "applicant_change"),
    }));

    const statuses: StatusRow[] = statusResult.rows.map((row) => ({
      year: numberValue(row.academic_year, "academic_year") as StatusRow["year"],
      label: String(row.status_label),
      choices: numberValue(row.choices, "choices"),
      share: numberValue(row.share_pct, "share_pct"),
      tone: String(row.tone || "muted") as StatusRow["tone"],
    }));

    if (years.length === 0 || rounds.length === 0 || majorRows.length === 0 || statuses.length === 0 || qualityResult.rows.length === 0) {
      throw new Error("Live Neon marts returned incomplete dashboard data");
    }

    return {
      ...fallback,
      runtime: {
        source: "live-neon",
        loadedAt: new Date().toISOString(),
      },
      warehouseSnapshot: {
        ...fallback.warehouseSnapshot,
        dashboardMode: "live Neon server-side mart query",
        exportedAt: new Date().toISOString().slice(0, 10),
        sourceSystem: "Neon PostgreSQL",
      },
      years,
      rounds,
      majorRows,
      statuses,
      qualityMetricDefinitions: enrichQualityMetrics(qualityResult.rows, fallback.qualityMetricDefinitions),
      businessQuestions: businessQuestionRows
        ? businessQuestionRows.map((row) => ({
          id: String(row.question_id),
          domain: String(row.domain),
          question: String(row.question),
          martObject: String(row.mart_object),
          metrics: String(row.metrics).split(",").map((metric) => metric.trim()),
          decisionOwner: String(row.decision_owner),
          decisionUse: String(row.decision_use),
          qualityGate: String(row.quality_gate),
        }))
        : fallback.businessQuestions,
      decisionInsights: insightRows
        ? insightRows.map((row) => ({
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
        }))
        : fallback.decisionInsights,
      warehouseHealth: healthRows
        ? {
          id: String(healthRows[0].health_id),
          status: String(healthRows[0].status) as DashboardSnapshot["warehouseHealth"]["status"],
          lastRefreshAt: String(healthRows[0].last_refresh_at),
          freshnessSlaHours: numberValue(healthRows[0].freshness_sla_hours, "freshness_sla_hours"),
          sourceRows: numberValue(healthRows[0].source_rows, "source_rows"),
          sourceFiles: numberValue(healthRows[0].source_files, "source_files"),
          martCount: numberValue(healthRows[0].mart_count, "mart_count"),
          qualityChecksPassed: numberValue(healthRows[0].quality_checks_passed, "quality_checks_passed"),
          qualityChecksFailed: numberValue(healthRows[0].quality_checks_failed, "quality_checks_failed"),
          piiExportedColumns: numberValue(healthRows[0].pii_exported_columns, "pii_exported_columns"),
          artifactChecksum: String(healthRows[0].artifact_checksum),
          notes: String(healthRows[0].notes),
        }
        : fallback.warehouseHealth,
      decisionMartContract: decisionMartRows
        ? decisionMartRows.map((row) => ({
          martObject: String(row.mart_object),
          grain: String(row.grain),
          sourceObjects: String(row.source_objects),
          purpose: String(row.purpose),
        }))
        : fallback.decisionMartContract,
    };
  } finally {
    await client.end();
  }
}
