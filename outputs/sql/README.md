# Admissions Warehouse SQL

`admissions_all_rounds_warehouse.sql` defines all conformed dimensions and the only physical fact,
`fact_admission`. The fact grain is one application choice and includes every dimension key plus `score`.

`warehouse_governance_marts.sql` defines catalog, lineage, quality scorecard and dashboard-facing marts.
All metrics aggregate from `fact_admission`; no summary fact tables are persisted.

Apply and load through:

```bash
DATABASE_URL="postgresql://..." node outputs/etl/load_admissions_all_rounds_to_neon.cjs
```
