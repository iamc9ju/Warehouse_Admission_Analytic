# ADR 0008: Remove Social Media Ingestion From Active Scope

## Status

Accepted

## Context

โปรเจคเคยทดลอง social media impact layer ผ่าน YouTube, Facebook Page API, manual public-search capture และ social listening export แต่ข้อมูลลักษณะนี้มีข้อจำกัดด้านความครบถ้วนของ coverage, platform policy, permission, bias ระหว่างช่องทาง และความเสี่ยงในการตีความ engagement เป็นเหตุผลที่ทำให้จำนวนผู้สมัครเปลี่ยน

ผู้ใช้ตัดสินใจว่าโปรเจคจะไม่ใช้ข้อมูลจากการดึง social media ไม่ว่าจะเป็นช่องทางใดอีกต่อไป

## Decision

เอา social media ingestion ออกจาก active dashboard, warehouse marts, documentation และ runbook

แหล่งข้อมูลที่ไม่ใช้ต่อ:

- YouTube Data API
- Facebook Page API
- Facebook public search captures
- Social listening CSV exports
- Public mention feeds จาก social platform ใด ๆ
- Scraping หรือ unofficial social collectors

แหล่งข้อมูลที่ยังอยู่ใน scope:

- Excel admissions files
- PII-free admissions aggregate CSV
- Neon PostgreSQL admissions warehouse
- GA4 aggregate reports จาก owned website property ที่มีสิทธิ์อ่านชัดเจน

## Consequences

ข้อดี:

- ลด platform policy และ permission risk
- ลดโอกาสตีความ social engagement เกินจริง
- ทำให้ dashboard โฟกัสที่ admissions facts และ owned analytics
- ทำให้ data privacy boundary อธิบายง่ายขึ้น

ข้อจำกัด:

- Dashboard จะไม่ตอบคำถามเรื่อง public social sentiment, mentions หรือ platform engagement
- หากต้องวิเคราะห์ marketing effectiveness ต่อ ควรใช้ owned website analytics, campaign-tagged landing pages หรือ admissions event tracking ที่มีสิทธิ์ชัดเจนแทน
- Social scripts/outputs ที่เคยสร้างไว้ใน ignored `outputs/` ถือเป็น historical artifacts ไม่ใช่ active pipeline
