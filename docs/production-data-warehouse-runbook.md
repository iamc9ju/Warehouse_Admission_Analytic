# Production Data Warehouse Runbook

## Refresh

1. วาง source files ตาม path ที่กำหนดใน `aggregate_admissions_all_rounds.py`
2. กำหนด `ADMISSIONS_STUDENT_HASH_SALT` อย่างน้อย 16 ตัวอักษร
3. รัน ETL เพื่อสร้าง PII-safe fact staging และ query results
4. โหลด dimensions และ `fact_admission` เข้า Neon
5. สร้างและตรวจ dashboard artifact

Loader จะรักษา token เดิมของแถวที่มี `source_file + source_row_number` ตรงกับฐานข้อมูล
และใช้ mapping นี้เชื่อมผู้สมัครเดิมที่ปรากฏในไฟล์ใหม่ เพื่อไม่ให้ pseudonymous identity เปลี่ยนเมื่อหมุน hash salt

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
python3 outputs/etl/aggregate_admissions_all_rounds.py
DATABASE_URL="postgresql://..." node outputs/etl/load_admissions_all_rounds_to_neon.cjs
npm run data:build
npm run data:validate
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
