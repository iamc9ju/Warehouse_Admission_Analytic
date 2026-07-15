# Social Media Impact Analytics for Engineering Admissions

## Project Summary

โปรเจคนี้ออกแบบระบบ Data Warehouse และ Analytics Dashboard เพื่อวิเคราะห์ข้อมูลการรับสมัคร TCAS รอบ 1-4 ของคณะวิศวกรรมศาสตร์ กำแพงแสน ปี 2568 และ 2569 พร้อม governed marts, lineage, quality checks และ social/website analytics layer ที่แสดงเฉพาะข้อมูลจริงหรือข้อมูลที่เก็บจริง

ระบบปัจจุบันรองรับ workflow หลัก:

```text
Excel Admissions Data
  -> ETL / Aggregate Processing
  -> Processed CSV
  -> Neon PostgreSQL
  -> Core Facts / Dimensions
  -> Governance Metadata / Data Marts
  -> Markdown Report
  -> Web Dashboard
```

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

- `outputs/processed/admissions_round3_2568_2569_summary.csv`
  - สรุปรวมรายปี

- `outputs/processed/admissions_round3_2568_2569_by_major.csv`
  - สรุปตามสาขาและประเภทหลักสูตร

- `outputs/processed/admissions_round3_2568_2569_status_summary.csv`
  - สรุปตามสถานะ TCAS

- `outputs/processed/admissions_round3_2568_2569_data_quality.csv`
  - ตรวจคุณภาพข้อมูลและ PII columns ที่ถูกตัดออก

### Warehouse and Analytics

- `outputs/sql/admissions_round3_warehouse.sql`
  - สร้าง schema `admissions_dw`
  - สร้าง dimension tables, fact tables และ analytics views

- `outputs/sql/admissions_all_rounds_warehouse.sql`
  - สร้าง `fact_admission_year_overview`
  - สร้าง `fact_admission_round_overview`
  - สร้าง `admission_round_source_data_quality`
  - สร้าง mart/views สำหรับ TCAS รอบ 1-4

- `outputs/sql/warehouse_governance_marts.sql`
  - สร้าง dataset catalog, lineage edges, refresh run log
  - สร้าง quality scorecard และ presentation marts สำหรับ dashboard

- `outputs/etl/apply_warehouse_governance_marts.cjs`
  - apply base schema และ governed mart layer แบบ idempotent

- `outputs/etl/load_round3_to_neon.cjs`
  - โหลด processed CSV เข้า Neon PostgreSQL
  - ใช้ `ON CONFLICT DO UPDATE` เพื่อรันซ้ำได้

- `outputs/etl/load_admissions_all_rounds_to_neon.cjs`
  - โหลด all-round processed CSV เข้า Neon
  - upsert year, round, project, major, status และ source quality facts

- `outputs/sql/admissions_round3_analytics_queries.sql`
  - SQL queries สำหรับ report/dashboard

- `outputs/reports/admissions_round3_analytics_report.md`
  - รายงานผลวิเคราะห์จาก Neon

### Web Dashboard

- `app/page.tsx`
  - Dashboard หน้าเดียวสำหรับพรีเซนต์ผล admissions analytics

- `app/globals.css`
  - Dashboard layout และ visual design

- Production URL:
  - `https://tcas-round3-admissions-dashboard.ittipol-b.chatgpt.site`

### Social Media Data Layer

- `outputs/real_data/youtube_mentions_monthly.csv`
  - real monthly aggregate generated from public YouTube Data API results

- `outputs/real_data/facebook_public_search_mentions_monthly.csv`
  - small manually captured public Facebook search aggregate

- `outputs/etl/normalize_social_listening_export.cjs`
  - normalizes authorized social listening exports from tools such as Mandala, Wisesight, Zanroo, Brandwatch or Meltwater

- `outputs/sql/social_media_warehouse.sql`
  - creates social media dimensions, monthly fact table and correlation views

- `outputs/etl/load_social_media_to_neon.cjs`
  - loads real-source social media aggregates into Neon

- `outputs/reports/social_media_impact_report.md`
  - summarizes social media movement and admissions relationship

### Real Social Data Collection

- `outputs/etl/fetch_gdelt_news_mentions.cjs`
  - ดึงข้อมูลข่าว/เว็บจริงผ่าน GDELT DOC API โดยไม่ต้องใช้ API key

- `outputs/etl/fetch_youtube_mentions.cjs`
  - ดึงข้อมูลวิดีโอจริงผ่าน YouTube Data API
  - ต้องใช้ `YOUTUBE_API_KEY`

- `outputs/etl/fetch_facebook_page_insights.cjs`
  - ดึงโพสต์และ engagement/insights ของ Facebook Page ผ่าน Graph API
  - ต้องใช้ `FACEBOOK_PAGE_ID` และ `FACEBOOK_PAGE_ACCESS_TOKEN`
  - ส่งออก CSV รายเดือนที่โหลดเข้า social warehouse เดิมได้

- `outputs/etl/normalize_social_listening_export.cjs`
  - แปลง CSV export จาก social listening tools ให้เป็น monthly public mention CSV
  - ใช้สำหรับโจทย์ “บุคคลอื่น/เพจอื่นพูดถึง keyword”
  - รองรับคอลัมน์หลายชื่อ เช่น date, platform, text, keyword, sentiment, likes, comments, shares, views

- `outputs/real_data/`
  - เก็บ CSV/JSON ที่ดึงจากแหล่งข้อมูลจริง

### Website Analytics Collection

- `outputs/etl/fetch_ga4_website_analytics.cjs`
  - ดึง aggregate website analytics จาก GA4 Data API
  - ต้องใช้ `GA4_PROPERTY_ID` และ service account ที่มีสิทธิ์อ่าน GA4 property
  - ส่งออกเฉพาะข้อมูล aggregate รายเดือนตาม academic year, channel group และ landing page

- `outputs/etl/load_website_analytics_to_neon.cjs`
  - โหลด CSV จาก GA4 เข้า Neon PostgreSQL
  - สร้าง website analytics fact/dimension tables และ correlation views

- `outputs/sql/website_analytics_warehouse.sql`
  - สร้าง `fact_website_analytics_monthly`
  - สร้าง views สำหรับ website analytics year overview, channel summary, landing page summary และ admissions correlation

Current fetch status:

- GDELT collector implemented but current network/API session returned `429` rate limit
- YouTube collector implemented and successfully fetched public YouTube Data API results after `YOUTUBE_API_KEY` was provided
- YouTube output: 79 raw videos and 31 monthly aggregate rows
- Facebook Page collector implemented; waiting for Page ID and Page access token
- Social listening export normalizer implemented; waiting for an export CSV from an authorized provider
- Dashboard social metrics display only real/collected sources: YouTube Data API plus the small manual Facebook public-search capture
- GA4 website analytics collector implemented; credentials were verified, but property `524676058` returned 0 rows for both admissions windows and an all-time diagnostic range through 2026-07-15
- See `outputs/real_data/FETCH_STATUS.md`

---

## Database Schema

Neon PostgreSQL ใช้ schema:

```text
admissions_dw
```

Base tables:

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
- `dw_dataset_catalog`
- `dw_lineage_edge`
- `dw_refresh_run`

Views:

- `vw_round3_year_overview`
- `vw_round3_major_performance`
- `vw_round3_status_summary`
- `vw_round3_year_comparison`
- `vw_admission_year_overview`
- `vw_admission_round_overview`
- `vw_admission_round_status_distribution`
- `vw_admission_source_quality`
- `mart_tcas_year_summary`
- `mart_tcas_round_summary`
- `mart_major_round_conversion`
- `vw_website_analytics_year_overview`
- `vw_website_analytics_channel_summary`
- `vw_website_analytics_landing_page_summary`
- `vw_website_admissions_year_correlation`
- `vw_dw_dataset_inventory`
- `vw_dw_lineage_overview`
- `vw_dw_table_row_counts`
- `vw_dw_quality_scorecard`
- `mart_admissions_executive_summary`
- `mart_major_conversion`
- `mart_channel_effectiveness`

---

## Key Results

| Metric | 2568 | 2569 | Change |
|---|---:|---:|---:|
| Application choices, TCAS1-4 | 4,853 | 4,579 | -274 |
| Unique applicants, cross-round | 3,597 | 3,443 | -154 |
| Confirmed applicants, TCAS1-4 | 528 | 545 | +17 |
| Confirmed rate, cross-round | 14.68% | 15.83% | +1.15 pts |

Warehouse governance objects currently applied to Neon:

| Object | Rows |
|---|---:|
| `dw_dataset_catalog` | 8 |
| `dw_lineage_edge` | 8 |
| `mart_admissions_executive_summary` | 2 |
| `mart_major_conversion` | 20 |
| `mart_channel_effectiveness` | 16 |

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

ข้อมูล admissions รอบ 3 ที่ใช้ตอนนี้ยังไม่มี:

- province
- interview passed
- enrolled
- วันที่ละเอียดรายผู้สมัคร
- ข้อมูล social media จริง

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

Social Media data layer ปัจจุบันแสดงเฉพาะแหล่งข้อมูลที่เก็บจริงหรือดึงจาก API จริง:

- YouTube Data API aggregate
- manually captured Facebook public-search aggregate
- authorized social listening export เมื่อมี CSV จาก provider

และมี correlation views:

- mentions vs unique applicants
- engagement vs confirmed applicants
- sentiment score vs confirmed rate

ข้อจำกัดสำคัญ:

- Public mentions จาก Facebook ควรมาจาก social listening export ไม่ใช่ Facebook Page Insights
- จำนวนปีมีเพียง 2 ปี จึงยังไม่ควรตีความเป็น causal relationship
- Dashboard แสดงเฉพาะ sources ที่เก็บจริงหรือดึงจาก API จริงเท่านั้น

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

### 5. Fetch Facebook Page Insights

```bash
FACEBOOK_PAGE_ID="..." \
FACEBOOK_PAGE_ACCESS_TOKEN="..." \
node outputs/etl/fetch_facebook_page_insights.cjs
```

### 6. Normalize social listening public mention export

```bash
SOCIAL_LISTENING_EXPORT_CSV="/path/to/export.csv" \
SOCIAL_LISTENING_VENDOR="Mandala" \
SOCIAL_LISTENING_DEFAULT_PLATFORM="Facebook" \
node outputs/etl/normalize_social_listening_export.cjs
```

### 7. Load social listening monthly data to Neon

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/social_listening_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

### 8. Load Facebook Page monthly data to Neon

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/facebook_page_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

### 9. Load GA4 website analytics to Neon

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

### 10. Apply governed warehouse marts

```bash
DATABASE_URL="postgresql://..." \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/apply_warehouse_governance_marts.cjs
```

Do not commit `DATABASE_URL`, GA4 service account JSON or database credentials.
