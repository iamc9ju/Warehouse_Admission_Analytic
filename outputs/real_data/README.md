# Real Data Outputs

โฟลเดอร์นี้ใช้เก็บผลลัพธ์จากตัวดึงข้อมูลจริง เช่น Social Media, News และ Website Analytics

## Collectors

### GDELT News

```bash
node outputs/etl/fetch_gdelt_news_mentions.cjs
```

ผลลัพธ์:

- `outputs/real_data/gdelt_news_mentions_monthly.csv`
- `outputs/real_data/gdelt_news_articles.json`

### YouTube Data API

ต้องมี API key จาก Google Cloud ก่อน:

```bash
YOUTUBE_API_KEY="..." node outputs/etl/fetch_youtube_mentions.cjs
```

ผลลัพธ์:

- `outputs/real_data/youtube_mentions_monthly.csv`
- `outputs/real_data/youtube_videos.json`

### Facebook Page API

ต้องมี Page ID และ Page access token จาก Meta Graph API:

```bash
FACEBOOK_PAGE_ID="..." \
FACEBOOK_PAGE_ACCESS_TOKEN="..." \
node outputs/etl/fetch_facebook_page_insights.cjs
```

ผลลัพธ์:

- `outputs/real_data/facebook_page_mentions_monthly.csv`
- `outputs/real_data/facebook_page_posts.json`

### Social Listening Export

ใช้สำหรับข้อมูล public mentions จากบุคคลอื่นหรือเพจอื่นที่พูดถึง keyword:

```bash
SOCIAL_LISTENING_EXPORT_CSV="/path/to/export.csv" \
SOCIAL_LISTENING_VENDOR="Mandala" \
SOCIAL_LISTENING_DEFAULT_PLATFORM="Facebook" \
node outputs/etl/normalize_social_listening_export.cjs
```

ผลลัพธ์:

- `outputs/real_data/social_listening_mentions_monthly.csv`
- `outputs/real_data/social_listening_mentions_normalized.json`

ดูตัวอย่างรูปแบบ export ขั้นต่ำได้ที่:

```text
outputs/sample_data/social_listening_export_template.csv
```

### GA4 Website Analytics

ต้องมี GA4 property ID และ service account ที่มีสิทธิ์อ่าน property:

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

หรือส่ง service account JSON ผ่าน environment variable:

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

ผลลัพธ์:

- `outputs/real_data/ga4_website_monthly.csv`
- `outputs/real_data/ga4_website_raw.json`

## Load to Neon

Social media/news CSV:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/gdelt_news_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

Facebook Page CSV:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/facebook_page_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

Social listening CSV:

```bash
DATABASE_URL="postgresql://..." \
SOCIAL_MEDIA_CSV="outputs/real_data/social_listening_mentions_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_social_media_to_neon.cjs
```

Website analytics CSV:

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

อย่า commit API keys, service account JSON หรือ database credentials ลง repo
