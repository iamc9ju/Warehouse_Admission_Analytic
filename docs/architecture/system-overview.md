# System Overview

โปรเจกต์นี้เป็น Data Warehouse สำหรับวิเคราะห์ TCAS รอบ 1-4 ของคณะวิศวกรรมศาสตร์ กำแพงแสน โดยแยกงานเป็นชั้นข้อมูลชัดเจนตั้งแต่ source, staging, core warehouse, mart และ dashboard

## Data Flow

```text
Excel admissions files / owned GA4 aggregate reports
  -> ETL extract and normalization scripts
  -> PII-free processed CSV
  -> Neon PostgreSQL admissions_dw schema
  -> conformed dimensions and aggregate fact tables
  -> quality, lineage and mart views
  -> web dashboard and markdown reports
```

## Warehouse Layers

| Layer | Purpose | Main Objects |
|---|---|---|
| Source | Original files/API responses kept outside core warehouse | Excel files, owned GA4 reports |
| Staging | PII-free intermediate aggregates | `outputs/processed/*.csv`, website analytics CSV/JSON |
| Core | Dimensional warehouse model | `dim_*`, `fact_*` tables in `admissions_dw` |
| Mart | Dashboard-ready presentation views | `mart_admissions_executive_summary`, `mart_major_conversion`, TCAS summary marts |
| Governance | Metadata, lineage and data quality | `dw_dataset_catalog`, `dw_lineage_edge`, `dw_refresh_run`, quality views |

## Dimensional Model

The core warehouse uses a star-schema style model:

- Admissions facts are keyed by academic year, TCAS round, faculty, major and status.
- Website facts are keyed by academic year, month, channel group and landing page.
- Dimensions are conformed where possible so BI queries can group consistently by year, major and owned website channel.

## Privacy Boundary

Raw applicant identifiers are used only during local aggregation to count unique applicants. They are not written to processed CSV, Neon tables, reports or dashboard output.

## Current Caveats

- Admissions Excel data is reliable aggregate source data for 2568 and 2569.
- Social media ingestion has been removed from the active project scope.
- GA4 property is configured, but traffic collection only becomes useful after the deployed dashboard receives traffic.
