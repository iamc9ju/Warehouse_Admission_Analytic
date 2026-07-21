# Admissions Data Warehouse for Engineering Admissions

Data Warehouse และ Web Dashboard สำหรับวิเคราะห์ข้อมูลรับสมัคร TCAS รอบ 1-4
ของคณะวิศวกรรมศาสตร์ กำแพงแสน ปี 2568 และ 2569 พร้อม governed marts,
lineage, quality checks และ owned website analytics layer

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
  -> processed CSV without exported PII
  -> Neon PostgreSQL schema admissions_dw
  -> dimensional facts, analytics views and marts
  -> markdown report
  -> web dashboard
```

### Website analytics pipeline

```text
GA4 Data API for an owned property
  -> aggregate monthly website analytics CSV
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

## Current Scope

This project no longer uses social media ingestion from any channel.

Excluded sources:

- YouTube Data API
- Facebook Page API
- Facebook public search captures
- Social listening exports
- Any other social platform API, scraping flow or public mention feed

Allowed sources:

- User-provided Excel admissions files
- Neon PostgreSQL warehouse objects created from PII-free aggregate data
- GA4 aggregate reports from an owned website property with explicit access

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
| `outputs/etl/fetch_ga4_website_analytics.cjs` | Fetch aggregate website analytics from GA4 Data API |
| `outputs/etl/load_website_analytics_to_neon.cjs` | Load GA4 website analytics CSV to Neon |
| `outputs/sql/admissions_round3_warehouse.sql` | Admissions warehouse schema |
| `outputs/sql/admissions_all_rounds_warehouse.sql` | All-round admissions facts, source quality and TCAS1-4 mart views |
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

---

## Important Notes

- Admissions data comes from user-provided Excel files.
- Personal data is not exported into processed CSV, Neon warehouse tables or the web dashboard.
- Social media ingestion has been removed from the active project scope.
- Website analytics support is limited to GA4 aggregate reports from an owned property.
- Because there are only two academic years in the current dataset, correlation should be presented as a capability demo, not causal proof.

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

Do not commit database credentials, GA4 service account JSON or API secrets.

```bash
python3 outputs/etl/aggregate_round3_admissions.py
python3 outputs/etl/aggregate_admissions_all_rounds.py
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_admissions_all_rounds_to_neon.cjs
GA4_PROPERTY_ID="..." GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" node outputs/etl/fetch_ga4_website_analytics.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_website_analytics_to_neon.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/apply_warehouse_governance_marts.cjs
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/export_round3_analytics_report.cjs
```
