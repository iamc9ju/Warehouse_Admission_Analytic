# Processed Admissions Data

The active ETL creates two local files:

| File | Grain | Privacy |
|---|---|---|
| `admissions_fact_2567_2569.csv` | one application choice | opaque student/application tokens; no direct identity/contact fields |
| `admissions_source_quality_2567_2569.csv` | one source workbook | counts and quality metrics only |

`admissions_fact_2567_2569.csv` contains every dimension business key plus `priority` and `score`.
The Neon loader resolves these keys to surrogate keys in `fact_admission`.

These generated files remain ignored by Git because the student token is pseudonymous data.
