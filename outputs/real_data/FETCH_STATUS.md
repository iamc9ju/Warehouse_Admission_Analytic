# Real Data Fetch Status

## Current Status

Social media ingestion has been removed from the active project scope.

The project should not fetch, normalize, load or display data from:

- YouTube Data API
- Facebook Page API
- Facebook public search captures
- Social listening exports
- Public mention feeds from social platforms
- Scraping or unofficial social collectors

Historical social output files may remain locally for audit context, but they are not active dashboard or warehouse inputs.

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

## Load GA4 Website Analytics CSV to Neon

Once `outputs/real_data/ga4_website_monthly.csv` exists:

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

Do not commit API keys, service account JSON or database credentials.
