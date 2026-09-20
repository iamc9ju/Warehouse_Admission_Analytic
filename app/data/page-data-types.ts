import type { DashboardSnapshot } from "./dashboard-types";

// Only these fields are queried and sent to each page.
export const pageDataFields = {
  overview: ["years", "rounds", "majorRows", "statuses"],
  dashboard: ["years", "rounds", "majorRows", "roundStatuses"],
  insights: ["years", "rounds", "majorRows", "businessQuestions", "decisionInsights"],
  majors: ["years", "majorRows", "majorStatuses"],
  rounds: ["years", "rounds", "roundStatuses"],
} as const satisfies Record<string, readonly (keyof DashboardSnapshot)[]>;

export type DashboardPage = keyof typeof pageDataFields;
export type PageData<P extends DashboardPage> = Pick<DashboardSnapshot, (typeof pageDataFields)[P][number]>;
export type OverviewPageData = PageData<"overview"> & { availableYears: number[]; selectedYear: number };

export type LoadedPageSnapshot = {
  snapshot: Partial<DashboardSnapshot> & Pick<DashboardSnapshot, "runtime">;
  availableYears: number[];
  selectedYear: number;
};

export function pickPageData<P extends DashboardPage>(
  page: P,
  snapshot: Partial<DashboardSnapshot> & Pick<DashboardSnapshot, "runtime">,
): PageData<P> {
  return Object.fromEntries(pageDataFields[page].map((key) => {
    const value = snapshot[key];
    if (value === undefined) throw new Error(`Live Neon response is missing ${String(key)} for ${page}`);
    return [key, value];
  })) as PageData<P>;
}
