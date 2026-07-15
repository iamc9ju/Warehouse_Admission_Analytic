# Facebook Public Mentions Manual Collection

ไฟล์นี้ใช้สำหรับเก็บ public mentions แบบไม่ใช้ Mandala/Wisesight/Zanroo/Brandwatch/Meltwater
เพราะ Facebook Graph API ปกติไม่เปิดให้ค้นหา public posts ด้วย keyword ทั่วทั้งแพลตฟอร์ม

## ใช้ไฟล์ไหน

กรอกข้อมูลจริงลงไฟล์นี้:

```text
outputs/manual_collection/facebook_public_mentions_manual_input.csv
```

Column ที่ต้องกรอกอย่างน้อย:

- `date`: วันที่โพสต์ เช่น `2025-04-22`
- `platform`: ใส่ `Facebook`
- `text`: ข้อความโพสต์หรือข้อความสรุปจากโพสต์ที่เห็นได้แบบ public
- `keyword`: keyword ที่ค้นเจอ เช่น `วิศวะเกษตรกำแพงแสน`
- `sentiment`: `Positive`, `Neutral`, หรือ `Negative`
- `url`: ลิงก์โพสต์

Column ตัวเลขถ้าไม่เห็นค่า ให้ใส่ `0`:

- `likes`
- `comments`
- `shares`
- `views`

`author` ให้ใส่ชื่อเพจ/บัญชีเท่าที่จำเป็น เช่น `public-page` หรือชื่อเพจสาธารณะ
หลีกเลี่ยงการเก็บข้อมูลส่วนบุคคลที่ไม่จำเป็น

## Keyword Set

ใช้ keyword ชุดนี้ก่อน เพื่อให้ตรงกับ pipeline เดิม:

- `วิศวะเกษตรกำแพงแสน`
- `วิศวกรรมศาสตร์ กำแพงแสน`
- `คณะวิศวกรรมศาสตร์ กำแพงแสน`
- `KU KPS Engineering`
- `TCAS วิศวะเกษตร`
- `สอบเข้าวิศวะเกษตร`
- `เข้าวิศวะเกษตร`
- `รับสมัครวิศวะเกษตร`
- `รีวิววิศวะเกษตร`

## Facebook Search Links

เปิดลิงก์แล้วเลือกผลลัพธ์ประเภท Posts / โพสต์ ถ้ามี filter วันที่ให้ใช้ช่วง admissions window

- [วิศวะเกษตรกำแพงแสน](https://www.facebook.com/search/posts/?q=%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3%E0%B8%81%E0%B8%B3%E0%B9%81%E0%B8%9E%E0%B8%87%E0%B9%81%E0%B8%AA%E0%B8%99)
- [วิศวกรรมศาสตร์ กำแพงแสน](https://www.facebook.com/search/posts/?q=%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%81%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C%20%E0%B8%81%E0%B8%B3%E0%B9%81%E0%B8%9E%E0%B8%87%E0%B9%81%E0%B8%AA%E0%B8%99)
- [คณะวิศวกรรมศาสตร์ กำแพงแสน](https://www.facebook.com/search/posts/?q=%E0%B8%84%E0%B8%93%E0%B8%B0%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%81%E0%B8%A3%E0%B8%A3%E0%B8%A1%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C%20%E0%B8%81%E0%B8%B3%E0%B9%81%E0%B8%9E%E0%B8%87%E0%B9%81%E0%B8%AA%E0%B8%99)
- [KU KPS Engineering](https://www.facebook.com/search/posts/?q=KU%20KPS%20Engineering)
- [TCAS วิศวะเกษตร](https://www.facebook.com/search/posts/?q=TCAS%20%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3)
- [สอบเข้าวิศวะเกษตร](https://www.facebook.com/search/posts/?q=%E0%B8%AA%E0%B8%AD%E0%B8%9A%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3)
- [เข้าวิศวะเกษตร](https://www.facebook.com/search/posts/?q=%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3)
- [รับสมัครวิศวะเกษตร](https://www.facebook.com/search/posts/?q=%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%AA%E0%B8%A1%E0%B8%B1%E0%B8%84%E0%B8%A3%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3)
- [รีวิววิศวะเกษตร](https://www.facebook.com/search/posts/?q=%E0%B8%A3%E0%B8%B5%E0%B8%A7%E0%B8%B4%E0%B8%A7%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B8%A9%E0%B8%95%E0%B8%A3)

## Admissions Windows

เก็บเฉพาะช่วงนี้ก่อน เพื่อเทียบกับข้อมูล TCAS รอบ 3:

- ปีการศึกษา 2568: `2024-12-01` ถึง `2025-06-30`
- ปีการศึกษา 2569: `2025-12-01` ถึง `2026-06-30`

## ตัวอย่างแถวที่ถูกต้อง

```csv
date,platform,text,keyword,sentiment,likes,comments,shares,views,url,author
2025-04-22,Facebook,"รีวิววิศวะเกษตรกำแพงแสน บรรยากาศดีมาก","วิศวะเกษตรกำแพงแสน",Positive,35,8,6,0,https://facebook.com/example-post,public-page
```

## Normalize หลังกรอกเสร็จ

```bash
SOCIAL_LISTENING_EXPORT_CSV="outputs/manual_collection/facebook_public_mentions_manual_input.csv" \
SOCIAL_LISTENING_VENDOR="Manual Facebook Public Search" \
SOCIAL_LISTENING_DEFAULT_PLATFORM="Facebook" \
node outputs/etl/normalize_social_listening_export.cjs
```

ไฟล์ output จะออกที่:

```text
outputs/real_data/social_listening_mentions_monthly.csv
outputs/real_data/social_listening_mentions_normalized.json
```

ถ้าต้องโหลดเข้า Neon ให้ใช้ `.env` local ของเครื่องนี้ แล้วรัน:

```bash
set -a
source .env
set +a
SOCIAL_MEDIA_CSV="outputs/real_data/social_listening_mentions_monthly.csv" \
node outputs/etl/load_social_media_to_neon.cjs
```
