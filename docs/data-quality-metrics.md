# Data Quality Metrics

| Metric | Expected | Source object | Meaning |
|---|---:|---|---|
| Source rows | 13,799 | `admission_round_source_data_quality.source_rows` | แถวที่อ่านจาก 16 workbooks |
| Missing score | 0 | `admission_round_source_data_quality.missing_score_rows` | fact row ที่ไม่มีคะแนน |
| Missing major | 0 | `admission_round_source_data_quality.missing_major_rows` | แถวที่ resolve `dim_major` ไม่ได้ |
| PII exported | 0 columns | `admission_round_source_data_quality.pii_exported_columns` | direct identity/contact fields ที่ข้าม privacy boundary |
| Duplicate application token | 0 | `application_token` uniqueness | fact grain ซ้ำจาก source row เดียวกัน |
| Physical fact tables | 1 | `information_schema.tables` | ต้องเหลือเฉพาะ `fact_admission` |

`score` อยู่ใน `fact_admission` ที่ grain หนึ่งตัวเลือกสมัคร ทำให้ค่าเฉลี่ย/ต่ำสุด/สูงสุด
คำนวณจาก fact เดียวได้โดยไม่ต้องเก็บ aggregate facts ซ้ำ

หาก critical metric ใดไม่ผ่าน ต้องหยุดการโหลดและไม่สร้าง dashboard artifact ใหม่
