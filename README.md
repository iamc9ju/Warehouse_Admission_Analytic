# Social Media Impact Analytics for Engineering Admissions

Data Warehouse และ Web Dashboard สำหรับวิเคราะห์ข้อมูลรับสมัคร TCAS รอบ 3 ของคณะวิศวกรรมศาสตร์ กำแพงแสน พร้อม social media demonstration layer สำหรับแสดงแนวทางวิเคราะห์ความสัมพันธ์ระหว่างกระแสออนไลน์กับ admissions outcome

Production dashboard:

```text
https://tcas-round3-admissions-dashboard.ittipol-b.chatgpt.site
```

---

## What This Project Contains

### Admissions pipeline

```text
Excel files
  -> ETL aggregate script
  -> processed CSV
  -> Neon PostgreSQL schema admissions_dw
  -> analytics views
  -> markdown report
  -> web dashboard
```

### Social media demonstration pipeline

```text
synthetic monthly social media CSV
  -> Neon PostgreSQL social tables
  -> platform / sentiment / keyword views
  -> admissions correlation view
  -> dashboard social impact section
```

### Website analytics pipeline

```text
GA4 Data API
  -> real monthly website analytics CSV
  -> Neon PostgreSQL website analytics tables
  -> admissions correlation views
```

---

## Key Files

| Path | Purpose |
|---|---|
| `PROJECT_DOCUMENTATION.md` | Full project documentation, limitations and runbook |
| `docs/decisions/` | Architecture decision records |
| `app/page.tsx` | Web dashboard content and data |
| `app/globals.css` | Dashboard layout and styling |
| `outputs/etl/aggregate_round3_admissions.py` | Aggregate Excel admissions files |
| `outputs/etl/load_round3_to_neon.cjs` | Load admissions aggregate data to Neon |
| `outputs/etl/load_social_media_to_neon.cjs` | Load synthetic social media data to Neon |
| `outputs/etl/fetch_ga4_website_analytics.cjs` | Fetch aggregate website analytics from GA4 Data API |
| `outputs/etl/load_website_analytics_to_neon.cjs` | Load GA4 website analytics CSV to Neon |
| `outputs/sql/admissions_round3_warehouse.sql` | Admissions warehouse schema |
| `outputs/sql/social_media_warehouse.sql` | Social media warehouse schema and views |
| `outputs/sql/website_analytics_warehouse.sql` | Website analytics schema and admissions correlation views |
| `outputs/reports/` | Generated markdown analytics reports |

`outputs/` is ignored by git because it contains generated artifacts and local deliverables.

---

## Current Results

| Metric | 2568 | 2569 | Change |
|---|---:|---:|---:|
| Application choices | 2,711 | 2,379 | -332 |
| Unique applicants | 1,810 | 1,620 | -190 |
| Confirmed applicants | 214 | 283 | +69 |
| Confirmed rate | 11.82% | 17.47% | +5.65 pts |
| Social mentions sample + YouTube API | 797 | 1,121 | +324 |
| Social engagement sample + YouTube API | 890,244 | 1,134,693 | +244,449 |

---

## Important Notes

- Admissions data comes from user-provided Excel files.
- Personal data is not exported into processed CSV, Neon warehouse tables or the web dashboard.
- YouTube data has been fetched from the real YouTube Data API; other social rows are currently synthetic sample data for demonstration only.
- Website analytics support has been added for GA4 aggregate reports; it requires a GA4 property ID and service account access before real data can be fetched.
- Because there are only two academic years in the current dataset, social media correlation should be presented as a capability demo, not causal proof.

---

## Local Web Development

Requirements:

- Node.js `>=22.13.0`

Commands:

```bash
npm install
npm run dev
npm run build
```

---

## Database Runbook

Do not commit database credentials.

```bash
python3 outputs/etl/aggregate_round3_admissions.py
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_social_media_to_neon.cjs
GA4_PROPERTY_ID="..." GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" node outputs/etl/fetch_ga4_website_analytics.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_website_analytics_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/export_round3_analytics_report.cjs
```
