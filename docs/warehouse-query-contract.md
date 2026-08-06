# Warehouse Query Contract

เอกสารนี้ระบุ query contract ที่ dashboard artifact ต้องอ้างอิงเมื่อ export ข้อมูลจาก Neon PostgreSQL schema `admissions_dw`

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

## Business Questions and Decision Insights

ใช้กับหน้า Insights เพื่อ map business question กับ decision mart และ action

```sql
select
  question_id,
  domain,
  question,
  mart_object,
  metrics,
  decision_owner,
  decision_use,
  quality_gate
from admissions_dw.dw_business_question_catalog
order by question_id;
```

```sql
select
  insight_id,
  business_question_id,
  priority,
  category,
  title,
  summary,
  mart_object,
  metric_label,
  metric_value,
  decision,
  recommended_action,
  confidence,
  quality_gate
from admissions_dw.mart_decision_insight
order by priority, insight_id;
```

## Warehouse Health

ใช้กับหน้า Insights และ Quality เพื่อบอก freshness, validation status และ report readiness

```sql
select
  health_id,
  status,
  last_refresh_at,
  freshness_sla_hours,
  source_rows,
  source_files,
  mart_count,
  quality_checks_passed,
  quality_checks_failed,
  pii_exported_columns,
  artifact_checksum,
  notes
from admissions_dw.vw_dw_refresh_health
order by last_refresh_at desc
limit 1;
```

## Export Rule

หลัง query จาก Neon ให้ export query results เป็น TSV ใน:

```text
warehouse/query-results/*.tsv
```

จากนั้นสร้าง dashboard artifact ด้วย:

```bash
npm run data:build
npm run data:validate
```

Generated artifact:

```text
app/data/generated/warehouse-dashboard-snapshot.json
```

Production runtime:

```text
DATABASE_URL configured
  -> app/data/live-neon-dashboard-adapter.ts
  -> server-side query against admissions_dw marts/views
  -> DashboardPage

DATABASE_URL missing or query fails
  -> app/data/generated/warehouse-dashboard-snapshot.json
  -> DashboardPage
```

ห้าม export fields ต่อไปนี้ลง query results หรือ generated artifact:

- citizen_id
- national_id
- first_name
- last_name
- phone
- email
- raw address or free-text applicant identifiers
