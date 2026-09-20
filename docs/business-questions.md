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
| BQ-002 | Round Strategy | รอบ TCAS ไหนมี conversion ดีที่สุด | `mart_round_efficiency` | วางกลยุทธ์รอบรับสมัคร |
| BQ-003 | Conversion | สถานะใดเป็น friction หลักใน funnel | `mart_status_friction` | ลด drop-off และปรับ process |
| BQ-004 | Demand | ปี 2569 เปลี่ยนจาก 2568 อย่างไร | `mart_admissions_year_change` | วางแผนปีถัดไป |
| BQ-006 | Program Portfolio | สาขาไหนควรตรวจ quota หรือ seat allocation ก่อนปีถัดไป | `mart_major_opportunity` | ปรับ seat allocation |
| BQ-007 | Demand | สาขาไหนผู้สมัครลดลงมากผิดปกติ | `mart_major_year_change` | วาง recovery campaign |
| BQ-008 | Demand | สาขาไหนโตสวนภาพรวม | `mart_major_year_change` | ขยาย program positioning |
| BQ-009 | Conversion | สาขาไหน confirmed rate สูงแต่ demand ต่ำ | `mart_major_opportunity` | เพิ่ม awareness ของสาขาที่ applicant-fit ดี |
| BQ-010 | Round Strategy | รอบไหนมี volume สูงแต่ conversion ต่ำ | `mart_round_efficiency` | ลด leakage ในรอบนั้น |
| BQ-011 | Round Strategy | รอบไหนควรเป็น flagship recruitment round | `mart_round_efficiency` | จัด resource ตามรอบที่ให้ผลดีที่สุด |
| BQ-012 | Conversion | สถานะผ่านลำดับที่ดีกว่ากระทบ conversion แค่ไหน | `mart_status_friction` | ปรับ communication ก่อนผู้สมัครย้ายลำดับ |
| BQ-013 | Program Portfolio | ภาคพิเศษต่างจากภาคปกติอย่างไร | `mart_program_type_mix` | ประเมิน positioning ของ program type |

## Production Contract

ทุก insight ในหน้า dashboard ต้องมี:

- business question id
- mart/view source
- metric ที่ใช้ตัดสินใจ
- recommended action
- confidence level
- quality gate

ข้อมูลเหล่านี้ต้องมาจาก live Neon server-side adapter เท่านั้น ห้ามฝังตัวเลข dashboard ใน `app/`

## Decision Mart Live Sources

| Neon object | Purpose |
|---|---|
| `dw_business_question_catalog` | Business question catalog |
| `mart_decision_insight` | Decision-ready insights |
| `dw_decision_mart_contract` | Mart grain and source object contract |
