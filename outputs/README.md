# Admissions Warehouse Outputs

โฟลเดอร์นี้เก็บ generated artifacts และ local deliverables ของ Admissions Data Warehouse

## Active Outputs

| Path | Purpose |
|---|---|
| `processed/` | PII-free admissions aggregate CSV |
| `etl/aggregate_round3_admissions.py` | Aggregate TCAS round 3 Excel files |
| `etl/aggregate_admissions_all_rounds.py` | Aggregate TCAS round 1-4 Excel files |
| `etl/load_round3_to_neon.cjs` | Load round 3 aggregate facts to Neon |
| `etl/load_admissions_all_rounds_to_neon.cjs` | Load all-round admissions facts to Neon |
| `etl/fetch_ga4_website_analytics.cjs` | Fetch aggregate GA4 data from an owned website property |
| `etl/load_website_analytics_to_neon.cjs` | Load GA4 aggregate CSV to Neon |
| `etl/apply_warehouse_governance_marts.cjs` | Apply admissions, website analytics and governance marts |
| `sql/` | Warehouse schema, views and marts |
| `reports/` | Generated markdown analytics reports |
| `real_data/` | Active real-data outputs for owned website analytics |

## Removed From Active Scope

Social media ingestion is no longer part of the active project scope.

Do not use historical outputs or scripts related to:

- YouTube Data API
- Facebook Page API
- Facebook public search
- Social listening exports
- Public social mentions
- Social scraping or unofficial collectors

These files may remain locally as historical artifacts, but new dashboard, mart and report work should rely on admissions facts and owned website analytics only.

## Validation

Run from the project root:

```bash
npm test
```

`npm run lint` should be treated separately if generated `outputs/` scripts are still included in ESLint scope.
