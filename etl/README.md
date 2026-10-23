# Admissions ETL — local prototype

This pipeline reads a per-year/per-round UTF-8 CSV, validates and tokenizes it,
then optionally loads a local SQLite warehouse. It does not import `pg`, read
`DATABASE_URL`, apply warehouse SQL, or connect to Neon. Existing loaders are unchanged.
Node 22.13+ with `node:sqlite` is required for local loading and tests.

```powershell
# Use one stable PRIVATE salt for your local experiments; do not commit its value.
$env:ADMISSIONS_STUDENT_HASH_SALT = '<private value of at least 16 characters>'
npm run etl:validate -- --file "C:\Users\koath\Downloads\1_69.csv" --year 2569 --round TCAS1
npm run etl:load-local -- --file "C:\Users\koath\Downloads\1_69.csv" --year 2569 --round TCAS1
npm run etl:test
```

Local databases are restricted to ignored `.etl-local/*.sqlite`. `--db demo.sqlite`
selects another local test file. A successful load records checksum and counts in
`etl_runs`; an invalid batch is rejected before loading. Failed transactions leave
no partial facts/dimensions; error details remain in the CLI validation report.
Reports contain record numbers and field/error codes, never raw identity values.
Do not commit source CSVs, salts or local databases.

## Input contract

Required headers: `citizen_id, project_id, major_id, major_name, major_type,
fac_id, fac_name, score, priority, tcas_status, applicant_status`.
Other columns are discarded. Identifiers are strings; citizen IDs must contain
13 digits (format check only). Score is required and must fit NUMERIC(12,4).
Priority may be blank and must fit NUMERIC(10,4); applicant_status may be blank
or a PostgreSQL INTEGER. No unverified score range or status whitelist is assumed.
Year and round must be explicitly supplied; they are not inferred from filename
or project_id. Ensure each file really belongs to the supplied year/round.
`source_row_number` counts CSV records including the header, not physical lines
when fields contain line breaks. `--source stable.csv` can override the source label.

## Identity and updates

Student HMAC uses the historical `student:<citizen_id>` payload. Application v2
identity includes year, round, citizen ID, project, faculty, major ID/type and
priority, excluding score/status, source filename and row order. Duplicate
identities within one file are rejected for review. Score/status corrections
update the same fact; new files and rounds do not delete existing records.
Changes to identity fields create new facts; automatic deletion, reconciliation
and replacing complete year/round snapshots are intentionally not implemented.
Repeated loads count matching rows as updated even if business values are unchanged.

The local adapter has six dimensions, foreign keys, temporary staging, transaction
rollback and a run log. SQLite is a behavioral test adapter, not a PostgreSQL
compatibility test. Its NUMERIC and timestamp behavior differs from PostgreSQL.

## Before any future production integration

Application v2 tokens differ from historical source-row tokens. CSV filename/row
matching alone is insufficient proof of identity after reordering or Excel-to-CSV
conversion. Existing Neon student identities also require verification against the
original salt. A reviewed migration/reconciliation plan is required before loading
historical data into Neon. Test PostgreSQL constraints, actual status/major mappings,
token continuity and dashboard totals in a separate PostgreSQL database first.
This prototype provides no production load command.
