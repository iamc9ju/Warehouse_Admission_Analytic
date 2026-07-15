# Admissions Round 3 Warehouse SQL

ไฟล์ `admissions_round3_warehouse.sql` ใช้สร้าง schema `admissions_dw` สำหรับข้อมูล aggregate TCAS รอบ 3 ปี 2568 และ 2569

---

## Created Objects

Base tables:

- `admissions_dw.dim_tcas_round`
- `admissions_dw.dim_faculty`
- `admissions_dw.dim_major`
- `admissions_dw.dim_tcas_status`
- `admissions_dw.fact_admission_round_year_summary`
- `admissions_dw.fact_admission_round_major_summary`
- `admissions_dw.fact_admission_round_status_summary`
- `admissions_dw.admission_round_data_quality`

Views:

- `admissions_dw.vw_round3_year_overview`
- `admissions_dw.vw_round3_major_performance`
- `admissions_dw.vw_round3_status_summary`
- `admissions_dw.vw_round3_year_comparison`
- `admissions_dw.vw_social_media_year_overview`
- `admissions_dw.vw_social_media_platform_summary`
- `admissions_dw.vw_social_media_keyword_summary`
- `admissions_dw.vw_social_media_sentiment_summary`
- `admissions_dw.vw_social_admissions_year_correlation`
- `admissions_dw.vw_website_analytics_year_overview`
- `admissions_dw.vw_website_analytics_channel_summary`
- `admissions_dw.vw_website_analytics_landing_page_summary`
- `admissions_dw.vw_website_admissions_year_correlation`

---

## Load Script

ใช้ script นี้เพื่อ apply schema และโหลด CSV aggregate เข้า PostgreSQL:

```bash
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
```

โหลด GA4 website analytics CSV:

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

หมายเหตุ:

- ห้าม commit `DATABASE_URL` ลง repo
- script ใช้ `ON CONFLICT DO UPDATE` เพื่อรันซ้ำได้โดยไม่เพิ่ม duplicate fact rows
- source CSV ต้องอยู่ใน `outputs/processed/`
- loader ไม่ส่งออกหรือบันทึกข้อมูลส่วนบุคคล

---

## Current Neon Load Result

โหลดข้อมูลเข้า Neon สำเร็จแล้วใน schema:

```text
admissions_dw
```

จำนวนข้อมูลหลังโหลด:

| Object | Rows |
|---|---:|
| `dim_major` | 10 |
| `fact_admission_round_year_summary` | 2 |
| `fact_admission_round_major_summary` | 20 |
| `fact_admission_round_status_summary` | 15 |
| `admission_round_data_quality` | 2 |
| `fact_social_media_monthly_summary` | 28 |

ภาพรวมรายปี:

| Academic Year | Application Choices | Unique Applicants | Confirmed Unique Applicants | Confirmed Unique Rate |
|---:|---:|---:|---:|---:|
| 2568 | 2,711 | 1,810 | 214 | 11.82% |
| 2569 | 2,379 | 1,620 | 283 | 17.47% |
