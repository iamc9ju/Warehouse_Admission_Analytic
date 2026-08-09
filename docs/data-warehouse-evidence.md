# Data Warehouse Evidence

## Active Source Catalog

| Coverage | Files | Rows |
|---|---:|---:|
| TCAS1-3 ปี 2567 | 4 | 4,217 |
| TCAS1-4 ปี 2568 | 6 | 4,853 |
| TCAS1-4 ปี 2569 | 5 | 4,579 |
| Total | 15 | 13,649 |

## ETL and Cleaning Contract

- รองรับหัวคอลัมน์ canonical และหัวคอลัมน์ภาษาไทยในไฟล์ปี 2567
- ใช้ HMAC-SHA256 สร้าง `student_token` และ `application_token`
- ไม่ export เลขประจำตัว ชื่อ เบอร์โทร หรืออีเมล
- ทุก source row map แบบ 1:1 ไปยัง grain ของ `fact_admission`
- `score` เป็น numeric และห้าม null
- ทุก fact row ต้อง resolve dimension key ครบทั้งหมด

## Single Fact Evidence

`fact_admission` เป็น physical fact table เพียงตารางเดียว มี 13,649 แถว และ grain คือ
หนึ่งตัวเลือกสมัคร ตารางนี้เชื่อม `dim_student`, `dim_year`, round, project, faculty,
major, program type, status และ source file dimensions

## Dashboard Snapshot Contract

Dashboard artifact สร้างจาก `warehouse/query-results/*.tsv` ซึ่ง export จาก views/marts
ที่ aggregate จาก `fact_admission` เท่านั้น Output คือ
`app/data/generated/warehouse-dashboard-snapshot.json`

Primary runtime คือ server-side Neon query และ fallback คือ generated artifact
โดยทั้งสองเส้นทางใช้ shape เดียวกัน

## Validation Evidence

| Check | Result |
|---|---|
| Row reconciliation | 13,649 source rows = 13,649 fact rows |
| Source files | 15 |
| Missing score | 0 |
| Missing major | 0 |
| Exported direct identity/contact columns | 0 |
| Year coverage | 2567, 2568, 2569 |
| Fact table count | 1 |
