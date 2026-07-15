# Real Data Fetch Status

## Current Status

Real collectors have been added, but live data collection is not fully completed yet.

## GDELT News

Collector:

```text
outputs/etl/fetch_gdelt_news_mentions.cjs
```

Status:

- Implemented
- Tested network access
- HTTPS endpoint reset the connection in this environment
- HTTP endpoint responded, but returned `429` rate limit repeatedly
- Collector was adjusted to use a broad query and fewer requests, but the API still returned `429`

Next action:

```bash
node outputs/etl/fetch_gdelt_news_mentions.cjs
```

Run again later, or from a network/IP that is not currently rate limited.

## YouTube Data API

Collector:

```text
outputs/etl/fetch_youtube_mentions.cjs
```

Status:

- Implemented
- Requires `YOUTUBE_API_KEY`
- Run completed successfully after API key was provided
- Exported 79 raw videos and 31 monthly aggregate rows
- Loaded to Neon as platform `YouTube API`

Re-run action:

```bash
YOUTUBE_API_KEY="..." node outputs/etl/fetch_youtube_mentions.cjs
```

## Facebook Page API

Collector:

```text
outputs/etl/fetch_facebook_page_insights.cjs
```

Status:

- Implemented
- Requires `FACEBOOK_PAGE_ID`
- Requires `FACEBOOK_PAGE_ACCESS_TOKEN`
- Uses official Graph API page-owned data, not scraping
- Exports monthly aggregate rows compatible with `load_social_media_to_neon.cjs`
- Not run yet because Page ID and Page access token have not been provided

Expected permissions:

- `pages_read_engagement`
- `read_insights`
- `pages_show_list` when deriving a Page token from a user token

Run action:

```bash
FACEBOOK_PAGE_ID="..." \
FACEBOOK_PAGE_ACCESS_TOKEN="..." \
node outputs/etl/fetch_facebook_page_insights.cjs
```

Load action:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/facebook_page_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

## Social Listening Public Mentions

Normalizer:

```text
outputs/etl/normalize_social_listening_export.cjs
```

Status:

- Implemented
- Uses CSV export from an authorized social listening provider
- Intended for public mentions from other people/pages about tracked keywords
- Not the same as Facebook Page Insights, which only measures owned-page performance
- Outputs monthly aggregate rows compatible with `load_social_media_to_neon.cjs`

Expected minimum columns:

- date or timestamp
- platform/source
- text/content/title
- keyword or matched keyword

Optional columns:

- sentiment
- likes/reactions
- comments
- shares
- views/reach/impressions
- URL
- author/page/account

Run action:

```bash
SOCIAL_LISTENING_EXPORT_CSV="/path/to/export.csv" \
SOCIAL_LISTENING_VENDOR="Mandala" \
SOCIAL_LISTENING_DEFAULT_PLATFORM="Facebook" \
node outputs/etl/normalize_social_listening_export.cjs
```

Load action:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/social_listening_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

## GA4 Website Analytics

Collector:

```text
outputs/etl/fetch_ga4_website_analytics.cjs
```

Status:

- Implemented
- Requires `GA4_PROPERTY_ID`
- Requires `GA4_SERVICE_ACCOUNT_FILE` or `GA4_SERVICE_ACCOUNT_JSON`
- Exports aggregate monthly rows only; no user-level identifiers are stored
- Service account authentication worked for property `524676058`
- GA4 Data API returned 0 rows for both admissions windows
- Diagnostic range `2020-01-01` to `2026-07-15` also returned 0 rows, which usually means the GA4 property has no collected traffic yet or the selected property is not the website's active property

Run action:

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

Diagnostic action:

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" \
GA4_DATE_WINDOWS_JSON='[{"academic_year":9999,"startDate":"2020-01-01","endDate":"2026-07-15"}]' \
GA4_OUTPUT_CSV="outputs/real_data/ga4_website_diagnostic_all_time.csv" \
GA4_OUTPUT_RAW_JSON="outputs/real_data/ga4_website_diagnostic_all_time_raw.json" \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

## Load Real Social CSV to Neon

Once a real CSV exists:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/gdelt_news_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

## Load GA4 Website Analytics CSV to Neon

Once `outputs/real_data/ga4_website_monthly.csv` exists:

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

Do not commit API keys, service account JSON or database credentials.
