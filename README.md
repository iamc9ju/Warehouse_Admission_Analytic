# Admissions Data Warehouse for Engineering Admissions

Data Warehouse และ Web Dashboard สำหรับวิเคราะห์ข้อมูลรับสมัครคณะวิศวกรรมศาสตร์
กำแพงแสน ครอบคลุม TCAS รอบ 1-3 ปี 2567 และรอบ 1-4 ปี 2568-2569

## Architecture

```text
Excel admissions files
  -> normalize Thai/English column names
  -> HMAC-SHA256 student/application tokens
  -> PII-safe application staging
  -> conformed dimensions
  -> fact_admission (one application choice, includes score)
  -> governed views and marts
  -> generated dashboard artifact
  -> web dashboard
```

`fact_admission` เป็น physical fact table เพียงตารางเดียว และมี foreign key ไปยัง:

- `dim_student`
- `dim_year`
- `dim_tcas_round`
- `dim_project`
- `dim_faculty`
- `dim_major`
- `dim_program_type`
- `dim_tcas_status`
- `dim_source_file`

Grain คือหนึ่งแถวต่อหนึ่งตัวเลือกสมัครจาก source workbook และเก็บ `score` ที่ grain นี้โดยตรง

## Source coverage

| ปีการศึกษา | รอบ | ไฟล์ | Source rows |
|---:|---|---:|---:|
| 2567 | TCAS1-3 | 4 | 4,217 |
| 2568 | TCAS1-4 | 6 | 4,853 |
| 2569 | TCAS1-4 | 5 | 4,579 |
| รวม |  | 15 | 13,649 |

ไฟล์ปี 2567 ที่เพิ่ม:

- `1_67_1.xlsx`
- `1_67_2.xlsx`
- `2_67.xlsx`
- `3_67.xlsx`

## Privacy boundary

ETL ใช้เลขประจำตัวผู้สมัครเฉพาะในหน่วยความจำเพื่อสร้าง token แบบ HMAC-SHA256
และไม่นำเลขประจำตัว ชื่อ เบอร์โทร หรืออีเมลออกจาก source boundary ต้องกำหนด
`ADMISSIONS_STUDENT_HASH_SALT` อย่างน้อย 16 ตัวอักษรก่อนรัน ETL และห้าม commit ค่านี้

## Key files

| Path | Purpose |
|---|---|
| `outputs/etl/aggregate_admissions_all_rounds.py` | อ่านไฟล์ปี 2567-2569 สร้าง PII-safe fact staging และ dashboard query results |
| `outputs/etl/load_admissions_all_rounds_to_neon.cjs` | โหลด dimensions, single fact และ source quality เข้า Neon แบบ idempotent |
| `outputs/sql/admissions_all_rounds_warehouse.sql` | สคีมา dimensions, `fact_admission` และ core views |
| `outputs/sql/warehouse_governance_marts.sql` | catalog, lineage, quality scorecard และ presentation marts |
| `warehouse/query-results/*.tsv` | query-result contract สำหรับ generated dashboard artifact |
| `scripts/build-dashboard-snapshot.mjs` | สร้าง dashboard artifact |
| `scripts/validate-dashboard-snapshot.mjs` | ตรวจ coverage, score, PII boundary และ single-fact contract |
| `app/data/live-neon-dashboard-adapter.ts` | live server-side Neon adapter พร้อม artifact fallback |

## Local workflow

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
python3 outputs/etl/aggregate_admissions_all_rounds.py
npm run data:build
npm run data:validate
npm run data:check-static
npm run build
```

โหลดเข้า Neon:

```bash
DATABASE_URL="postgresql://..." node outputs/etl/load_admissions_all_rounds_to_neon.cjs
```

ห้าม commit `DATABASE_URL`, hash salt หรือข้อมูลระบุตัวบุคคลจาก Excel ต้นทาง

## Current KPI snapshot

| ปี | Application choices | Unique applicants | Confirmed | Confirmed rate |
|---:|---:|---:|---:|---:|
| 2567 | 4,217 | 3,253 | 498 | 15.31% |
| 2568 | 4,853 | 3,597 | 528 | 14.68% |
| 2569 | 4,579 | 3,443 | 545 | 15.83% |

Dashboard runtime ใช้ Neon marts ฝั่ง server เป็น primary และใช้ generated artifact เป็น fallback
โดยไม่ส่ง database credentials ไปยัง browser
