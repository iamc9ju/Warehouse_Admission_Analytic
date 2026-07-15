# Sample Data Notes

ข้อมูลในโฟลเดอร์นี้เป็น **synthetic sample data** สำหรับสาธิต Data Warehouse, ETL และ Dashboard เท่านั้น ไม่ใช่ข้อมูลจริงของมหาวิทยาลัย

---

## Files

| File | Description |
|---|---|
| `sample_admissions.csv` | ข้อมูลการรับสมัครตัวอย่าง แยกตาม date, academic year, TCAS round, department และ province |
| `sample_social_media.csv` | ข้อมูล Social Media ตัวอย่าง แยกตาม post date, platform, keyword, department และ sentiment |

---

## Admissions Grain

`sample_admissions.csv` ใช้ grain:

```text
1 row per admission_date + academic_year + tcas_round + department + province
```

ทุกแถวต้องรักษา funnel rule:

```text
applicants >= interview_passed >= confirmed >= enrolled
```

---

## Social Media Grain

`sample_social_media.csv` ใช้ grain:

```text
1 row per collected social media post or mention summary
```

แต่ละแถวมี:

- `post_date`
- `platform_name`
- `keyword_text`
- `department_code`
- `sentiment_label`
- engagement metrics
- source reference

---

## Limitation

ข้อมูลนี้ออกแบบมาเพื่อให้เห็น pattern เบื้องต้น เช่น mention เพิ่มขึ้นช่วงก่อนรับสมัคร และบางสาขามี engagement สูงกว่า แต่ยังไม่ควรใช้สรุปเชิงนโยบายจริง

