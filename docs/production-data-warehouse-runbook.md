# Production Data Warehouse Runbook

## Refresh

1. เตรียม PII-safe fact staging ด้วย ingestion process ที่ได้รับอนุมัติ
2. กำหนด `ADMISSIONS_STUDENT_HASH_SALT` อย่างน้อย 16 ตัวอักษร
3. โหลด dimensions และ `fact_admission` เข้า Neon
4. รัน SQL schema/views/marts
5. ตรวจ live dashboard queries และ quality gates

Loader จะรักษา token เดิมของแถวที่มี `source_file + source_row_number` ตรงกับฐานข้อมูล
และใช้ mapping นี้เชื่อมผู้สมัครเดิมที่ปรากฏในไฟล์ใหม่ เพื่อไม่ให้ pseudonymous identity เปลี่ยนเมื่อหมุน hash salt

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
DATABASE_URL="postgresql://..." node outputs/etl/load_admissions_all_rounds_to_neon.cjs
# Apply outputs/sql/warehouse_governance_marts.sql
npm run data:check-static
npm test
```

## Go/No-Go gates

- source rows = fact rows
- source files = 16
- missing score = 0
- missing major = 0
- dimension coverage = complete
- direct identity/contact columns exported = 0
- `fact_admission` เป็น physical fact table เดียว
- TCAS1-4 ครบในปี 2567-2569

ห้ามเผยแพร่เมื่อ gate ใดล้มเหลว และห้าม commit database URL, hash salt หรือ source PII

## Major/program-type migration (2026-09-23)

1. Run `node --env-file=.env scripts/audit-major-types.mjs` before migration.
2. Run `node --env-file=.env scripts/migrate-major-types.mjs expand`.
3. Build and test the updated app (major_key-based chart identity).
4. Run `node --env-file=.env scripts/migrate-major-types.mjs finalize` last.

Both migration stages run in a transaction, reject mismatched program types, compare
all warehouse view metrics, and verify unchanged fact counts. Finalization uses
RESTRICT, never CASCADE. Local schema/type backups are under outputs/migrations;
they contain no student records. The migration expects the pre-migration column/table
to exist and is not a recurring refresh command.

After migration, loaders must write only major_key for the major/program variant.
The historical loader referenced above is not present in this repository; external
copies must be updated before the next ingestion. Current dashboard queries no longer
use dim_program_type.
