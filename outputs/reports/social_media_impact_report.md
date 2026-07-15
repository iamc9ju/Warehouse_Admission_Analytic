# Social Media Impact Report

Generated from Neon PostgreSQL schema `admissions_dw`.

## Data Scope

ข้อมูล Social Media ในรอบนี้เป็น **synthetic sample data** สำหรับสาธิต Data Warehouse และ dashboard correlation เท่านั้น ยังไม่ใช่ข้อมูลจริงจาก Facebook, TikTok, YouTube, Pantip, X, Website หรือ News APIs

## Year Overview

| academic_year | total_mentions | total_engagement | engagement_per_mention | weighted_sentiment_score | unique_applicants | confirmed_applicants | confirmed_rate |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 2568 | 757 | 630,872 | 833.38 | 0.6169 | 1,810 | 214 | 11.82% |
| 2569 | 1,082 | 1,021,250 | 943.85 | 0.6941 | 1,620 | 283 | 17.47% |

## Movement from 2568 to 2569

| Metric | Change |
|---|---:|
| Mentions | +325 |
| Engagement | +390,378 |
| Unique applicants | -190 |
| Confirmed applicants | +69 |
| Confirmed rate | +5.65 pts |

## Interpretation

- Social mentions and engagement increased in the sample data from 2568 to 2569
- Unique applicants decreased, but confirmed applicants increased
- This means social activity may align more strongly with confirmation behavior than with raw applicant volume in this demonstration dataset
- Because social data is synthetic and only covers two academic years, this should be presented as a dashboard capability demonstration, not as causal evidence

## Dashboard Use

Use these views for BI/dashboard:

- `admissions_dw.vw_social_media_year_overview`
- `admissions_dw.vw_social_media_platform_summary`
- `admissions_dw.vw_social_media_sentiment_summary`
- `admissions_dw.vw_social_admissions_year_correlation`

