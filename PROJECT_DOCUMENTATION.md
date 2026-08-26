# Project Documentation

## Objective

ระบบนี้วิเคราะห์ข้อมูลรับสมัคร TCAS ของคณะวิศวกรรมศาสตร์ กำแพงแสน
โดยรวมข้อมูลรอบ 1-4 ปี 2567-2569 ไว้ใน dimensional warehouse
ที่มี physical fact table เพียงตารางเดียว

## Data model

Grain ของ `fact_admission` คือหนึ่งตัวเลือกสมัครต่อหนึ่งแถวใน Excel ต้นทาง ตาราง fact มี:

- foreign key ครบทุก dimension: student, year, round, project, faculty, major, program type, status และ source file
- `source_row_number`
- `priority`
- `score` แบบ `NUMERIC(12,4)` และ `NOT NULL`
- `application_count = 1`

`dim_student` เก็บเฉพาะ token แบบ HMAC-SHA256 ไม่เก็บเลขประจำตัว ชื่อ เบอร์โทร หรืออีเมล
`dim_year` แยกปีการศึกษาออกจาก fact อย่างชัดเจน

## ETL

`outputs/etl/aggregate_admissions_all_rounds.py` ทำงานดังนี้:

1. อ่าน 16 source workbooks
2. map หัวคอลัมน์ภาษาไทยของปี 2567 ให้ตรง canonical schema
3. ตรวจ required columns และ source identity
4. แปลง score, priority และ applicant status เป็นชนิดตัวเลข
5. สร้าง `student_token` และ `application_token` ด้วย HMAC-SHA256
6. ส่งออก PII-safe fact staging และ source quality
7. สร้าง warehouse query results สำหรับ dashboard

ผลตรวจล่าสุด:

- 13,799 source/fact rows
- 16 source files
- 10,158 pseudonymous students ข้ามปี/รอบ
- missing score 0
- missing major 0
- exported direct-identity columns 0

## Warehouse load

`outputs/etl/load_admissions_all_rounds_to_neon.cjs` โหลดข้อมูลผ่าน temporary staging table แล้ว:

1. รักษา application/student tokens เดิมด้วย `source_file + source_row_number` และเชื่อมผู้สมัครซ้ำข้ามไฟล์
2. upsert dimensions ทั้งหมด
3. resolve dimension keys ทุกแถว
4. upsert `fact_admission` ด้วย `application_token`
5. ลบ fact rows ที่ไม่อยู่ใน active staging snapshot
6. upsert source quality rows
7. ตรวจว่า staging rows เท่ากับ fact rowsและ score ไม่มี null

Legacy aggregate facts และ secondary analytics facts ถูกถอดออกจาก active schema โดย migration SQL

## Analytics layer

Core views และ marts ทั้งหมด aggregate จาก `fact_admission`:

- `vw_admission_year_overview`
- `vw_admission_round_overview`
- `vw_admission_round_status_distribution`
- `mart_tcas_year_summary`
- `mart_tcas_round_summary`
- `mart_major_round_conversion`
- `mart_admissions_executive_summary`
- `mart_major_conversion`
- `mart_round_efficiency`
- `mart_status_friction`
- `mart_admissions_year_change`
- `mart_major_year_change`
- `mart_major_opportunity`
- `mart_program_type_mix`

## Dashboard flow

```text
fact_admission
  -> warehouse views/marts
  -> warehouse/query-results/*.tsv
  -> app/data/generated/warehouse-dashboard-snapshot.json
  -> route-level loader
  -> dashboard pages
```

เมื่อมี `DATABASE_URL` ตัว loader จะ query Neon ฝั่ง server ก่อน หาก query ไม่พร้อมจึง fallback ไป generated artifact

## Refresh runbook

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
python3 outputs/etl/aggregate_admissions_all_rounds.py
DATABASE_URL="postgresql://..." node outputs/etl/load_admissions_all_rounds_to_neon.cjs
npm run data:build
npm run data:validate
npm run data:check-static
npm test
```

ก่อน publish ต้องผ่าน row reconciliation, dimension coverage, missing score, missing major,
PII boundary, round coverage และ single-fact checks ทั้งหมด
