export type Year = number;

export type YearOverview = {
  year: Year;
  choices: number;
  applicants: number;
  confirmed: number;
  resigned: number;
  eligible: number;
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
  choices: number;
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
  applicants: number;
  share: number;
  tone: "green" | "amber" | "blue" | "red" | "muted" | "purple" | "orange";
};

export type MajorStatusRow = {
  year: Year;
  code: string;
  name: string;
  label: string;
  choices: number;
  applicants: number;
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
  allYearPeople: { applicants: number; confirmed: number; resigned: number };
  runtime: {
    source: "live-neon";
    loadedAt: string;
  };
  years: YearOverview[];
  majorRows: MajorRow[];
  majorStatuses: MajorStatusRow[];
  statuses: StatusRow[];
  rounds: RoundRow[];
  roundStatuses: RoundStatusRow[];
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
};
