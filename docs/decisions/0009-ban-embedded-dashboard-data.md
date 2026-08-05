# ADR 0009: Ban embedded dashboard data

## Status

Accepted

## Decision

ห้ามฝัง admissions dashboard data เป็น TypeScript arrays, constants หรือ component-local literals ใน `app/` อีกต่อไป

Dashboard ต้องอ่านข้อมูลผ่าน production data contract เท่านั้น:

```text
Primary:
  DATABASE_URL
    -> app/data/live-neon-dashboard-adapter.ts
    -> admissions_dw marts/views
    -> DashboardPage

Fallback:
  warehouse/query-results/*.tsv
    -> npm run data:build
    -> app/data/generated/warehouse-dashboard-snapshot.json
    -> app/data/load-dashboard-snapshot.ts
    -> route page
    -> DashboardPage
```

## Rationale

กฎนี้ทำให้ dashboard พิสูจน์ได้ว่า:

- ตัวเลขมาจาก warehouse mart/query result ไม่ใช่ UI mock
- refresh ข้อมูลทำซ้ำได้
- validation gate ตรวจ row count, PII boundary, source coverage และ lineage ก่อน build
- reviewer สามารถ trace จากหน้า dashboard กลับไป source, mart และ quality contract ได้

## Enforcement

`npm test` ต้องรัน:

```bash
npm run data:build
npm run data:validate
npm run data:check-static
npm run build
node --test tests/rendered-html.test.mjs
```

ถ้า component หรือ route page มี data array ฝังอยู่ `data:check-static` ต้อง fail ทันที

## Consequences

- การแก้ตัวเลข dashboard ต้องแก้ที่ warehouse query result หรือ pipeline เท่านั้น
- `app/dashboard-page.tsx` ทำหน้าที่ render และ interaction ไม่ใช่แหล่งข้อมูล
- Neon production query ต้องอยู่หลัง server-side loader/adapter เท่านั้น ไม่กระจาย query ใน component
