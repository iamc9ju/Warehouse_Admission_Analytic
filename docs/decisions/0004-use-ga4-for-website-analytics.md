# ADR 0004: Use GA4 Data API for Website Analytics

## Status

Accepted

## Context

Website traffic is the closest social-adjacent signal to the admissions funnel because users who visit admissions pages are already showing measurable intent. Unlike public social media, website analytics should come from an owned analytics property with explicit access permission.

## Decision

Add a dedicated GA4 website analytics pipeline:

- Fetch aggregate monthly data from Google Analytics Data API `runReport`
- Use service account authentication through environment variables only
- Export only aggregate monthly rows by academic year, channel group and landing page
- Load aggregates into dedicated website analytics fact/dimension tables
- Join website analytics aggregates with admissions year summaries through warehouse views
- Use the existing Node/PostgreSQL loader pattern with `pg`; this makes the new loader consistent with `load_round3_to_neon.cjs` and `load_social_media_to_neon.cjs`

No raw user identifiers, cookies, client IDs or device-level visitor records are stored in the project.

## Consequences

ข้อดี:

- Website data is closer to admissions intent than generic social engagement
- Keeps credentials out of source files
- Preserves privacy by using aggregate GA4 metrics only
- Records `pg` as an explicit runtime dependency so Neon loaders can run without relying on a hidden global package path

ข้อจำกัด:

- Requires access to a GA4 property and a service account granted viewer access
- GA4 attribution and channel grouping depend on the property's tracking setup
- Key events are useful only if admissions actions are configured as GA4 key events
- Historical data only exists from the date GA4 tracking was installed
