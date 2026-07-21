# Data Warehouse Evidence Pack

เอกสารนี้ตอบคำถามที่อาจารย์มักถามเวลาให้คะแนนโปรเจค Data Warehouse:

- Source มาจากไหน และกว้าง/แคบแค่ไหน
- ETL clean และ validate อะไรบ้าง
- Grain ของ fact/mart คืออะไร
- Dashboard query จาก warehouse object ไหน
- Quality metric แต่ละตัวนิยามจาก column/table ไหน
- ข้อจำกัดและ assumption คืออะไร

## Executive Summary

โปรเจคนี้ใช้ active source เพียงกลุ่มเดียวคือ **Admissions Excel files** ของ TCAS รอบ 1-4 ปี 2568 และ 2569 จำนวน 11 files รวม 9,432 source rows

การใช้ source กลุ่มเดียวไม่ใช่ข้อผิดพลาดของ DW เสมอไป ถ้า source นั้นเป็น authoritative operational source ของโจทย์ แต่ต้องทำให้พิสูจน์ได้ว่า:

1. Source มี owner และ scope ชัดเจน
2. ETL ไม่ส่งออก PII
3. Aggregate facts มี grain ชัดเจน
4. Row count และ missing checks reconcile ได้
5. Dashboard ใช้ข้อมูลจาก governed mart/snapshot ไม่ใช่ตัวเลขลอย ๆ

โปรเจคนี้จึงตัด social media ingestion ออกจาก active scope และใช้เฉพาะ admissions facts ที่ audit ได้

## Active Source Catalog

| Dataset | Layer | Grain | Evidence | Sensitivity |
|---|---|---|---|---|
| admissions_excel_files | Source | source_file + academic_year + tcas_round | 11 files / 9,432 rows | Contains PII in source only |
| processed_admissions_aggregates | Staging | year + round + major/status | PII-free CSV aggregates | No PII |
| fact_admission_year_overview | Core fact | academic_year | 2 rows | No PII |
| fact_admission_round_overview | Core fact | academic_year + tcas_round | 8 rows | No PII |
| fact_admission_round_major_summary | Core fact | academic_year + major | 20 displayed rows | No PII |
| admission_round_source_data_quality | Quality fact | source_file | 11 quality records | No PII |
| mart_admissions_executive_summary | Presentation mart | academic_year | dashboard-ready KPI mart | No PII |

## Lineage

```text
Excel admissions files
  -> PII-free processed aggregates
  -> fact_admission_year_overview
  -> fact_admission_round_overview
  -> fact_admission_round_major_summary
  -> admission_round_source_data_quality
  -> mart_admissions_executive_summary
  -> app/data/warehouse-snapshot.ts
  -> dashboard routes
```

Lineage edges used in the UI:

| From | Transform | To |
|---|---|---|
| Excel admissions files | extract, normalize, aggregate | PII-free processed aggregates |
| PII-free processed aggregates | year-level KPI load | fact_admission_year_overview |
| PII-free processed aggregates | round-level KPI load | fact_admission_round_overview |
| PII-free processed aggregates | major conversion load | fact_admission_round_major_summary |
| PII-free processed aggregates | source validation load | admission_round_source_data_quality |
| Core facts + quality facts | presentation mart build | mart_admissions_executive_summary |
| Presentation marts | exported dashboard snapshot | app/data/warehouse-snapshot.ts |

## ETL and Cleaning Contract

### Extract

- Read user-provided Excel admissions files for TCAS1, TCAS2, TCAS3 and TCAS4
- Detect academic year, round, major/project, status, score and applicant identifier fields
- Count source rows per file before transformation

### Transform

- Normalize academic year to Buddhist Era year values: 2568 and 2569
- Normalize TCAS round names into TCAS1, TCAS2, TCAS3, TCAS4
- Normalize major names for grouping and comparison
- Use applicant identifier only in memory to calculate unique applicants
- Aggregate to year, round, major and status grain
- Drop source-only PII before writing processed output

### Load

- Load PII-free aggregates into `admissions_dw`
- Upsert by natural grain to make reruns idempotent
- Build presentation marts/views for dashboard
- Export dashboard snapshot into `app/data/warehouse-snapshot.ts`

## Validation Checks

| Check | Evidence | Expected Result |
|---|---|---|
| Row reconciliation | 9,432 source rows read from 11 files | Pass |
| PII boundary | 0 exported PII columns | Pass |
| Major mapping | 0 missing major rows before major fact load | Pass |
| Score completeness | 0 missing score rows in active snapshot | Pass |
| Round coverage | TCAS1-4 represented for both 2568 and 2569 | Pass |
| Social exclusion | 0 social media source groups in active warehouse scope | Pass |

## Dashboard Snapshot Contract

The public dashboard does not connect directly to Neon from the browser. It uses an exported snapshot so database credentials are not shipped to the client.

Snapshot file:

```text
app/data/warehouse-snapshot.ts
```

Snapshot metadata:

```text
sourceSystem: Neon PostgreSQL
schema: admissions_dw
dashboardMode: exported warehouse snapshot
exportedAt: 2026-07-21
sourceQuery: mart_admissions_executive_summary + mart_major_conversion + vw_admission_round_overview
```

This improves the older static-data design because the numbers are now separated from the UI component and include explicit warehouse provenance.

## Known Limitations

- The active admissions dataset covers only two academic years, so trend analysis is descriptive, not predictive.
- The project does not include interview outcome, enrolled outcome, province or applicant-level timeline facts.
- GA4/owned website analytics remains a permitted future source, but it is not used as an active dashboard source unless a valid owned property returns useful aggregate rows.
- Social media ingestion is intentionally excluded from active scope.
- Dashboard is not real-time; if the warehouse changes, export the snapshot again.

## How This Addresses Grading Risks

| Previous concern | Fix |
|---|---|
| Source หลักยังแคบ | Clarified source scope and explained why one authoritative source is acceptable |
| Data catalog/lineage ยังไม่ชัด | Added catalog rows and lineage edges in docs and UI |
| ETL/validation evidence ยังไม่เป็นระบบ | Added ETL contract and validation checks |
| Dashboard ดู static | Moved values into a warehouse snapshot with source query contract |
| Quality metric ไม่ได้นิยาม | Added metric definitions, source objects and validation rules |
| README/report ยังไม่ครบ | Added this evidence pack and updated project docs |
