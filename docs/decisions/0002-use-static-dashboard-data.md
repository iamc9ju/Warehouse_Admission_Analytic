# ADR 0002: Use Exported Warehouse Snapshot Instead of Client Database Access

## Status

Accepted

## Context

เว็บ dashboard ถูก deploy เป็น public/private production site ผ่าน Sites หากให้เว็บเชื่อมต่อ Neon โดยตรง ต้องจัดการ database credentials และ runtime environment variables เพิ่มเติม

## Decision

ใช้ข้อมูล aggregate ที่ export จาก Neon แล้วเก็บเป็น typed dashboard snapshot ใน `app/data/warehouse-snapshot.ts`

snapshot ต้องระบุ provenance อย่างน้อย:

- source system
- schema
- export date
- source query objects
- quality metric definitions
- data catalog rows
- lineage edges

## Consequences

ข้อดี:

- ไม่มี database credentials ใน browser หรือ source deploy
- Dashboard โหลดเร็วและ deploy ง่าย
- เหมาะกับการนำเสนอโปรเจค
- ไม่ทำให้ตัวเลขดูเป็น hardcoded demo เพราะแยกเป็น warehouse snapshot พร้อม query contract
- ผู้ตรวจสามารถอ่าน `docs/warehouse-query-contract.md` เพื่อดูว่าแต่ละส่วนของ UI มาจาก warehouse object ไหน

ข้อจำกัด:

- หากข้อมูลใน Neon เปลี่ยน ต้อง export/update dashboard ใหม่
- ยังไม่ใช่ real-time dashboard
- ต้องรักษา `app/data/warehouse-snapshot.ts` ให้ตรงกับ query contract ทุกครั้งที่ refresh ข้อมูล

แนวทางขยายในอนาคต:

- เพิ่ม server-side API route ที่อ่านจาก Neon ด้วย environment variable
- เพิ่ม scheduled export สำหรับ dashboard data
