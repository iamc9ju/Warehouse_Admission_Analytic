# Business Questions and Decision Mart Contract

โปรเจค TCAS DW ไม่ได้มีไว้แค่แสดง dashboard แต่มีไว้ตอบคำถามเชิงธุรกิจ/องค์กรที่ช่วยตัดสินใจเรื่อง admissions planning

## Business Question Domains

หน้า `/insights` จัดคำถามเป็น 4 กลุ่ม:

| Domain | Purpose |
|---|---|
| Demand | หาสาขาที่ demand เพิ่ม/ลด หรือมี demand สูงแต่ conversion ยังอ่อน |
| Conversion | หาจุด friction ใน funnel และสถานะที่ทำให้ผู้สมัครไม่ไปถึงการยืนยันสิทธิ์ |
| Round Strategy | เปรียบเทียบ TCAS1-4 เพื่อวาง resource และ communication ตามรอบ |
| Program Portfolio | วิเคราะห์สาขา ภาคปกติ/ภาคพิเศษ และ portfolio ของหลักสูตร |

## Business Questions

| ID | Domain | Question | Mart/View | Decision |
|---|---|---|---|---|
| BQ-001 | Demand | สาขาไหน demand สูงแต่ยืนยันสิทธิ์ต่ำ | `mart_major_opportunity` | ปรับ communication, quota หรือ offer strategy |
| BQ-002 | Round Strategy | รอบ TCAS ไหนสร้างผู้ยืนยันสิทธิ์ได้มากที่สุด | `mart_round_efficiency` | วางกลยุทธ์รอบรับสมัคร |
| BQ-006 | Program Portfolio | สาขาไหนควรตรวจ quota หรือ seat allocation ก่อนปีถัดไป | `mart_major_opportunity` | ปรับ seat allocation |
| BQ-007 | Demand | สาขาไหนผู้สมัครลดลงมากผิดปกติ | `mart_major_year_change` | วาง recovery campaign |
| BQ-008 | Demand | สาขาไหนโตสวนภาพรวม | `mart_major_year_change` | ขยาย program positioning |
| BQ-009 | Conversion | สาขาไหน confirmed rate สูงแต่ demand ต่ำ | `mart_major_opportunity` | เพิ่ม awareness ของสาขาที่ applicant-fit ดี |

## Production Contract

ทุก insight ในหน้า dashboard ต้องมี:

- business question id
- mart/view source
- metric ที่ใช้ตัดสินใจ
- recommended action
- confidence level
- quality gate

Question metadata กำหนดใน `app/data/repositories/insights-repository.ts` ส่วนตัวเลขคำตอบต้อง query
จาก live Neon marts ทุกครั้ง ห้ามฝังตัวเลขผลลัพธ์ dashboard ใน `app/`

## Live Sources

| Object | Purpose |
|---|---|
| TypeScript question definitions | คำถาม หมวด และ decision metadata |
| `mart_major_opportunity` | คำตอบระดับสาขาแบบ live query |
| `mart_major_year_change` | การเปลี่ยนแปลงผู้สมัครรายสาขา |
| `mart_round_efficiency` | คำตอบระดับรอบ TCAS |
