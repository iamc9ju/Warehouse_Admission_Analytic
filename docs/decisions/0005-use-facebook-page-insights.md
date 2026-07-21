# ADR 0005: Use Facebook Page API for Page-Owned Social Signals

## Status

Superseded by ADR 0008

## Supersession Note

โปรเจคไม่ใช้ Facebook Page API หรือ social media ingestion ใน active dashboard/warehouse scope แล้ว ADR นี้เก็บไว้เป็นประวัติของแนวทางเดิมเท่านั้น

## Context

Facebook is likely to be an important admissions communication channel, but collecting Facebook data through scraping is risky and can violate platform terms. The project should only ingest Facebook data that the page owner is allowed to access.

## Decision

Add a Facebook Page API collector that uses a page access token and official Graph API endpoints.

The collector exports aggregate monthly rows compatible with the existing social media warehouse:

- 1 mention = 1 page post
- `like_count` = reaction summary total count
- `comment_count` = comment summary total count
- `share_count` = share count when available
- `view_count` = post impressions when the Page Insights permission allows it

The collector writes raw post-level API results to local JSON for audit, then writes monthly aggregate CSV for warehouse loading.

## Required Access

The page owner should provide:

- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`

The Meta app/token normally needs page-related permissions such as:

- `pages_read_engagement`
- `read_insights`
- `pages_show_list` when deriving a page token from a user token

## Consequences

ข้อดี:

- Uses authorized page-owned data instead of scraping
- Fits the existing monthly social warehouse grain
- Can be loaded by `outputs/etl/load_social_media_to_neon.cjs`

ข้อจำกัด:

- Requires admin/business access to the Facebook Page
- Some insight metrics may be unavailable depending on app review, token type and Page permissions
- Metrics are page-owned engagement signals, not complete public conversation data about the university
