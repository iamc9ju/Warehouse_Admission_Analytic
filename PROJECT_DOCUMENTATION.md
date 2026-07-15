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

- `outputs/real_data/`
  - เก็บ CSV/JSON ที่ดึงจากแหล่งข้อมูลจริง

Current fetch status:

- GDELT collector implemented but current network/API session returned `429` rate limit
- YouTube collector implemented and successfully fetched public YouTube Data API results after `YOUTUBE_API_KEY` was provided
- YouTube output: 79 raw videos and 31 monthly aggregate rows
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

- ข้อมูล social media ยังไม่ใช่ real API data
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

Do not commit `DATABASE_URL` or database credentials.
