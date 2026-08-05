# Production Data Warehouse Runbook

เอกสารนี้เป็น runbook สำหรับทำให้โปรเจค TCAS DW อยู่ในระดับ production-grade และตรวจซ้ำได้

## Production Rules

- ห้ามใช้ embedded/static dashboard data ใน `app/`
- Dashboard data ต้องมาจาก generated warehouse artifact หรือ live warehouse adapter เท่านั้น
- Production runtime ต้องใช้ server-side Neon adapter เป็น primary เมื่อมี `DATABASE_URL`
- Generated artifact เป็น fallback สำหรับ local/demo หรือช่วง Neon query fail
- Source active scope คือ admissions warehouse data ที่ไม่มี PII ใน output
- Social media ingestion ไม่อยู่ใน active production scope
- ทุก refresh ต้องผ่าน validation gate ก่อน build

## Data Flow

```text
Admissions Excel source files
  -> ETL normalize and aggregate
  -> PII-free staging aggregates
  -> admissions_dw core facts and dimensions
  -> governed marts and quality views
  -> warehouse/query-results/*.tsv
  -> app/data/generated/warehouse-dashboard-snapshot.json
  -> route-level loader with live Neon primary / artifact fallback
  -> dashboard UI
```

## Grain Contract

| Dataset | Grain |
|---|---|
| `mart_admissions_executive_summary` | `academic_year` |
| `vw_admission_round_overview` | `academic_year + tcas_round_code` |
| `mart_major_conversion` | `academic_year + major_code + major_name + program_type` |
| `vw_admission_round_status_distribution` | `academic_year + status_label` |
| `vw_dw_quality_scorecard` | `metric_name + source_object` |
| `dw_dataset_catalog` | `dataset` |
| `dw_lineage_edge` | `from_object + to_object + transform` |

## Refresh Procedure

1. Run ETL against the admissions source files.
2. Load PII-free aggregates into `admissions_dw`.
3. Rebuild governed marts and quality scorecard.
4. Export mart/query results into `warehouse/query-results/*.tsv`.
5. Build the dashboard artifact:

```bash
npm run data:build
```

6. Validate the artifact:

```bash
npm run data:validate
```

7. Check that app code has no embedded dashboard data:

```bash
npm run data:check-static
```

8. Run full verification:

```bash
npm test
```

## Live Neon Runtime

Set a server-only database URL in the runtime environment:

```bash
DATABASE_URL="postgresql://..." npm run dev
```

Loader behavior:

```text
DATABASE_URL exists
  -> query admissions_dw marts/views server-side
  -> dashboard runtime source = live-neon

DATABASE_URL missing or query fails
  -> use generated artifact
  -> dashboard runtime source = generated-artifact
```

`DATABASE_URL` must never be imported into client components or exposed in rendered HTML.

## Quality Gates

| Gate | Required result |
|---|---|
| Source rows | `9,432` reconciled rows |
| Active source groups | `1` |
| Source files | `11` |
| Missing score | `0` |
| Missing major | `0` |
| PII exported | `0 columns` |
| Round coverage | TCAS1-4 for 2568 and 2569 |
| ETL checks | all `pass` |

## Monitoring Targets

Production refresh should track:

- `dw_refresh_run.started_at`
- `dw_refresh_run.finished_at`
- `dw_refresh_run.status`
- source file count
- source row count
- failed validation count
- dashboard artifact checksum
- mart row counts

## CI Policy

Every production candidate must pass:

```bash
npm run lint
npm test
```

The test command includes data build, validation, no-static-data enforcement, application build and rendered HTML checks.
