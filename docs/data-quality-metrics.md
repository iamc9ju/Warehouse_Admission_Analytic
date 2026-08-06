# Data Quality Metrics

หน้านี้นิยาม quality metrics ที่ใช้ใน dashboard และ evidence pack เพื่อให้ตรวจสอบได้ว่าแต่ละตัวเลขมาจาก object ไหน

| Metric | Current Value | Source Object | Definition | Validation Rule |
|---|---:|---|---|---|
| Source rows | 9,432 | `admission_round_source_data_quality.source_rows` | จำนวนแถวจาก Excel admissions source ทั้งหมดที่ ETL อ่านก่อน aggregate | `sum(source_rows)` ต้อง reconcile กับ staging load |
| Missing score | 0 | `admission_round_source_data_quality.missing_score_rows` | จำนวนแถวที่ score field ที่ใช้ทำ summary เป็นค่าว่าง | ต้องเท่ากับ 0 ใน active snapshot |
| Missing major | 0 | `admission_round_source_data_quality.missing_major_rows` | จำนวนแถวที่ map ไปยัง major dimension ไม่ได้ | ต้องเท่ากับ 0 ก่อน load major facts |
| PII exported | 0 columns | processed aggregate CSV column audit | จำนวน column ส่วนบุคคลที่ออกจาก ETL ไป processed CSV, Neon หรือ dashboard | citizen_id/name/phone/email ต้องไม่อยู่ใน processed output |
| Active source groups | 1 | `dw_dataset_catalog.source_group` | จำนวน source groups ที่อยู่ใน active scope | ต้องมี admissions_excel เป็น active group และไม่มี social source |
| Source files | 11 | `admission_round_source_data_quality.source_file` | จำนวน Excel files ของ TCAS รอบ 1-4 ปี 2568 และ 2569 | ต้องครอบคลุม TCAS1-4 ทั้งสองปี |
| Catalog rows | 7 | `dw_dataset_catalog` | จำนวน catalog records ที่อธิบาย source, staging, facts, mart และ dashboard snapshot | dashboard-facing object ต้องมี metadata |
| Lineage edges | 7 | `dw_lineage_edge` | จำนวน dependency edges จาก source ถึง dashboard | mart ที่ใช้ใน UI ต้อง trace กลับถึง source/staging |

## Privacy Boundary

ETL ใช้ applicant identifier เฉพาะใน memory เพื่อคำนวณ `unique_applicants`

ค่าต่อไปนี้ห้ามออกจาก source layer:

- citizen_id
- national_id
- name
- phone
- email

## Score Completeness

`missing_score_rows = 0` แปลว่าใน active snapshot ไม่มีแถวที่ขาด score field ที่ใช้สำหรับ aggregate summary

ถ้าในอนาคตมี source file ใหม่ที่ score ไม่ครบ ต้องแสดงใน quality fact ก่อนอนุญาตให้ publish dashboard snapshot ใหม่

## Major Completeness

`missing_major_rows = 0` แปลว่าทุก admissions row ที่เข้า major-level fact สามารถ map ไปยัง major name/code ได้

ถ้าเพิ่มสาขาใหม่ ให้เพิ่ม dimension mapping ก่อน load fact
