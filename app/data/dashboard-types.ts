export type Year = number;

export type YearOverview = {
  year: Year;
  choices: number;
  applicants: number;
  confirmed: number;
  rate: number;
  sourceFiles: number;
  avgScore: number;
};

export type MajorRow = {
  year: Year;
  code: string;
  name: string;
  type: string;
  applicants: number;
  confirmed: number;
  rate: number;
  avgScore: number;
  applicantChange?: number;
  eligible?: number;
};

export type StatusRow = {
  year: Year;
  label: string;
  choices: number;
  share: number;
  tone: "green" | "amber" | "blue" | "red" | "muted" | "purple" | "orange";
};

export type RoundRow = {
  year: Year;
  code: string;
  name: string;
  choices: number;
  applicants: number;
  confirmed: number;
  eligible?: number;
  rate: number;
  files: number;
};

export type RoundStatusRow = {
  year: Year;
  code: string;
  name: string;
  label: string;
  choices: number;
  applicants: number;
};

export type DashboardSnapshot = {
  runtime: {
    source: "live-neon" | "generated-artifact";
    loadedAt: string;
    fallbackReason?: string;
  };
  warehouseSnapshot: {
    exportedAt: string;
    sourceSystem: string;
    schema: string;
    dashboardMode: string;
    sourceRows: number;
    activeSourceGroups: number;
    sourceFiles: number;
    catalogRows: number;
    lineageEdges: number;
    piiExportedColumns: number;
    sourceQuery: string;
  };
  years: YearOverview[];
  majorRows: MajorRow[];
  statuses: StatusRow[];
  rounds: RoundRow[];
  roundStatuses: RoundStatusRow[];
  qualityMetricDefinitions: {
    label: string;
    value: string;
    sourceObject: string;
    definition: string;
    rule: string;
  }[];
  dataCatalogRows: string[][];
  lineageEdges: string[][];
  etlValidationChecks: string[][];
  warehouseQueries: {
    name: string;
    object: string;
    sql: string;
  }[];
  businessQuestions: {
    id: string;
    domain: string;
    question: string;
    martObject: string;
    metrics: string[];
    decisionOwner: string;
    decisionUse: string;
    qualityGate: string;
  }[];
  decisionInsights: {
    id: string;
    businessQuestionId: string;
    priority: number;
    category: string;
    title: string;
    summary: string;
    martObject: string;
    metricLabel: string;
    metricValue: string;
    decision: string;
    recommendedAction: string;
    confidence: "High" | "Medium" | "Low";
    qualityGate: string;
  }[];
  warehouseHealth: {
    id: string;
    status: "pass" | "warn" | "fail";
    lastRefreshAt: string;
    freshnessSlaHours: number;
    sourceRows: number;
    sourceFiles: number;
    martCount: number;
    qualityChecksPassed: number;
    qualityChecksFailed: number;
    piiExportedColumns: number;
    artifactChecksum: string;
    notes: string;
  };
  decisionMartContract: {
    martObject: string;
    grain: string;
    sourceObjects: string;
    purpose: string;
  }[];
};
