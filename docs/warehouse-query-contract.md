# Warehouse Query Contract

Dashboard queries use Neon PostgreSQL schema `admissions_dw`. Every object below derives from
`admissions_dw.fact_admission`.

## KPI Snapshot

```sql
select academic_year, application_choices, unique_applicants,
       confirmed_applicants, confirmed_rate, source_files, avg_score
from admissions_dw.mart_admissions_executive_summary
order by academic_year;
```

Expected years and row counts:

| Year | Choices | Unique applicants | Confirmed |
|---:|---:|---:|---:|
| 2567 | 4,367 | 3,353 | 524 |
| 2568 | 4,853 | 3,597 | 528 |
| 2569 | 4,579 | 3,443 | 545 |

## Round Overview

```sql
select academic_year, tcas_round_code, tcas_round_name, choices,
       unique_applicants, confirmed_applicants, confirmed_rate, source_files
from admissions_dw.vw_admission_round_overview
order by academic_year, tcas_round_code;
```

Coverage is TCAS1-4 for 2567-2569.

## Major Conversion

```sql
select academic_year, major_code, major_name, program_type,
       applicant_count, confirmed_count, confirmed_rate, avg_score, applicant_change
from admissions_dw.mart_major_conversion
order by academic_year, applicant_count desc;
```

## Quality Scorecard

```sql
select metric_name, metric_value, source_object, validation_rule
from admissions_dw.vw_dw_quality_scorecard
order by metric_name;
```

Critical checks are source rows 13,799, source files 16, missing score 0,
missing major 0, exported direct identity/contact columns 0 and physical fact tables 1.

## Export

Export query results to `warehouse/query-results/*.tsv`, then run:

```bash
npm run data:build
npm run data:validate
```

Generated output: `app/data/generated/warehouse-dashboard-snapshot.json`

The query results and artifact must never include direct identity/contact fields or hash salt.
