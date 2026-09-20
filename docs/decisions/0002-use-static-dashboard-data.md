# ADR 0002: Use Exported Warehouse Snapshot Instead of Client Database Access

## Status

Superseded by [ADR 0009](0009-ban-embedded-dashboard-data.md) and the Neon-only runtime.

## Context

เว็บ dashboard ถูก deploy เป็น public/private production site ผ่าน Sites หากให้เว็บเชื่อมต่อ Neon โดยตรง ต้องจัดการ database credentials และ runtime environment variables เพิ่มเติม

## Decision

แนวทางเดิมใช้ข้อมูล aggregate ที่ export จาก Neon แล้วเก็บเป็น typed dashboard snapshot ใน `app/data/warehouse-snapshot.ts`

กฎ production ปัจจุบันยกเลิกแนวทางนี้ทั้งหมด Dashboard query Neon ผ่าน server-side repositories โดยตรง
และไม่มี static/generated fallback

snapshot ต้องระบุ provenance อย่างน้อย:

- source system
- schema
- export date
- source query objects
- quality metric definitions
- data catalog rows
- lineage edges

## Consequences

เหตุผลที่เลิกใช้:

- snapshot มีโอกาสล้าสมัยจาก Neon
- ต้องดูแล TSV, JSON และ pipeline ซ้ำกับ live query
- Runtime ปัจจุบันเก็บ credential ฝั่ง server และ fail ชัดเจนเมื่อ Neon ไม่พร้อม
