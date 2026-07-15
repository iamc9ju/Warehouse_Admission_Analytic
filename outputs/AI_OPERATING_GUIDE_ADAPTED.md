# AI Operating Guide for This Project

## Project Context

โปรเจคนี้คือ **Social Media Impact Analytics for Engineering Admissions** สำหรับออกแบบ Data Warehouse เพื่อวิเคราะห์ความสัมพันธ์ระหว่างข้อมูลการรับสมัครนักศึกษาและข้อมูล Social Media ของคณะวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน

โปรเจคนี้เน้นงานด้าน:

- Data Warehouse Design
- PostgreSQL Star Schema
- ETL Process
- Social Media Analytics
- Admissions Analytics
- KPI Definition
- BI Dashboard Specification

โปรเจคนี้ยังไม่ใช่ backend application แบบ NestJS/API ดังนั้นกฎที่เกี่ยวกับ Controller, Swagger, DTO, `packages/core`, `packages/contracts`, และ `packages/integrations` จะใช้เฉพาะเมื่อมีการเพิ่ม API/backend ในอนาคตเท่านั้น

---

## Read Before Editing

ก่อนวิเคราะห์หรือแก้ไขไฟล์ใด ๆ ให้ AI อ่านไฟล์หลักเหล่านี้ก่อน:

1. `outputs/README.md`
2. `outputs/social_media_impact_dw_project.md`
3. `outputs/social_media_impact_dw_schema.sql`
4. README หรือเอกสารใหม่ใน module/domain ที่เกี่ยวข้อง ถ้ามีการเพิ่มในอนาคต
5. เอกสาร decision หรือ note ที่เกี่ยวข้อง ถ้ามีการสร้างโฟลเดอร์ `docs/decisions`

ถ้ายังไม่มี README หรือ docs เฉพาะส่วน ให้ AI อธิบายสมมติฐานที่ใช้ก่อนเสนอการเปลี่ยนแปลง

---

## Collaboration Mode

AI ต้องทำงานแบบ **copilot** ไม่ใช่ autonomous coding agent โดยค่าเริ่มต้น

หลักการทำงาน:

- อธิบายภาพรวมก่อนลงรายละเอียด
- บอกไฟล์ที่เกี่ยวข้องก่อนเสนอ code หรือ SQL
- อธิบายว่าควรเปลี่ยนอะไรและทำไม ก่อนแสดงวิธีเปลี่ยน
- ไม่แก้ไฟล์จริง ไม่รัน migration และไม่เปลี่ยน schema เว้นแต่ผู้ใช้สั่งชัดเจน
- ถ้าผู้ใช้สั่งให้แก้ไฟล์ ให้แก้เฉพาะจุดที่เกี่ยวข้อง
- เมื่อเสนอ code หรือ SQL ต้องเป็น production-ready และสามารถ copy/paste ได้
- หลีกเลี่ยง placeholder, pseudo-code หรือคำตอบกว้าง ๆ หากผู้ใช้ขอ implementation

---

## Project Structure Rules

ให้รักษาโครงสร้างไฟล์ให้ชัดเจนตามชนิดงาน:

- เอกสารโปรเจคหลักอยู่ใน `outputs/social_media_impact_dw_project.md`
- PostgreSQL schema อยู่ใน `outputs/social_media_impact_dw_schema.sql`
- เอกสารกฎสำหรับ AI อยู่ใน `outputs/AI_OPERATING_GUIDE_ADAPTED.md`
- README หลักของชุด deliverables อยู่ใน `outputs/README.md`
- sample data อยู่ใน `outputs/sample_data/`
- หากเพิ่ม ETL script ให้สร้างในตำแหน่งที่สื่อความหมาย เช่น `work/etl/` หรือ `outputs/etl/` ตามวัตถุประสงค์
- หากเพิ่ม sample data ให้แยกเป็นไฟล์เฉพาะ เช่น `sample_admissions.csv` และ `sample_social_media.csv`
- หลีกเลี่ยงโฟลเดอร์ชื่อกว้างเกินไป เช่น `misc`, `shared`, `temp-data` สำหรับไฟล์ที่ควรมี domain ชัดเจน

---

## Data Warehouse Rules

ทุกครั้งที่เพิ่มหรือแก้ไข Data Warehouse design ต้องรักษากฎต่อไปนี้:

1. ระบุ grain ของ fact table ให้ชัดเจน
2. แยก dimension และ fact table ตามหลัก Star Schema
3. หลีกเลี่ยงการ join fact table กับ fact table โดยตรงถ้าอาจทำให้เกิด row multiplication
4. หากต้องวิเคราะห์ข้าม fact table ให้ aggregate fact แต่ละชุดก่อน แล้วค่อย join กัน
5. ทุก measure ต้องมีนิยามชัดเจน
6. ทุก KPI ต้องมีสูตร
7. ทุก dimension ที่เป็นค่าซ้ำ เช่น platform, sentiment, keyword, department ต้อง normalize เป็น dimension table
8. ข้อมูลวันที่ต้องอ้างอิงผ่าน `dim_time`
9. ข้อมูล Social Media ต้องเก็บ source หรือ platform ให้ตรวจสอบย้อนกลับได้
10. ห้ามเพิ่ม metric ที่ไม่มี business question รองรับ

---

## SQL Rules

เมื่อเขียนหรือแก้ไข SQL:

- ใช้ PostgreSQL-compatible SQL
- ตั้งชื่อ table และ column แบบ `snake_case`
- ใช้ primary key และ foreign key ให้ครบ
- เพิ่ม index สำหรับ foreign key ที่ใช้ join บ่อย
- ใช้ `CHECK` constraint สำหรับค่าที่ไม่ควรติดลบ เช่น applicants, mentions, likes
- ใช้ `NULLIF` เพื่อป้องกัน divide-by-zero ใน KPI
- ใช้ `COALESCE` เฉพาะกรณีที่ค่าศูนย์มีความหมายทางธุรกิจจริง
- หลีกเลี่ยง magic strings ใน query analysis หากควรอยู่ใน dimension table
- ห้าม hardcode ค่า platform, sentiment หรือ department ใน business logic เว้นแต่เป็น seed data ที่อธิบายชัดเจน
- หลีกเลี่ยงการรวม admissions facts และ social media facts ใน query เดียวโดยไม่ aggregate ก่อน

---

## ETL Rules

หากเพิ่ม ETL ในอนาคต ให้ AI ปฏิบัติตามนี้:

- แยกขั้นตอน Extract, Transform, Load ให้ชัดเจน
- เก็บ raw data หรือ staging data แยกจาก warehouse table
- ทำ data cleaning ก่อน load เข้า fact/dimension
- normalize ชื่อสาขา จังหวัด platform และ sentiment ก่อน load
- ระบุ rule สำหรับ missing value และ duplicate record
- ห้าม scrape ข้อมูลที่ละเมิด terms of service หรือข้อมูลส่วนบุคคลที่ไม่ได้รับอนุญาต
- ถ้าใช้ Social Media API ต้องระบุ permission และข้อจำกัดของ API
- ห้าม hardcode secret, token, API key หรือ credential
- ถ้า environment variable จำเป็น ต้องมี validation และ fail fast เมื่อไม่มีค่า

---

## Social Media Data Rules

ข้อมูล Social Media ต้องระบุอย่างน้อย:

- date หรือ collected date
- platform
- keyword
- post text หรือ normalized text ถ้าเก็บได้
- engagement metrics เช่น like, comment, share, view
- sentiment
- source URL หรือ source ID ถ้ามี

ข้อควรระวัง:

- แยก `mention_count` ออกจาก `engagement_score`
- ไม่ถือว่า engagement สูงแปลว่าผู้สมัครสูงเสมอ ต้องพิสูจน์ด้วย analysis
- Sentiment ภาษาไทยอาจมีความคลาดเคลื่อน ต้องระบุ limitation
- Platform แต่ละตัวมี metric ไม่เหมือนกัน เช่น view ใน YouTube/TikTok อาจไม่เทียบตรงกับ Facebook

---

## Admissions Data Rules

ข้อมูล admissions ต้องรักษา funnel ordering:

```text
Applicants >= Interview Passed >= Confirmed >= Enrolled
```

หากข้อมูลจริงไม่เป็นไปตามนี้ AI ต้อง:

1. ไม่แก้ตัวเลขเองโดยไม่มี rule
2. ระบุว่าเป็น data quality issue
3. เสนอวิธีตรวจสอบหรือ staging validation

ควรแยกการวิเคราะห์ตาม:

- academic year
- TCAS round
- department
- province
- date period

---

## Dashboard Rules

Dashboard ทุกหน้า ต้องผูกกับ business question หรือ KPI เสมอ

Dashboard หลักของโปรเจคนี้:

1. Admissions Overview
2. Admissions Trend
3. Social Media Trend
4. Platform Analytics
5. Sentiment Analysis
6. Keyword Analytics
7. Admissions Funnel
8. Correlation Dashboard

เมื่อเพิ่ม dashboard ใหม่ ต้องระบุ:

- business question
- target user
- KPI หรือ metric
- dimension/filter
- chart type
- data source table/view

---

## Documentation Rules

เมื่อมีการเปลี่ยนแปลงต่อไปนี้ ต้องอัปเดตเอกสาร:

- เพิ่มหรือแก้ fact table
- เพิ่มหรือแก้ dimension table
- เปลี่ยน grain ของ table
- เปลี่ยนสูตร KPI
- เพิ่ม dashboard
- เปลี่ยน ETL workflow
- เปลี่ยนข้อจำกัดของ data source
- เพิ่ม dependency ใหม่

ต้องบันทึก decision ที่ไม่ obvious เช่น:

- เหตุผลที่เลือก grain ของ fact table
- เหตุผลที่แยกหรือรวม dimension
- เหตุผลที่เลือกสูตร engagement
- เหตุผลที่ใช้ correlation รายเดือนแทนรายวัน
- ข้อจำกัดของ sentiment analysis ภาษาไทย

---

## Backend/API Rules for Future Expansion

หากในอนาคตโปรเจคนี้เพิ่ม backend API ให้กลับมาใช้กฎต่อไปนี้:

- Controllers ต้องบางและไม่ทำ business logic หนัก
- Database query และ complex logic ต้องอยู่ใน service/repository layer
- Request/response contracts ต้องแยกไว้ก่อนสร้าง DTO
- ทุก endpoint ต้องมี Swagger decorators เช่น `@ApiOperation`, `@ApiOkResponse`, `@ApiQuery`
- Swagger response ต้องใช้ DTO class ไม่ inline raw JSON schema
- หลีกเลี่ยง `any` ใน TypeScript
- ใช้ `unknown`, generics หรือ typed interfaces แทน
- หลีกเลี่ยง try-catch ที่ไม่จำเป็นใน controller/service
- ใช้ exception filter สำหรับ error handling กลาง
- ห้าม hardcode secret หรือ production fallback
- ถ้าระบบรองรับหลายหน่วยงาน ต้อง enforce tenant isolation ด้วย `organizationId`, `campusId`, หรือ key ที่เหมาะสม

---

## Validation Checklist

ก่อนส่งงานทุกครั้ง AI ควรตรวจสอบ:

- ไฟล์ที่แก้ตรงกับคำขอของผู้ใช้
- ไม่มีการแก้ไฟล์เกินขอบเขต
- SQL table/column names สอดคล้องกัน
- query ตัวอย่างใช้ column ที่มีอยู่จริงใน schema
- fact-to-fact analysis aggregate ก่อน join
- KPI มีสูตรครบ
- dashboard เชื่อมกับ business question
- ไม่มี credential หรือ secret ในไฟล์
- ระบุ limitation หรือ follow-up ที่ยังไม่ได้ทำ
- หากไม่ได้รัน validation ต้องบอกเหตุผล

---

## Response Style for AI

เมื่อตอบผู้ใช้ ให้จัดคำตอบแบบนี้หากงานมีขนาดใหญ่:

1. Current system behavior
2. Next implementation step
3. Files involved
4. Exact changes by file
5. Production-ready code or SQL
6. Validation checklist

ถ้างานเล็ก ให้ตอบสั้น กระชับ และระบุไฟล์ที่เกี่ยวข้องโดยตรง

---

## Important Principle

เป้าหมายของ AI ในโปรเจคนี้คือช่วยให้ผู้ใช้เข้าใจระบบและควบคุมการตัดสินใจเองได้ ไม่ใช่เร่งแก้ไฟล์ให้มากที่สุด

AI ต้องช่วยรักษาคุณภาพของ Data Warehouse, ความถูกต้องของ SQL, ความชัดเจนของ KPI และความเชื่อมโยงกับ business questions เป็นหลัก
