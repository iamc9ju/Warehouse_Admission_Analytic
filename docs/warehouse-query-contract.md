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

## Runtime

Server-side TypeScript repositories query these live Neon views directly. There is no TSV or JSON
dashboard fallback. `DATABASE_URL` is required at runtime, and direct identity/contact fields or
the hash salt must never be selected by dashboard queries.
