import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "app/overview-view.tsx",
  "app/dashboard/analytics-dashboard.tsx",
  "app/insights/admissions-decision-center.tsx",
  "app/page.tsx",
  "app/dashboard/page.tsx",
  "app/warehouse/page.tsx",
  "app/technical/page.tsx",
  "app/rounds/page.tsx",
  "app/majors/page.tsx",
  "app/quality/page.tsx",
  "app/insights/page.tsx",
];

const forbiddenPatterns = [
  /const\s+years\s*=\s*\[/,
  /const\s+majorRows\s*=\s*\[/,
  /const\s+statuses\s*=\s*\[/,
  /const\s+rounds\s*=\s*\[/,
  /warehouse-snapshot\.ts/,
  /app\/data\/warehouse-snapshot/,
];

for (const file of files) {
  const text = await readFile(path.join(root, file), "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      throw new Error(`${file} contains forbidden embedded dashboard data pattern: ${pattern}`);
    }
  }
}

console.log("No embedded dashboard data found in app source");
