export type Year = 2568 | 2569;

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
  rate: number;
  files: number;
};

export type DashboardSnapshot = {
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
};
