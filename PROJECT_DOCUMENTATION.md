# Admissions Data Warehouse for Engineering Admissions

## Project Summary

โปรเจคนี้ออกแบบระบบ Data Warehouse และ Analytics Dashboard เพื่อวิเคราะห์ข้อมูลการรับสมัคร
TCAS รอบ 1-4 ของคณะวิศวกรรมศาสตร์ กำแพงแสน ปี 2568 และ 2569 พร้อม governed marts,
lineage, quality checks และ owned website analytics layer

ระบบปัจจุบันรองรับ workflow หลัก:

```text
Excel Admissions Data
  -> ETL / Aggregate Processing
  -> PII-free Processed CSV
  -> Neon PostgreSQL
  -> Core Facts / Dimensions
  -> Governance Metadata / Data Marts
  -> Markdown Report
  -> Web Dashboard
```

---

## Active Data Scope

โปรเจคยกเลิกการใช้ข้อมูลจาก social media ingestion ทุกช่องทางแล้ว

ไม่ใช้แหล่งข้อมูลต่อไปนี้ใน dashboard, warehouse mart หรือ report ใหม่:

- YouTube Data API
- Facebook Page API
- Facebook public search capture
- Social listening CSV export
- Public mention feed จาก social platform ใด ๆ
- Scraping หรือ unofficial collector จาก social media

ยังใช้แหล่งข้อมูลต่อไปนี้ได้:

- Excel admissions files จากผู้ใช้
- Processed aggregate CSV ที่ไม่มี PII
- Neon PostgreSQL warehouse schema และ marts
- GA4 aggregate reports จาก owned website property ที่มีสิทธิ์อ่านชัดเจน

เหตุผลหลัก:

- ลด platform policy risk
- ลด bias จาก social data ที่ไม่ครบทุกช่องทาง
- ทำให้ dashboard อธิบายด้วยข้อมูล admissions จริงและ owned analytics ได้ตรงกว่า
- หลีกเลี่ยงการตีความ social engagement เป็น causal signal ต่อ admissions

---

## Current Deliverables

### Data Processing

- `outputs/etl/aggregate_round3_admissions.py`
  - อ่านไฟล์ Excel รอบ 3 ปี 2568 และ 2569
  - aggregate เป็น CSV
  - ใช้ข้อมูลส่วนบุคคลเฉพาะสำหรับนับ unique applicants
  - ไม่ส่งออกเลขบัตรประชาชน ชื่อ เบอร์โทร หรืออีเมล

- `outputs/etl/aggregate_admissions_all_rounds.py`
  - อ่านไฟล์ Excel TCAS รอบ 1-4 ปี 2568 และ 2569 รวม 11 source files
  - aggregate เป็น year overview, round overview, project summary, major summary, status summary และ source quality CSV
  - ใช้ `citizen_id` เฉพาะใน memory เพื่อคำนวณ unique applicants ข้าม round
  - ไม่ส่งออก PII ลง processed CSV

- `outputs/processed/`
  - เก็บ admissions aggregate CSV ที่ไม่มี PII

### Warehouse and Analytics

- `outputs/sql/admissions_round3_warehouse.sql`
  - สร้าง schema `admissions_dw`
  - สร้าง dimension tables, fact tables และ analytics views

- `outputs/sql/admissions_all_rounds_warehouse.sql`
  - สร้าง `fact_admission_year_overview`
  - สร้าง `fact_admission_round_overview`
  - สร้าง `admission_round_source_data_quality`
  - สร้าง mart/views สำหรับ TCAS รอบ 1-4

- `outputs/sql/website_analytics_warehouse.sql`
  - สร้าง `fact_website_analytics_monthly`
  - สร้าง views สำหรับ website analytics year overview, channel summary, landing page summary และ admissions correlation

- `outputs/sql/warehouse_governance_marts.sql`
  - สร้าง dataset catalog, lineage edges, refresh run log
  - สร้าง quality scorecard และ presentation marts สำหรับ dashboard

- `outputs/etl/apply_warehouse_governance_marts.cjs`
  - apply base admissions, website analytics และ governed mart layer แบบ idempotent

- `outputs/etl/load_round3_to_neon.cjs`
  - โหลด processed CSV เข้า Neon PostgreSQL
  - ใช้ `ON CONFLICT DO UPDATE` เพื่อรันซ้ำได้

- `outputs/etl/load_admissions_all_rounds_to_neon.cjs`
  - โหลด all-round processed CSV เข้า Neon
  - upsert year, round, project, major, status และ source quality facts

- `outputs/reports/admissions_round3_analytics_report.md`
  - รายงานผลวิเคราะห์จาก Neon

### Website Analytics Collection

- `outputs/etl/fetch_ga4_website_analytics.cjs`
  - ดึง aggregate website analytics จาก GA4 Data API
  - ต้องใช้ `GA4_PROPERTY_ID` และ service account ที่มีสิทธิ์อ่าน GA4 property
  - ส่งออกเฉพาะข้อมูล aggregate รายเดือนตาม academic year, channel group และ landing page

- `outputs/etl/load_website_analytics_to_neon.cjs`
  - โหลด CSV จาก GA4 เข้า Neon PostgreSQL
  - สร้าง website analytics fact/dimension tables และ correlation views

Current fetch status:

- GA4 website analytics collector implemented
- Credentials were verified, but property `524676058` returned 0 rows for both admissions windows and an all-time diagnostic range through 2026-07-15
- Social media collectors and loaders are retained only as historical artifacts in ignored `outputs/`, not as active runbook steps

### Web Dashboard

- `app/page.tsx`
  - Dashboard หน้าเดียวสำหรับพรีเซนต์ผล admissions analytics และ governed warehouse scope

- `app/globals.css`
  - Dashboard layout และ visual design

- Production URL:
  - `https://tcas-round3-admissions-dashboard.ittipol-b.chatgpt.site`

---

## Database Schema

Neon PostgreSQL ใช้ schema:

```text
admissions_dw
```

Core active tables:

- `dim_tcas_round`
- `dim_faculty`
- `dim_major`
- `dim_tcas_status`
- `fact_admission_round_year_summary`
- `fact_admission_round_major_summary`
- `fact_admission_round_status_summary`
- `fact_admission_year_overview`
- `fact_admission_round_overview`
- `admission_round_data_quality`
- `admission_round_source_data_quality`
- `fact_website_analytics_monthly`
- `dw_dataset_catalog`
- `dw_lineage_edge`
- `dw_refresh_run`

Active views and marts:

- `vw_round3_year_overview`
- `vw_round3_major_performance`
- `vw_round3_status_summary`
- `vw_round3_year_comparison`
- `vw_admission_year_overview`
- `vw_admission_round_overview`
- `vw_admission_round_status_distribution`
- `vw_admission_source_quality`
- `vw_website_analytics_year_overview`
- `vw_website_analytics_channel_summary`
- `vw_website_analytics_landing_page_summary`
- `vw_website_admissions_year_correlation`
- `vw_dw_dataset_inventory`
- `vw_dw_lineage_overview`
- `vw_dw_table_row_counts`
- `vw_dw_quality_scorecard`
- `mart_tcas_year_summary`
- `mart_tcas_round_summary`
- `mart_major_round_conversion`
- `mart_admissions_executive_summary`
- `mart_major_conversion`

---

## Key Results

| Metric | 2568 | 2569 | Change |
|---|---:|---:|---:|
| Application choices, TCAS1-4 | 4,853 | 4,579 | -274 |
| Unique applicants, cross-round | 3,597 | 3,443 | -154 |
| Confirmed applicants, TCAS1-4 | 528 | 545 | +17 |
| Confirmed rate, cross-round | 14.68% | 15.83% | +1.15 pts |

Important interpretation:

- `application_choices` คือจำนวนตัวเลือกสาขา ไม่ใช่จำนวนคน
- ผู้สมัครหนึ่งคนสามารถมีหลายแถว เพราะเลือกได้หลายสาขา
- `unique_applicants` นับจาก `citizen_id` ในขั้น ETL แต่ไม่ส่งออกค่า raw
- year-level `unique_applicants` มาจากการนับ unique ข้ามทุก TCAS round ในปีนั้น ไม่ใช่การบวก unique applicants รายรอบ

---

## Data Privacy

ไฟล์ Excel ต้นทางมีข้อมูลส่วนบุคคล เช่น:

- เลขบัตรประชาชน
- ชื่อ-นามสกุล
- เบอร์โทร
- อีเมล

แนวทางที่ใช้:

1. ใช้ `citizen_id` เฉพาะใน memory ระหว่าง ETL เพื่อคำนวณจำนวนผู้สมัครไม่ซ้ำ
2. ไม่เขียนค่า `citizen_id` ลง processed CSV
3. ไม่โหลด PII เข้า Neon
4. ไม่แสดง PII ใน dashboard หรือ report

---

## Limitations

ข้อมูล admissions ตอนนี้ยังไม่มี:

- province
- interview passed
- enrolled
- วันที่ละเอียดรายผู้สมัคร
- verified marketing attribution ที่เชื่อมจาก owned website analytics ไป admissions action

ดังนั้นยังไม่ควรสรุป funnel แบบเต็ม:

```text
Applicants -> Interview Passed -> Confirmed -> Enrolled
```

ระบบปัจจุบันใช้ funnel แบบจำกัด:

```text
Application Choices / Unique Applicants -> Confirmed Applicants
```

---

## Next Extensions

งานต่อที่เหมาะกับ scope ใหม่:

- เพิ่มข้อมูล enrolled/interview outcome หากมี source ที่เชื่อถือได้
- ตรวจ GA4 property ให้แน่ใจว่าเป็น property ของเว็บไซต์รับสมัครที่ active
- ตั้ง GA4 key events สำหรับ admissions actions แบบ aggregate
- เพิ่ม automated export จาก Neon marts ไป dashboard data source
- เพิ่ม data quality checks สำหรับ duplicate applicant counting และ round-level reconciliation

---

## How to Re-run

### 1. Aggregate Excel admissions data

```bash
python3 outputs/etl/aggregate_round3_admissions.py
```

Aggregate all TCAS round files:

```bash
python3 outputs/etl/aggregate_admissions_all_rounds.py
```

### 2. Load admissions data to Neon

```bash
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
```

Load all TCAS round data:

```bash
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_admissions_all_rounds_to_neon.cjs
```

### 3. Export analytics report

```bash
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/export_round3_analytics_report.cjs
```

### 4. Fetch GA4 website analytics

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

### 5. Load GA4 website analytics to Neon

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

### 6. Apply governed warehouse marts

```bash
DATABASE_URL="postgresql://..." \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/apply_warehouse_governance_marts.cjs
```

Do not commit `DATABASE_URL`, GA4 service account JSON or database credentials.
