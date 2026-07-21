# Warehouse Query Contract

เอกสารนี้ระบุ query contract ที่ dashboard snapshot ต้องอ้างอิงเมื่อ export ข้อมูลจาก Neon PostgreSQL schema `admissions_dw`

## KPI Snapshot

ใช้กับ KPI cards และ comparison chart

```sql
select
  academic_year,
  application_choices,
  unique_applicants,
  confirmed_applicants,
  confirmed_rate
from admissions_dw.mart_admissions_executive_summary
order by academic_year;
```

Expected rows:

| academic_year | application_choices | unique_applicants | confirmed_applicants | confirmed_rate |
|---:|---:|---:|---:|---:|
| 2568 | 4,853 | 3,597 | 528 | 14.68 |
| 2569 | 4,579 | 3,443 | 545 | 15.83 |

## Round Overview

ใช้กับหน้า Rounds

```sql
select
  academic_year,
  tcas_round_code,
  tcas_round_name,
  choices,
  unique_applicants,
  confirmed_applicants,
  confirmed_rate,
  source_files
from admissions_dw.vw_admission_round_overview
order by academic_year, tcas_round_code;
```

Grain:

```text
academic_year + tcas_round_code
```

Expected active coverage:

```text
2568: TCAS1, TCAS2, TCAS3, TCAS4
2569: TCAS1, TCAS2, TCAS3, TCAS4
```

## Major Conversion

ใช้กับหน้า Majors

```sql
select
  academic_year,
  major_code,
  major_name,
  program_type,
  applicant_count,
  confirmed_count,
  confirmed_rate,
  avg_score
from admissions_dw.mart_major_conversion
order by academic_year, applicant_count desc;
```

Grain:

```text
academic_year + major_code + major_name + program_type
```

## Status Distribution

ใช้กับสถานะ TCAS และ quality-oriented distribution view

```sql
select
  academic_year,
  status_label,
  choices,
  share_pct
from admissions_dw.vw_admission_round_status_distribution
order by academic_year, choices desc;
```

Grain:

```text
academic_year + status_label
```

## Quality Scorecard

ใช้กับหน้า Quality และ audit documentation

```sql
select
  metric_name,
  metric_value,
  source_object,
  validation_rule
from admissions_dw.vw_dw_quality_scorecard
order by metric_name;
```

Required checks:

- `source_rows = 9432`
- `missing_score_rows = 0`
- `missing_major_rows = 0`
- `pii_exported_columns = 0`
- `active_source_groups = 1`
- `source_files = 11`
- `catalog_rows = 7`
- `lineage_edges = 7`

## Export Rule

หลัง query จาก Neon ให้ export เป็น typed snapshot ใน:

```text
app/data/warehouse-snapshot.ts
```

ห้าม export fields ต่อไปนี้ลง snapshot:

- citizen_id
- national_id
- first_name
- last_name
- phone
- email
- raw address or free-text applicant identifiers
