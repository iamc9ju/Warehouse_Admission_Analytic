# ADR 0007: Add Governed Data Warehouse Marts

## Status

Accepted

## Context

The project originally focused on admissions analytics and a dashboard. To make it stronger as a Data Warehouse project, the warehouse needs explicit metadata, lineage, quality scorecards and presentation marts.

## Decision

Add a governed mart layer through:

```text
outputs/sql/warehouse_governance_marts.sql
outputs/etl/apply_warehouse_governance_marts.cjs
```

This adds:

- dataset catalog
- lineage edges
- refresh run log
- table row-count inventory view
- quality scorecard view
- executive admissions mart
- major conversion mart
- channel effectiveness mart

## Consequences

ข้อดี:

- ทำให้ warehouse อธิบายได้ว่าแต่ละ dataset มาจากไหน ใช้ทำอะไร และอยู่ layer ไหน
- Dashboard สามารถนำเสนอ Data Warehouse architecture ได้ ไม่ใช่แค่ KPI ปลายทาง
- เพิ่ม quality และ lineage evidence สำหรับรายงานหรือการตรวจโปรเจกต์
- ยังไม่เพิ่ม dependency ใหม่

ข้อจำกัด:

- ตอนนี้ mart เป็น SQL views ไม่ใช่ materialized views เพราะข้อมูลยังเล็กและต้องการให้ refresh ง่าย
- Facebook public mentions แบบ manual ยังเป็น sample ขนาดเล็ก ต้อง label ให้ชัดเจน
