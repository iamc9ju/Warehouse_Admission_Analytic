# ADR 0002: Use Static Dashboard Data Instead of Client Database Access

## Status

Accepted

## Context

เว็บ dashboard ถูก deploy เป็น public/private production site ผ่าน Sites หากให้เว็บเชื่อมต่อ Neon โดยตรง ต้องจัดการ database credentials และ runtime environment variables เพิ่มเติม

## Decision

ใช้ข้อมูล aggregate ที่ export จาก Neon แล้ว hardcode เป็น dashboard data ภายใน `app/page.tsx` สำหรับเวอร์ชันพรีเซนต์

## Consequences

ข้อดี:

- ไม่มี database credentials ใน browser หรือ source deploy
- Dashboard โหลดเร็วและ deploy ง่าย
- เหมาะกับการนำเสนอโปรเจค

ข้อจำกัด:

- หากข้อมูลใน Neon เปลี่ยน ต้อง export/update dashboard ใหม่
- ยังไม่ใช่ real-time dashboard

แนวทางขยายในอนาคต:

- เพิ่ม server-side API route ที่อ่านจาก Neon ด้วย environment variable
- เพิ่ม scheduled export สำหรับ dashboard data

