# ADR 0001: Use Aggregate Admissions Facts for Round 3 Data

## Status

Accepted

## Context

ไฟล์ Excel รอบ 3 ปี 2568 และ 2569 มีข้อมูลระดับผู้สมัครและตัวเลือกสาขา แต่ไม่มี field สำหรับ province, interview passed หรือ enrolled อย่างชัดเจน อีกทั้งมีข้อมูลส่วนบุคคล เช่น เลขบัตรประชาชน ชื่อ เบอร์โทร และอีเมล

## Decision

ใช้ aggregate fact tables แทนการโหลด raw applicant-level data เข้า warehouse:

- `fact_admission_round_year_summary`
- `fact_admission_round_major_summary`
- `fact_admission_round_status_summary`

ใช้ `citizen_id` เฉพาะในขั้น ETL เพื่อคำนวณ `unique_applicants` และไม่ส่งออกค่า raw

## Consequences

ข้อดี:

- ลดความเสี่ยงด้านข้อมูลส่วนบุคคล
- Dashboard ใช้ข้อมูลได้ทันที
- Query ง่ายและเหมาะกับการพรีเซนต์

ข้อจำกัด:

- ไม่สามารถ drill down ถึงระดับผู้สมัครรายบุคคล
- ยังทำ admissions funnel แบบเต็มไม่ได้
- ถ้าต้องการ province/enrolled ต้องเพิ่ม source data ชุดใหม่

