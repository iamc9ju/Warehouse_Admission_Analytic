# Social Media Impact Analytics for Engineering Admissions

Data Warehouse project สำหรับวิเคราะห์ความสัมพันธ์ระหว่างกระแสบน Social Media กับข้อมูลการรับสมัครของคณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน

โปรเจคนี้อยู่ในขั้นออกแบบและเตรียมสาธิต โดยมีเอกสารหลัก, PostgreSQL schema, กฎสำหรับ AI agents และ sample data สำหรับทดลอง ETL/Dashboard

---

## Files

| File | Purpose |
|---|---|
| `social_media_impact_dw_project.md` | เอกสารออกแบบ Data Warehouse, business questions, star schema, dashboard และ KPI |
| `social_media_impact_dw_schema.sql` | PostgreSQL schema สำหรับ dimension tables, fact tables, indexes, KPI views และ seed data |
| `AI_OPERATING_GUIDE_ADAPTED.md` | กฎการทำงานสำหรับ AI agents ที่ปรับให้เหมาะกับโปรเจคนี้ |
| `sample_data/sample_admissions.csv` | ข้อมูลรับสมัครตัวอย่างแบบ synthetic |
| `sample_data/sample_social_media.csv` | ข้อมูล Social Media ตัวอย่างแบบ synthetic |
| `sample_data/README.md` | คำอธิบาย grain และข้อจำกัดของ sample data |

---

## Current Status

สิ่งที่มีแล้ว:

- Project overview และ problem statement
- Business questions
- Data sources
- ETL process
- Data Warehouse architecture
- Star schema design
- PostgreSQL DDL
- KPI views
- Dashboard specification ระดับ concept
- Sample data สำหรับ admissions และ social media
- AI operating guide สำหรับการทำงานต่อ

สิ่งที่ยังไม่ได้ทำ:

- ยังไม่ได้รัน PostgreSQL schema จริงใน database
- ยังไม่มี ETL script สำหรับโหลด CSV เข้า warehouse
- ยังไม่มี dashboard file จริงใน Power BI, Tableau หรือ Metabase
- ยังไม่มี automated data quality tests

---

## Data Warehouse Design Summary

โปรเจคใช้ Star Schema โดยมี fact table หลัก 2 ชุด:

1. `fact_admission`
   - Grain: 1 record ต่อ academic year, date period, TCAS round, department และ province
   - Measures: applicants, interview_passed, confirmed, enrolled

2. `fact_social_media`
   - Grain: 1 record ต่อ social media post หรือ aggregated mention ต่อ date, platform, keyword, department และ sentiment
   - Measures: mention_count, like_count, comment_count, share_count, view_count, engagement_score

Dimension หลัก:

- `dim_time`
- `dim_department`
- `dim_round`
- `dim_province`
- `dim_platform`
- `dim_keyword`
- `dim_sentiment`

---

## Quick Start

### 1. Review the project design

อ่านเอกสารหลักก่อน:

```text
outputs/social_media_impact_dw_project.md
```

### 2. Create PostgreSQL schema

นำไฟล์นี้ไปรันใน PostgreSQL:

```text
outputs/social_media_impact_dw_schema.sql
```

ตัวอย่างคำสั่งเมื่อมี PostgreSQL CLI:

```bash
psql -d your_database_name -f outputs/social_media_impact_dw_schema.sql
```

### 3. Inspect sample data

ข้อมูลตัวอย่างอยู่ที่:

```text
outputs/sample_data/sample_admissions.csv
outputs/sample_data/sample_social_media.csv
```

ข้อมูลทั้งหมดเป็น synthetic data สำหรับสาธิตเท่านั้น ไม่ใช่ข้อมูลจริงของมหาวิทยาลัย

---

## Suggested Next Implementation Step

ขั้นถัดไปที่เหมาะสมที่สุดคือเพิ่ม ETL script:

```text
outputs/etl/load_sample_data.py
```

ETL script ควรทำงานดังนี้:

1. อ่าน `sample_admissions.csv` และ `sample_social_media.csv`
2. validate required columns
3. validate admissions funnel:

```text
applicants >= interview_passed >= confirmed >= enrolled
```

4. normalize department, province, round, platform, keyword และ sentiment
5. insert หรือ upsert dimension tables
6. insert fact tables
7. แสดง summary หลังโหลดข้อมูล

---

## Dashboard Mapping

| Dashboard | Primary Data Source | Main Metrics |
|---|---|---|
| Admissions Overview | `vw_admissions_kpi` | applicants, interview_rate, confirmation_rate, enrollment_rate |
| Admissions Trend | `fact_admission`, `dim_time` | applicants by year/month/round |
| Social Media Trend | `vw_social_media_kpi` | total_mentions, total_engagement |
| Platform Analytics | `fact_social_media`, `dim_platform` | mentions, engagement by platform |
| Sentiment Analysis | `fact_social_media`, `dim_sentiment` | positive, neutral, negative mentions |
| Keyword Analytics | `fact_social_media`, `dim_keyword` | top keywords, keyword trend |
| Admissions Funnel | `fact_admission` | applicants, interview_passed, confirmed, enrolled |
| Correlation Dashboard | `vw_monthly_admission_social_correlation` | mentions vs applicants, engagement vs applicants |

---

## Important Data Notes

- Social Media metrics across platforms are not perfectly comparable. For example, views on TikTok/YouTube and likes on Facebook measure different user behaviors.
- Sentiment analysis for Thai text can be inaccurate without a model tuned for Thai education/admissions language.
- Correlation does not prove causation. If mentions and applicants increase together, further analysis is still required before claiming Social Media caused admissions growth.
- Fact-to-fact analytics should aggregate each fact table first, then join aggregated results by time period or shared dimension.

---

## Validation Checklist

Before presenting or extending this project:

- Confirm all SQL table and column names match the schema
- Confirm admissions sample rows satisfy the funnel rule
- Confirm Social Media rows contain platform, keyword, sentiment and engagement fields
- Confirm dashboards map to business questions
- Confirm KPI formulas are documented
- Confirm no API keys, credentials or private student data are stored in files

