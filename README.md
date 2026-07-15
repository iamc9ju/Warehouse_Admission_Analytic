# Admissions Data Warehouse for Engineering Admissions

Data Warehouse และ Web Dashboard สำหรับวิเคราะห์ข้อมูลรับสมัคร TCAS รอบ 1-4 ของคณะวิศวกรรมศาสตร์ กำแพงแสน ปี 2568 และ 2569 พร้อม governed marts, lineage, quality checks และ social/website analytics layer ที่แสดงเฉพาะข้อมูลจริงหรือข้อมูลที่เก็บจริง

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
  -> dimensional facts, analytics views and marts
  -> markdown report
  -> web dashboard
```

### Social media data pipeline

```text
YouTube API / Facebook public search / authorized social listening export
  -> Neon PostgreSQL social tables
  -> platform / sentiment / keyword views
  -> admissions correlation view
  -> dashboard social impact section with real-source rows only
```

### Public mention pipeline

```text
social listening CSV export
  -> normalized monthly public mention CSV
  -> Neon PostgreSQL social tables
  -> platform / keyword / sentiment analytics
```

### Website analytics pipeline

```text
GA4 Data API
  -> real monthly website analytics CSV
  -> Neon PostgreSQL website analytics tables
  -> admissions correlation views
```

### Governed warehouse and mart layer

```text
core facts and dimensions
  -> dataset catalog + lineage + refresh log
  -> data quality scorecard
  -> presentation marts
  -> dashboard warehouse architecture section
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
| `outputs/etl/aggregate_admissions_all_rounds.py` | Aggregate TCAS round 1-4 Excel files without exporting PII |
| `outputs/etl/load_round3_to_neon.cjs` | Load admissions aggregate data to Neon |
| `outputs/etl/load_admissions_all_rounds_to_neon.cjs` | Load all-round admissions facts, status distribution and source quality to Neon |
| `outputs/etl/load_social_media_to_neon.cjs` | Load real-source social media aggregates to Neon |
| `outputs/etl/fetch_facebook_page_insights.cjs` | Fetch authorized Facebook Page posts and Page Insights metrics |
| `outputs/etl/normalize_social_listening_export.cjs` | Normalize social listening public mention exports into warehouse-ready monthly CSV |
| `outputs/etl/fetch_ga4_website_analytics.cjs` | Fetch aggregate website analytics from GA4 Data API |
| `outputs/etl/load_website_analytics_to_neon.cjs` | Load GA4 website analytics CSV to Neon |
| `outputs/sql/admissions_round3_warehouse.sql` | Admissions warehouse schema |
| `outputs/sql/admissions_all_rounds_warehouse.sql` | All-round admissions facts, source quality and TCAS1-4 mart views |
| `outputs/sql/social_media_warehouse.sql` | Social media warehouse schema and views |
| `outputs/sql/website_analytics_warehouse.sql` | Website analytics schema and admissions correlation views |
| `outputs/sql/warehouse_governance_marts.sql` | Dataset catalog, lineage, refresh log, quality scorecard and presentation marts |
| `outputs/etl/apply_warehouse_governance_marts.cjs` | Idempotently apply base schemas plus governed mart layer to Neon |
| `outputs/reports/` | Generated markdown analytics reports |

`outputs/` is ignored by git because it contains generated artifacts and local deliverables.

---

## Current Results

| Metric | 2568 | 2569 | Change |
|---|---:|---:|---:|
| Application choices, TCAS1-4 | 4,853 | 4,579 | -274 |
| Unique applicants, cross-round | 3,597 | 3,443 | -154 |
| Confirmed applicants, TCAS1-4 | 528 | 545 | +17 |
| Confirmed rate, cross-round | 14.68% | 15.83% | +1.15 pts |
| Displayed social mentions, real sources only | 41 | 41 | 0 |
| Displayed social engagement, real sources only | 259,431 | 113,465 | -145,966 |

---

## Important Notes

- Admissions data comes from user-provided Excel files.
- Personal data is not exported into processed CSV, Neon warehouse tables or the web dashboard.
- The dashboard displays only real/collected social sources: YouTube Data API and a small manual Facebook public-search capture.
- Facebook Page collection is implemented through the official Graph API and requires a Page ID plus Page access token.
- Public mentions from people or pages should come from an authorized social listening export and be normalized before loading.
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
python3 outputs/etl/aggregate_admissions_all_rounds.py
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_admissions_all_rounds_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_social_media_to_neon.cjs
FACEBOOK_PAGE_ID="..." FACEBOOK_PAGE_ACCESS_TOKEN="..." node outputs/etl/fetch_facebook_page_insights.cjs
DATABASE_URL="postgresql://..." SOCIAL_MEDIA_CSV="outputs/real_data/facebook_page_mentions_monthly.csv" NODE_PATH="/path/to/node_modules" node outputs/etl/load_social_media_to_neon.cjs
SOCIAL_LISTENING_EXPORT_CSV="outputs/sample_data/social_listening_export_template.csv" node outputs/etl/normalize_social_listening_export.cjs
DATABASE_URL="postgresql://..." SOCIAL_MEDIA_CSV="outputs/real_data/social_listening_mentions_monthly.csv" NODE_PATH="/path/to/node_modules" node outputs/etl/load_social_media_to_neon.cjs
GA4_PROPERTY_ID="..." GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" node outputs/etl/fetch_ga4_website_analytics.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_website_analytics_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/apply_warehouse_governance_marts.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/export_round3_analytics_report.cjs
```
