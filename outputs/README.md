# Admissions Warehouse Outputs

Generated/local deliverables for the single-fact admissions warehouse.

| Path | Purpose |
|---|---|
| `etl/aggregate_admissions_all_rounds.py` | Normalize 15 Excel files, tokenize student/application identity and build fact staging/query results |
| `etl/load_admissions_all_rounds_to_neon.cjs` | Load every dimension and `fact_admission` |
| `etl/apply_warehouse_governance_marts.cjs` | Reapply catalog, lineage, quality and marts |
| `processed/admissions_fact_2567_2569.csv` | Local PII-safe application-grain staging (ignored by Git) |
| `processed/admissions_source_quality_2567_2569.csv` | Local source-file quality rows (ignored by Git) |
| `sql/admissions_all_rounds_warehouse.sql` | Dimension, single-fact and core view definitions |
| `sql/warehouse_governance_marts.sql` | Governance objects and presentation marts |

Run from the project root with a secret salt:

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
python3 outputs/etl/aggregate_admissions_all_rounds.py
npm test
```
