# Production Review Report

## Model review

- เพิ่ม `dim_student` แบบ pseudonymous และ `dim_year`
- รวม admissions measures ไว้ใน `fact_admission` ตารางเดียว
- เชื่อม dimension keys ครบทุก fact row
- เพิ่ม `score NUMERIC(12,4) NOT NULL`
- ยกเลิก legacy aggregate facts และ secondary analytics facts

## Data review

- ปี 2567 มี 4,367 rows จาก 5 files ครอบคลุม TCAS1-4
- รวมทุกปี 13,799 fact rows, 16 files และ 10,158 pseudonymous students
- missing score 0, missing major 0 และ exported direct identity/contact columns 0

## Runtime review

Dashboard ใช้ presentation marts จาก fact เดียวผ่าน server-side adapter และ generated artifact fallback
การ regenerate ผ่าน `data:build`, `data:validate`, `data:check-static` และ production build
