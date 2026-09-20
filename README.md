# Admissions Data Warehouse for Engineering Admissions

Data Warehouse และ Web Dashboard สำหรับวิเคราะห์ข้อมูลรับสมัครคณะวิศวกรรมศาสตร์
กำแพงแสน ครอบคลุม TCAS รอบ 1-4 ปี 2567-2569

## Architecture

```text
Excel admissions files
  -> normalize Thai/English column names
  -> HMAC-SHA256 student/application tokens
  -> PII-safe application staging
  -> conformed dimensions
  -> fact_admission (one application choice, includes score)
  -> governed views and marts
  -> server-side TypeScript repositories
  -> web dashboard (Neon-only)
```

`fact_admission` เป็น physical fact table เพียงตารางเดียว และมี foreign key ไปยัง:

- `dim_student`
- `dim_year`
- `dim_tcas_round`
- `dim_faculty`
- `dim_major`
- `dim_program_type`
- `dim_tcas_status`

`source_file` เก็บเป็น degenerate dimension ใน `fact_admission` โดยตรง เพราะไม่มี attribute อื่นที่ต้องแยกเป็นตาราง

Grain คือหนึ่งแถวต่อหนึ่งตัวเลือกสมัครจาก source workbook และเก็บ `score` ที่ grain นี้โดยตรง

## Source coverage

| ปีการศึกษา | รอบ | ไฟล์ | Source rows |
|---:|---|---:|---:|
| 2567 | TCAS1-4 | 5 | 4,367 |
| 2568 | TCAS1-4 | 6 | 4,853 |
| 2569 | TCAS1-4 | 5 | 4,579 |
| รวม |  | 16 | 13,799 |

ไฟล์ปี 2567 ที่เพิ่ม:

- `1_67_1.xlsx`
- `1_67_2.xlsx`
- `2_67.xlsx`
- `3_67.xlsx`
- `ku_4_67.xlsx`

## Privacy boundary

ETL ใช้เลขประจำตัวผู้สมัครเฉพาะในหน่วยความจำเพื่อสร้าง token แบบ HMAC-SHA256
และไม่นำเลขประจำตัว ชื่อ เบอร์โทร หรืออีเมลออกจาก source boundary ต้องกำหนด
`ADMISSIONS_STUDENT_HASH_SALT` อย่างน้อย 16 ตัวอักษรก่อนรัน ETL และห้าม commit ค่านี้

## Key files

| Path | Purpose |
|---|---|
| `outputs/etl/load_admissions_all_rounds_to_neon.cjs` | โหลด dimensions และ single fact เข้า Neon แบบ idempotent |
| `outputs/sql/admissions_all_rounds_warehouse.sql` | สคีมา dimensions, `fact_admission` และ core views |
| `outputs/sql/warehouse_governance_marts.sql` | presentation marts สำหรับ Dashboard และ Insights |
| `app/data/repositories/*.ts` | Query แต่ละ domain จาก Neon |
| `app/data/live-neon-dashboard-adapter.ts` | server-side Neon adapter สำหรับแต่ละหน้า |

## Local workflow

```bash
export ADMISSIONS_STUDENT_HASH_SALT="replace-with-a-secret-value"
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
| 2567 | 4,367 | 3,353 | 524 | 15.63% |
| 2568 | 4,853 | 3,597 | 528 | 14.68% |
| 2569 | 4,579 | 3,443 | 545 | 15.83% |

Dashboard runtime ใช้ Neon marts ฝั่ง server เท่านั้น โดยไม่ส่ง database credentials ไปยัง browser
หากไม่ได้กำหนด `DATABASE_URL` หรือ Neon ใช้งานไม่ได้ หน้าเว็บจะแสดงข้อผิดพลาดแทนข้อมูลเก่า
