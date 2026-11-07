# TCAS Admissions Data Warehouse & AI Analytics (Faculty of Engineering)

ระบบคลังข้อมูล (Data Warehouse) และเว็บแดชบอร์ดวิเคราะห์ข้อมูลการรับสมัครนักศึกษา TCAS รอบ 1–4 ปีการศึกษา 2567–2569 ของคณะวิศวกรรมศาสตร์ กำแพงแสน พร้อมระบบวิเคราะห์เชิงลึกอัตโนมัติด้วย AI (Google Gemini 3.1)

---

## 👥 คณะผู้จัดทำ (Team Members)

| รหัสนิสิต | ชื่อ - นามสกุล |
| :---: | :--- |
| **`6620503411`** | ธนวัฒน์ สมานรักษ์ |
| **`6620503608`** | อธิบดี พรมกุล |
| **`6620503659`** | อิทธิพล บทมูล |

---

## 🔗 ลิงก์และ URL สำคัญ

- **GitHub Repository:** `https://github.com/iamc9ju/Warehouse_Admission_Analytic`
- **Production Edge (Cloudflare Workers):** `https://admission-eng.kukps.workers.dev`
- **Web Dashboard (Local / Docker):** `http://localhost:3000`
- **AI Analysis Interface:** `http://localhost:3000/ai-analysis`

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
WH-V2/
├── 6620503659.pdf                        # เอกสารคู่มือการติดตั้งและเปิดใช้งานด้วย Docker (PDF)
├── schema.sql                            # ไฟล์ PostgreSQL Schema Dump (DDL ตาราง, Indexes, และ Views ทั้งหมด)
├── README.md                             # เอกสารสรุปโครงสร้างและรายละเอียดโครงการ
└── Warehouse_Admission_Analytic/         # โฟลเดอร์ซอร์สโค้ดหลักของระบบ (Build Context)
    ├── app/                              # Next.js / Vinext App Router (Frontend & Server API)
    │   ├── page.tsx                      # หน้าแรก (Overview แดชบอร์ดภาพรวม)
    │   ├── layout.tsx                    # โครงสร้าง Layout หลักและ Sidebar Navigation
    │   ├── sidebar-navigation.tsx        # เมนูนำทางด้านข้าง
    │   ├── overview-view.tsx             # คอมโพเนนต์แสดงผลหน้า Overview
    │   ├── dashboard/                    # หน้า Executive & Analytics Dashboard (/dashboard)
    │   ├── rounds/                       # หน้าวิเคราะห์แยกตามรอบ TCAS 1–4 (/rounds)
    │   ├── majors/                       # หน้าวิเคราะห์แยกตามสาขาวิชาและหลักสูตร (/majors)
    │   ├── insights/                     # หน้าศูนย์ช่วยตัดสินใจเชิงกลยุทธ์ (/insights)
    │   ├── ai-analysis/                  # หน้าระบบวิเคราะห์ข้อมูลด้วย AI Gemini (/ai-analysis)
    │   ├── api/
    │   │   └── ai-analysis/route.ts      # API Endpoint สำหรับสั่งสร้าง/ดึงผลวิเคราะห์ AI
    │   └── data/                         # Data Access Layer & Repositories
    │       ├── db/neon-client.ts         # ตัวเชื่อมต่อฐานข้อมูล PostgreSQL / Neon (รองรับทั้ง Cloud & Docker)
    │       ├── live-neon-dashboard-adapter.ts
    │       ├── load-dashboard-snapshot.ts
    │       └── repositories/             # SQL Queries แยกตามโดเมน (Overview, Rounds, Majors, Insights)
    ├── docker/                           # ไฟล์ SQL สำหรับระบบฐานข้อมูล
    │   ├── schema.sql                    # ไฟล์โครงสร้างฐานข้อมูล (Schema-only DDL)
    │   └── init.sql                      # สคริปต์สร้าง Schema + ข้อมูล 13,799 รายการ (ใช้เฉพาะกรณีต้องการโหลดข้อมูลเริ่มต้น)
    ├── etl/                              # โมดูล ETL สำหรับแปลงและทำความสะอาดข้อมูล
    │   ├── admissions.mjs                # แปลงคอลัมน์ไทย/อังกฤษ และทำ HMAC-SHA256 Tokenization (PII-Safe)
    │   ├── local-warehouse.mjs           # จัดการโหลดข้อมูลเข้าตาราง Dimension และ Fact
    │   └── cli.mjs                       # CLI สำหรับรันกระบวนการ ETL
    ├── outputs/                          # ผลลัพธ์จากการทำ ETL และไฟล์ SQL ต้นฉบับ
    │   ├── etl/                          # สคริปต์โหลดข้อมูลเข้าฐานข้อมูล
    │   ├── processed/                    # ไฟล์ Staging ที่ผ่านการตัดข้อมูลส่วนบุคคล (PII-Safe) แล้ว
    │   └── sql/                          # ไฟล์นิยาม SQL Schema และ Data Marts
    ├── scripts/                          # สคริปต์ Migration และตรวจสอบความถูกต้องของข้อมูล
    │   ├── migrate-ai-reports.mjs        # Additive Migration สร้างตารางสำหรับเก็บผลวิเคราะห์ AI
    │   └── audit-*.mjs / check-*.mjs     # สคริปต์ตรวจสอบความถูกต้องของตัวเลขและสถานะสิทธิ์
    ├── tests/                            # ชุดทดสอบอัตโนมัติ (Unit & Integration Tests)
    ├── docs/                             # เอกสารประกอบสถาปัตยกรรมและ Data Governance
    │   └── sql/ai-analysis-reports.sql   # SQL DDL สำหรับตาราง AI Analysis Reports & Jobs
    ├── public/                           # ไฟล์ Static Assets (โลโก้และไอคอน)
    ├── Dockerfile                        # Multi-stage Production Dockerfile (deps -> builder -> runner)
    ├── .dockerignore                     # รายการไฟล์ที่ยกเว้นไม่นำเข้า Docker Build Context
    ├── .env.example                      # ตัวอย่างไฟล์ Runtime Environment Variables
    ├── next.config.ts                    # ตั้งค่า Next.js (เปิดใช้งาน standalone output)
    ├── vite.config.ts                    # ตั้งค่า Vite + Vinext RSC/SSR
    ├── schema.sql                        # ไฟล์โครงสร้างฐานข้อมูล (PostgreSQL Schema Dump)
    └── package.json                      # รายการ Dependencies (Node >=22.13.0) และ npm scripts
```

---

## 🐳 การ Deploy ระบบสำหรับ Production ด้วย Docker (แยกตาม Service โดยไม่ใช้ Docker Compose)

โปรเจกต์นี้เป็น Full-Stack Web Application เดียว (Next.js App Router รันบน `vinext` + Node.js 22) ที่รวมทั้งส่วนแสดงผล (SSR/RSC) และ API Routes (`/api/ai-analysis`) ไว้ในอิมเมจเดียว โดยใช้ Multi-Stage [`Dockerfile`](./Dockerfile) (`deps` → `builder` → `runner` แบบ Standalone Output) และเชื่อมต่อกับบริการฐานข้อมูล PostgreSQL ผ่าน Docker Network หรือ Managed PostgreSQL (เช่น Neon)

### 1. การตั้งค่า Environment Variables ก่อนรัน (`Runtime Variables`)

> **ข้อสำคัญด้านความปลอดภัย:** ห้ามส่ง Secrets (`DATABASE_URL`, `GEMINI_API_KEY`, `ADMISSIONS_STUDENT_HASH_SALT`) ผ่าน `--build-arg` ตอนสั่ง `docker build` และไฟล์ `.env*` ถูกบล็อกไว้ใน [`.dockerignore`](./.dockerignore) เพื่อไม่ให้หลุดเข้าไปใน Docker Image

คัดลอกไฟล์ตัวอย่าง [`.env.example`](./.env.example) ไปเป็น `.env` แล้วกำหนดค่าสำหรับ Production:

```bash
cp .env.example .env
```

| ตัวแปร (Variable) | ประเภท | จำเป็น | คำอธิบาย |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | Build & Runtime | ใช่ | กำหนดเป็น `production` |
| `PORT` | Runtime | ใช่ | พอร์ตที่แอปพลิเคชันรับการเชื่อมต่อ (ค่าเริ่มต้น `3000`) |
| `HOST` / `HOSTNAME` | Runtime | ใช่ | กำหนดเป็น `0.0.0.0` เพื่อให้รับการเชื่อมต่อจากภายนอก Container ได้ |
| `DATABASE_URL` | Runtime Secret | **จำเป็น** | PostgreSQL Connection String เช่น `postgresql://postgres:password@admissions-db:5432/admissions_dw?sslmode=disable` หรือ Neon URL |
| `GEMINI_API_KEY` | Runtime Secret | **จำเป็น** (สำหรับ AI) | API Key ของ Google Gemini สำหรับสร้างรายงานวิเคราะห์ในหน้า `/ai-analysis` |
| `GEMINI_MODEL` | Runtime | ทางเลือก | ชื่อโมเดล Gemini (ค่าเริ่มต้น `gemini-3.1-flash-lite`) |
| `ADMISSIONS_STUDENT_HASH_SALT` | Runtime Secret (ETL) | เฉพาะตอนรัน ETL | Salt อย่างน้อย 16 ตัวอักษรสำหรับทำ HMAC-SHA256 Tokenization รหัสผู้สมัคร |

---

### 2. การสร้าง Docker Network และ Volume

หากรัน PostgreSQL เป็น Container แยกบนโฮสต์เดียวกัน ให้สร้าง Bridge Network และ Named Volume สำหรับเก็บข้อมูลฐานข้อมูลให้คงอยู่ถาวร (Persistent Storage):

```bash
# สร้างเครือข่ายสำหรับเชื่อมต่อระหว่าง Web Service และ Database Service
docker network create admissions-net

# สร้าง Volume สำหรับเก็บข้อมูล PostgreSQL อย่างถาวร
docker volume create admissions_pgdata
```

---

### 3. การรัน Database Service (PostgreSQL 16)

*(ข้ามขั้นตอนนี้ได้หากใช้ฐานข้อมูลภายนอก เช่น Neon Serverless PostgreSQL)*

```bash
docker run -d \
  --name admissions-db \
  --network admissions-net \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=admissions_dw \
  -p 5432:5432 \
  -v admissions_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

---

### 4. การ Build Docker Image ของแอปพลิเคชัน (`Dockerfile`)

ใช้ไดเรกทอรีรากของโปรเจกต์ (`Warehouse_Admission_Analytic`) เป็น Build Context:

```bash
cd Warehouse_Admission_Analytic

docker build -t admission-eng:prod -f Dockerfile .
```

**รายละเอียด Multi-Stage Build ใน [`Dockerfile`](./Dockerfile):**
1. **`deps` (`node:22-alpine`):** ติดตั้ง Dependencies ตาม `package-lock.json` ด้วย `npm ci`
2. **`builder` (`node:22-alpine`):** รัน `npm run build` สร้าง Standalone Output (`dist/standalone`) พร้อมรวม Static/Public Assets (`public/`, `dist/client/`) และคัดแยกเฉพาะ Runtime Modules ที่จำเป็น (`vinext`, `pg`, `@neondatabase/serverless`)
3. **`runner` (`node:22-alpine`):** รันด้วยสิทธิ์ Non-root User (`node`), มีเฉพาะไฟล์สำหรับรันจริง (`server.js`, `dist/`, `public/`, `node_modules/` เฉพาะ runtime) และสคริปต์ Migration โดยไม่รันคำสั่ง Reset หรือ Seed ข้อมูลอัตโนมัติเมื่อเปิด Container

---

### 5. การรัน Database Schema & Migrations

Container ของเว็บแอปพลิเคชันจะ **ไม่** ทำการ Reset หรือ Seed ข้อมูลอัตโนมัติใน `CMD` เพื่อความปลอดภัยใน Production ผู้ดูแลระบบสามารถรัน Schema หรือ Additive Migration แยกต่างหากได้ดังนี้:

1. **การสร้างโครงสร้างตารางและ Views ทั้งหมด (`schema.sql`) สำหรับฐานข้อมูลใหม่:**
   ```bash
   docker exec -i admissions-db psql -U postgres -d admissions_dw < schema.sql
   ```
   *(หมายเหตุ: สำหรับสภาพแวดล้อมทดสอบที่ต้องการโหลดชุดข้อมูลตั้งต้น 13,799 รายการ สามารถรัน `docker exec -i admissions-db psql -U postgres -d admissions_dw < docker/init.sql` ได้โดยตรง)*

2. **การรัน Additive Migration สำหรับตาราง AI Analysis (`ai_analysis_reports` & `ai_analysis_jobs`):**
   สามารถใช้ Image `admission-eng:prod` รันสคริปต์ Migration แบบ One-off Container ก่อนเริ่มระบบได้ทันที (ไม่กระทบข้อมูลเดิมในคลังข้อมูล):
   ```bash
   docker run --rm \
     --network admissions-net \
     --env-file .env \
     admission-eng:prod \
     node scripts/migrate-ai-reports.mjs
   ```

---

### 6. การรัน Web Application Service

```bash
docker run -d \
  --name admissions-web \
  --network admissions-net \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  admission-eng:prod
```

*(หากเชื่อมต่อกับ PostgreSQL ใน `admissions-net` ให้ตรวจสอบว่าใน `.env` ตั้งค่า `DATABASE_URL=postgresql://postgres:postgres@admissions-db:5432/admissions_dw?sslmode=disable` หรือส่งผ่าน `-e DATABASE_URL=...`)*

**การตรวจสอบสถานะและ Log:**
```bash
# ตรวจสอบสถานะ Container
docker ps

# ดู Log ของ Web Service
docker logs -f admissions-web

# ทดสอบเรียกหน้าเว็บ
curl -I http://localhost:3000
```

---

## 🏛️ สถาปัตยกรรมคลังข้อมูล (`admissions_dw` Star Schema)

รายละเอียดโครงสร้างทั้งหมดอยู่ในไฟล์ [`schema.sql`](./schema.sql):

| ประเภท | ชื่อตาราง / วัตถุ | รายละเอียด |
| :--- | :--- | :--- |
| **Fact Table** | `fact_admission` | ตาราง Fact กลางเก็บข้อมูลระดับตัวเลือกการสมัคร (13,799 แถว) พร้อมคะแนน `score`, ลำดับ `priority`, และ `source_file` |
| **Dimension Tables** | `dim_student` | รหัสแทนตัวผู้สมัครแบบนามแฝง (`student_token` HMAC-SHA256) จำนวน 10,158 คน |
| | `dim_year` | ปีการศึกษา (`2567`, `2568`, `2569`) |
| | `dim_tcas_round` | รอบการรับสมัคร TCAS (`TCAS1` – `TCAS4`) |
| | `dim_faculty` | ข้อมูลคณะ (`คณะวิศวกรรมศาสตร์ กำแพงแสน`) |
| | `dim_major` | ข้อมูลสาขาวิชา (10 สาขาวิชา) และประเภทหลักสูตร (`major_type`: ปกติ / พิเศษ) |
| | `dim_tcas_status` | สถานะผลการคัดเลือกและการยืนยันสิทธิ์/สละสิทธิ์ |
| **AI Tables** | `ai_analysis_reports` | จัดเก็บรายงานวิเคราะห์เชิงลึก 7 หัวข้อที่สร้างโดย Google Gemini พร้อม Snapshot |
| | `ai_analysis_jobs` | ตารางจัดการ Lock ป้องกันการสั่งประมวลผล AI ซ้ำซ้อน |
| **Base Views (`vw_*`)** | 5 Views | `vw_admission_year_overview`, `vw_admission_round_overview`, `vw_admission_round_status_distribution`, `vw_admission_year_status_distribution`, `vw_admission_major_status_distribution` |
| **Analytical Marts (`mart_*`)** | 11 Views | `mart_tcas_year_summary`, `mart_tcas_round_summary`, `mart_major_round_conversion`, `mart_admissions_executive_summary`, `mart_major_conversion`, `mart_round_efficiency`, `mart_status_friction`, `mart_admissions_year_change`, `mart_major_year_change`, `mart_major_opportunity`, `mart_program_type_mix` |

---

## 🛠️ คำสั่งสำหรับนักพัฒนา (Developer Scripts)

| คำสั่ง | คำอธิบาย |
| :--- | :--- |
| `npm run dev` | รันเซิร์ฟเวอร์สำหรับพัฒนา (Port 3000) |
| `npm run build` | Build โปรเจกต์พร้อมสร้าง Standalone Output (`dist/standalone`) |
| `npm run start` | รัน Production Server จากโฟลเดอร์ `dist/` |
| `npm run ai:migrate` | รัน Additive Migration สร้างตาราง AI Reports |
| `npm run docker:build` | สร้าง Production Docker Image (`admission-eng:prod`) |
| `npm test` | รันชุดทดสอบอัตโนมัติทั้งหมดในโฟลเดอร์ `tests/` |
| `npm run typecheck` | ตรวจสอบความถูกต้องของชนิดข้อมูล TypeScript |
