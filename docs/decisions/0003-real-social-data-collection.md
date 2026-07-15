# ADR 0003: Collect Real Social Signals Through Official or Public APIs

## Status

Accepted

## Context

โปรเจคต้องการวิเคราะห์ Social Media Impact แต่ platform แต่ละตัวมีข้อจำกัดต่างกัน เช่น YouTube ต้องใช้ API key, Facebook/TikTok/X ต้องมี permission หรือ paid/research access และ scraping อาจละเมิด terms of service

## Decision

เริ่มจากช่องทางที่ทำได้ปลอดภัยและตรวจสอบได้:

- YouTube Data API สำหรับวิดีโอและ engagement metrics
- GDELT DOC API สำหรับข่าว/เว็บไซต์ที่กล่าวถึง keyword
- Facebook Page API สำหรับโพสต์และ Page-owned engagement/insights เมื่อเจ้าของเพจให้สิทธิ์
- Social listening CSV export สำหรับ public mentions จากบุคคลอื่นหรือเพจอื่นที่พูดถึง keyword

ยังไม่ดึง TikTok, X หรือ Pantip แบบ scraping จนกว่าจะมีสิทธิ์หรือ API ที่อนุญาตชัดเจน

## Consequences

ข้อดี:

- ลดความเสี่ยงด้าน policy และ privacy
- มี source ที่อธิบายและทำซ้ำได้
- เข้ากับ warehouse schema เดิม

ข้อจำกัด:

- YouTube ต้องใช้ API key
- Facebook ต้องใช้ Page access token และ permission ที่เหมาะสม
- Public mentions จาก Facebook ต้องใช้ social listening export หรือ provider ที่มีสิทธิ์เข้าถึงข้อมูลตาม policy
- GDELT เป็น news/web coverage ไม่ใช่ social engagement เต็มรูปแบบ
- sentiment ยังเป็นค่า neutral default จนกว่าจะเพิ่มโมเดลวิเคราะห์ภาษาไทย
