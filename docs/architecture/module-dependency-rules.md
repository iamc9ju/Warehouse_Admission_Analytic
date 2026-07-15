# Module Dependency Rules

This repository is intentionally small, but it still follows warehouse boundaries so future contributors can extend it safely.

## Allowed Direction

```text
source files / APIs
  -> outputs/etl
  -> outputs/processed or outputs/real_data
  -> outputs/sql
  -> reports / app
```

## Rules

- ETL scripts may read source files and write processed aggregate outputs.
- ETL scripts may apply SQL files and load Neon PostgreSQL.
- SQL files define warehouse tables, views, marts, quality checks and governance metadata.
- The web app reads curated dashboard values and should not contain raw PII or credentials.
- Reports and docs may reference aggregate outputs only.
- Secrets must stay in local `.env` or provider settings; never commit database URLs, API keys or service account JSON.

## Data Warehouse Conventions

- Prefix dimensions with `dim_`.
- Prefix facts with `fact_`.
- Prefix reusable analytics views with `vw_`.
- Prefix presentation marts with `mart_`.
- Prefix warehouse governance metadata with `dw_`.
- Keep grains explicit in table and view documentation.
- Prefer idempotent loads using `ON CONFLICT DO UPDATE`.
- Keep manual or sample data labelled clearly so it is not presented as full coverage.

## Dashboard Boundary

The dashboard is a presentation layer. If a calculation becomes reusable, it should be moved into a SQL view or mart first, then surfaced in the web app.
