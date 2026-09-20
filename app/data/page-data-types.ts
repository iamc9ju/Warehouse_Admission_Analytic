import type { DashboardSnapshot } from "./dashboard-types";

// Only these fields are queried and sent to each page.
export const pageDataFields = {
  overview: ["years", "rounds", "majorRows", "statuses"],
  dashboard: ["years", "rounds", "majorRows", "statuses", "roundStatuses", "warehouseHealth"],
  insights: ["years", "rounds", "majorRows", "statuses", "roundStatuses", "warehouseHealth", "businessQuestions", "decisionInsights"],
  majors: ["years", "majorRows", "statuses", "roundStatuses"],
  rounds: ["years", "rounds", "roundStatuses"],
  quality: ["years", "statuses", "qualityMetricDefinitions", "warehouseHealth"],
  technical: ["warehouseHealth", "warehouseSnapshot"],
  warehouse: ["dataCatalogRows", "lineageEdges", "etlValidationChecks", "warehouseQueries", "warehouseSnapshot"],
} as const satisfies Record<string, readonly (keyof DashboardSnapshot)[]>;

export type DashboardPage = keyof typeof pageDataFields;
export type PageData<P extends DashboardPage> = Pick<DashboardSnapshot, (typeof pageDataFields)[P][number]>;
export type OverviewPageData = PageData<"overview"> & { availableYears: number[]; selectedYear: number };

export type LoadedPageSnapshot = {
  snapshot: DashboardSnapshot;
  availableYears: number[];
  selectedYear: number;
};

export function pickPageData<P extends DashboardPage>(page: P, snapshot: DashboardSnapshot): PageData<P> {
  return Object.fromEntries(pageDataFields[page].map((key) => [key, snapshot[key]])) as PageData<P>;
}
