# ADR 0006: Use Social Listening CSV Exports for Public Mentions

## Status

Superseded by ADR 0008

## Supersession Note

โปรเจคไม่ใช้ social listening export หรือ public mention feed จาก social platform ใด ๆ ใน active dashboard/warehouse scope แล้ว ADR นี้เก็บไว้เป็นประวัติของแนวทางเดิมเท่านั้น

## Context

The project needs public mentions from people or pages discussing admissions-related keywords on Facebook and other platforms. Facebook Graph API does not provide general public keyword search for arbitrary user posts through normal app permissions. Page Insights measures owned-page performance, not the wider public conversation.

## Decision

Use CSV exports from authorized social listening tools as the source for public mentions.

Examples of acceptable source tools include commercial or institution-approved tools such as Mandala, Wisesight, Zanroo, Brandwatch, Meltwater or any internal export that is permitted by its data provider.

The project normalizes exports through:

```text
outputs/etl/normalize_social_listening_export.cjs
```

The normalized output is compatible with the existing social media warehouse loader:

```text
outputs/etl/load_social_media_to_neon.cjs
```

## Required Export Fields

Minimum useful fields:

- mention date or timestamp
- platform/source
- text/content/title
- matched keyword or query

Optional fields:

- sentiment
- likes/reactions
- comments
- shares
- views/reach/impressions
- URL
- author/page/account name

## Consequences

ข้อดี:

- ตรงกับโจทย์ public mentions มากกว่า Facebook Page Insights
- ไม่ต้อง scrape Facebook เอง
- ใช้กับหลาย vendor ได้ด้วย normalized CSV เดียว
- โหลดเข้า warehouse grain เดิมได้ทันที

ข้อจำกัด:

- ต้องมีบัญชีหรือ export จาก social listening provider
- completeness ขึ้นกับ vendor, keyword setup และสิทธิ์การเข้าถึงข้อมูลของ provider
- ห้ามเก็บข้อมูลส่วนบุคคลที่ไม่จำเป็นลง warehouse; raw export ควรเก็บเฉพาะเท่าที่จำเป็นและควบคุมสิทธิ์เข้าถึง
