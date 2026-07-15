# System Overview

โปรเจกต์นี้เป็น Data Warehouse สำหรับวิเคราะห์ TCAS รอบ 3 ของคณะวิศวกรรมศาสตร์ กำแพงแสน โดยแยกงานเป็นชั้นข้อมูลชัดเจนตั้งแต่ source, staging, core warehouse, mart และ dashboard

## Data Flow

```text
Excel / APIs / Manual public-search CSV
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
| Source | Original files/API responses kept outside core warehouse | Excel files, GA4 API, YouTube API, manual Facebook search sample |
| Staging | PII-free intermediate aggregates | `outputs/processed/*.csv`, `outputs/real_data/*.csv` |
| Core | Dimensional warehouse model | `dim_*`, `fact_*` tables in `admissions_dw` |
| Mart | Dashboard-ready presentation views | `mart_admissions_executive_summary`, `mart_major_conversion`, `mart_channel_effectiveness` |
| Governance | Metadata, lineage and data quality | `dw_dataset_catalog`, `dw_lineage_edge`, `dw_refresh_run`, quality views |

## Dimensional Model

The core warehouse uses a star-schema style model:

- Admissions facts are keyed by academic year, TCAS round, faculty, major and status.
- Social facts are keyed by academic year, month, platform, keyword and sentiment.
- Website facts are keyed by academic year, month, channel group and landing page.
- Dimensions are conformed where possible so BI queries can group consistently by year, major, platform, channel and sentiment.

## Privacy Boundary

Raw applicant identifiers are used only during local aggregation to count unique applicants. They are not written to processed CSV, Neon tables, reports or dashboard output.

## Current Caveats

- Admissions Excel data is reliable aggregate source data for 2568 and 2569.
- YouTube rows are fetched from the public YouTube Data API.
- Facebook public mentions currently include a small manual public-search sample, not full social listening coverage.
- GA4 property is configured, but traffic collection only becomes useful after the deployed dashboard receives traffic.
