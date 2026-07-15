# Social Media Impact Analytics for Engineering Admissions

## Project Summary

โปรเจคนี้ออกแบบระบบ Data Warehouse และ Analytics Dashboard เพื่อวิเคราะห์ข้อมูลการรับสมัคร TCAS รอบ 3 ของคณะวิศวกรรมศาสตร์ กำแพงแสน และเตรียมโครงสร้างสำหรับเชื่อมโยงกับข้อมูล Social Media

ระบบปัจจุบันรองรับ workflow หลัก:

```text
Excel Admissions Data
  -> ETL / Aggregate Processing
  -> Processed CSV
  -> Neon PostgreSQL
  -> Analytics Views
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

- `outputs/etl/load_round3_to_neon.cjs`
  - โหลด processed CSV เข้า Neon PostgreSQL
  - ใช้ `ON CONFLICT DO UPDATE` เพื่อรันซ้ำได้

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

### Social Media Demonstration Layer

- `outputs/sample_data/sample_social_media_monthly_2568_2569.csv`
  - synthetic monthly social media dataset
  - used to demonstrate platform, keyword, sentiment, engagement and correlation analytics

- `outputs/sql/social_media_warehouse.sql`
  - creates social media dimensions, monthly fact table and correlation views

- `outputs/etl/load_social_media_to_neon.cjs`
  - loads sample social media data into Neon

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
- `admission_round_data_quality`

Views:

- `vw_round3_year_overview`
- `vw_round3_major_performance`
- `vw_round3_status_summary`
- `vw_round3_year_comparison`
- `vw_website_analytics_year_overview`
- `vw_website_analytics_channel_summary`
- `vw_website_analytics_landing_page_summary`
- `vw_website_admissions_year_correlation`

---

## Key Results

| Metric | 2568 | 2569 | Change |
|---|---:|---:|---:|
| Application choices | 2,711 | 2,379 | -332 |
| Unique applicants | 1,810 | 1,620 | -190 |
| Confirmed applicants | 214 | 283 | +69 |
| Confirmed rate | 11.82% | 17.47% | +5.65 pts |

Important interpretation:

- `application_choices` คือจำนวนตัวเลือกสาขา ไม่ใช่จำนวนคน
- ผู้สมัครหนึ่งคนสามารถมีหลายแถว เพราะเลือกได้หลายสาขา
- `unique_applicants` นับจาก `citizen_id` ในขั้น ETL แต่ไม่ส่งออกค่า raw

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

Social Media data layer เวอร์ชันสาธิตถูกเพิ่มแล้วโดยใช้ synthetic sample data:

- platform
- keyword
- mention count
- engagement
- sentiment
- month/year

และมี correlation views:

- mentions vs unique applicants
- engagement vs confirmed applicants
- sentiment score vs confirmed rate

ข้อจำกัดสำคัญ:

- ข้อมูล social media บางส่วนยังเป็น sample data
- Public mentions จาก Facebook ควรมาจาก social listening export ไม่ใช่ Facebook Page Insights
- จำนวนปีมีเพียง 2 ปี จึงยังไม่ควรตีความเป็น causal relationship
- ควรใช้เป็น capability demonstration สำหรับ Data Warehouse และ Dashboard

---

## How to Re-run

### 1. Aggregate Excel admissions data

```bash
python3 outputs/etl/aggregate_round3_admissions.py
```

### 2. Load admissions data to Neon

```bash
DATABASE_URL="postgresql://..." NODE_PATH="/path/to/node_modules" node outputs/etl/load_round3_to_neon.cjs
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

Do not commit `DATABASE_URL`, GA4 service account JSON or database credentials.
