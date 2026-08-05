# Business Questions and Decision Mart Contract

โปรเจค TCAS DW ไม่ได้มีไว้แค่แสดง dashboard แต่มีไว้ตอบคำถามเชิงธุรกิจ/องค์กรที่ช่วยตัดสินใจเรื่อง admissions planning

## Business Questions

| ID | Question | Mart/View | Metrics | Decision |
|---|---|---|---|---|
| BQ-001 | สาขาไหน demand สูงแต่ยืนยันสิทธิ์ต่ำ | `mart_major_opportunity` | applicant count, confirmed rate | ปรับ communication, quota หรือ offer strategy |
| BQ-002 | รอบ TCAS ไหนมี conversion ดีที่สุด | `mart_round_efficiency` | confirmed rate, confirmed count | วางกลยุทธ์รอบรับสมัคร |
| BQ-003 | สถานะใดเป็น friction หลักใน funnel | `mart_status_friction` | choices, status share | ลด drop-off และปรับ process |
| BQ-004 | ปี 2569 เปลี่ยนจาก 2568 อย่างไร | `mart_admissions_year_change` | applicant delta, confirmed delta, rate delta | วางแผนปีถัดไป |
| BQ-005 | ข้อมูลพร้อมใช้ตัดสินใจหรือยัง | `vw_dw_refresh_health` | freshness, validation, PII boundary | approve/block report |

## Production Contract

ทุก insight ในหน้า dashboard ต้องมี:

- business question id
- mart/view source
- metric ที่ใช้ตัดสินใจ
- recommended action
- confidence level
- quality gate

ข้อมูลเหล่านี้ต้องมาจาก `warehouse/query-results/*.tsv` หรือ live Neon server-side adapter เท่านั้น ห้ามฝังใน `app/`

## Decision Mart Query Results

| File | Purpose |
|---|---|
| `warehouse/query-results/business_questions.tsv` | Business question catalog |
| `warehouse/query-results/decision_insights.tsv` | Decision-ready insights |
| `warehouse/query-results/decision_mart_contract.tsv` | Mart grain and source object contract |
| `warehouse/query-results/warehouse_health.tsv` | Refresh, freshness and quality health |
