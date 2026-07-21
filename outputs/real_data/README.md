# Real Data Outputs

โฟลเดอร์นี้ใช้เก็บผลลัพธ์จากแหล่งข้อมูลจริงที่ยังอยู่ใน active scope

## Active Scope

### GA4 Website Analytics

ใช้เฉพาะ aggregate website analytics จาก GA4 property ที่หน่วยงานเป็นเจ้าของหรือมีสิทธิ์อ่านชัดเจน:

```bash
GA4_PROPERTY_ID="..." \
GA4_SERVICE_ACCOUNT_FILE="/secure/path/service-account.json" \
node outputs/etl/fetch_ga4_website_analytics.cjs
```

ผลลัพธ์ที่คาดหวัง:

- `outputs/real_data/ga4_website_monthly.csv`
- `outputs/real_data/ga4_website_raw.json`

โหลดเข้า Neon:

```bash
DATABASE_URL="postgresql://..." \
WEBSITE_ANALYTICS_CSV="outputs/real_data/ga4_website_monthly.csv" \
NODE_PATH="/path/to/node_modules" \
node outputs/etl/load_website_analytics_to_neon.cjs
```

## Removed From Active Scope

ไม่ใช้ข้อมูลจาก social media ingestion ทุกช่องทางแล้ว:

- YouTube Data API
- Facebook Page API
- Facebook public search captures
- Social listening exports
- Public mention feeds จาก social platform ใด ๆ
- Scraping หรือ unofficial social collectors

ไฟล์ social ที่เคยอยู่ในโฟลเดอร์นี้ถือเป็น historical artifacts เท่านั้น ไม่ควรนำเข้า dashboard, mart หรือ report ใหม่

Do not commit API keys, service account JSON or database credentials.
