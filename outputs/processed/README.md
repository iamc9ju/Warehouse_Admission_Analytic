# Processed Admissions Data

ไฟล์ในโฟลเดอร์นี้เป็นข้อมูล aggregate ที่สร้างจากไฟล์ Excel:

- `/Users/iamc9ju/Downloads/รอบ 3 ปี 68.xlsx`
- `/Users/iamc9ju/Downloads/รอบ 3 ปี 69.xlsx`

ข้อมูลส่วนบุคคล เช่น เลขบัตรประชาชน ชื่อ เบอร์โทร และอีเมล ถูกใช้เฉพาะเพื่อคำนวณจำนวนผู้สมัครไม่ซ้ำ แล้วไม่ถูกเขียนลงไฟล์ผลลัพธ์

---

## Files

| File | Grain | Purpose |
|---|---|---|
| `admissions_round3_2568_2569_summary.csv` | 1 row per academic year/project/faculty | สรุปรวมรายปีของ TCAS รอบ 3 |
| `admissions_round3_2568_2569_by_major.csv` | 1 row per academic year/project/faculty/major/major_type | วิเคราะห์จำนวนการเลือกสาขาและผู้ยืนยันสิทธิ์ตามสาขา |
| `admissions_round3_2568_2569_status_summary.csv` | 1 row per academic year/status/applicant_status | วิเคราะห์สถานะ TCAS และ applicant status |
| `admissions_round3_2568_2569_data_quality.csv` | 1 row per academic year | ตรวจจำนวนแถว, missing value และ PII columns ที่ถูกตัดออก |

---

## Important Interpretation

- `application_choices` คือจำนวนแถวใน source file หรือจำนวนตัวเลือกสาขาที่ผู้สมัครเลือก ไม่ใช่จำนวนคน
- `unique_applicants` คือจำนวนผู้สมัครไม่ซ้ำ โดยใช้ `citizen_id` สำหรับนับเท่านั้น
- ในไฟล์ source หนึ่งคนสามารถมีหลายแถวได้ เพราะเลือกหลายสาขาและมี `priority`
- `confirmed_unique_applicants` คือจำนวนผู้สมัครไม่ซ้ำที่มี `tcas_status = ยืนยันสิทธิ์`
- ข้อมูลไม่มี province, interview passed หรือ enrolled จึงยังไม่ควร map ตรงเข้ากับ admissions funnel แบบเต็ม

---

## Recommended Warehouse Mapping

สำหรับการโหลดเข้า warehouse แนะนำให้เพิ่ม fact table เฉพาะสำหรับข้อมูลรอบ 3 ระดับตัวเลือกสาขา เช่น:

```text
fact_admission_choice
```

Grain:

```text
1 row per academic_year + tcas_round + applicant_hash + major + priority
```

หรือหากต้องการเก็บเฉพาะ aggregate:

```text
fact_admission_round_major_summary
```

Grain:

```text
1 row per academic_year + tcas_round + major + major_type
```

ยังไม่ควรใส่ `interview_passed` และ `enrolled` จากไฟล์นี้ เพราะ source ไม่มี field ที่ระบุชัดเจน
