import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dockerDir = path.join(rootDir, "docker");
if (!fs.existsSync(dockerDir)) fs.mkdirSync(dockerDir, { recursive: true });

const outputFile = path.join(dockerDir, "init.sql");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "object") return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function dumpTable(tableName) {
  console.log(`Dumping data for admissions_dw.${tableName}...`);
  const rows = await sql.query(`SELECT * FROM admissions_dw.${tableName}`, []);
  const list = Array.isArray(rows) ? rows : rows.rows;
  if (!list.length) return "";

  const cols = Object.keys(list[0]);
  const colNames = cols.map(c => `"${c}"`).join(", ");

  let out = `\n-- Data for admissions_dw.${tableName}\n`;
  const chunkSize = 200;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const values = chunk.map(r => `(${cols.map(c => escapeSql(r[c])).join(", ")})`).join(",\n  ");
    out += `INSERT INTO admissions_dw.${tableName} (${colNames})\nVALUES\n  ${values}\nON CONFLICT DO NOTHING;\n`;
  }
  return out;
}

async function run() {
  console.log("Starting database export for Docker...");

  let ddl = `-- ====================================================================
-- Automated PostgreSQL Schema & Data Initialization for Docker
-- Generated for admissions_dw
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS admissions_dw;
SET search_path TO admissions_dw, public;

-- Tables DDL
CREATE TABLE IF NOT EXISTS admissions_dw.dim_year (
  year_key INTEGER PRIMARY KEY,
  academic_year INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_faculty (
  faculty_key INTEGER PRIMARY KEY,
  fac_id TEXT NOT NULL UNIQUE,
  fac_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_round (
  round_key INTEGER PRIMARY KEY,
  tcas_round_code TEXT NOT NULL UNIQUE,
  tcas_round_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_major (
  major_key INTEGER PRIMARY KEY,
  major_id TEXT NOT NULL,
  major_name TEXT NOT NULL,
  major_type TEXT NOT NULL,
  UNIQUE (major_id, major_name, major_type)
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_status (
  status_key INTEGER PRIMARY KEY,
  tcas_status TEXT NOT NULL,
  applicant_status INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS status_identity ON admissions_dw.dim_tcas_status(tcas_status, COALESCE(applicant_status, 2147483648));

CREATE TABLE IF NOT EXISTS admissions_dw.dim_student (
  student_key INTEGER PRIMARY KEY,
  student_token TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission (
  admission_key INTEGER PRIMARY KEY,
  application_token TEXT NOT NULL UNIQUE,
  student_key INTEGER NOT NULL REFERENCES admissions_dw.dim_student(student_key),
  year_key INTEGER NOT NULL REFERENCES admissions_dw.dim_year(year_key),
  round_key INTEGER NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
  faculty_key INTEGER NOT NULL REFERENCES admissions_dw.dim_faculty(faculty_key),
  major_key INTEGER NOT NULL REFERENCES admissions_dw.dim_major(major_key),
  status_key INTEGER NOT NULL REFERENCES admissions_dw.dim_tcas_status(status_key),
  source_file TEXT NOT NULL,
  source_row_number INTEGER NOT NULL CHECK (source_row_number >= 2),
  priority NUMERIC,
  score NUMERIC NOT NULL,
  application_count INTEGER NOT NULL DEFAULT 1 CHECK (application_count = 1),
  loaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS fact_admission_year_idx ON admissions_dw.fact_admission(year_key);
CREATE INDEX IF NOT EXISTS fact_admission_major_idx ON admissions_dw.fact_admission(major_key);
CREATE INDEX IF NOT EXISTS fact_admission_round_idx ON admissions_dw.fact_admission(round_key);
CREATE INDEX IF NOT EXISTS fact_admission_status_idx ON admissions_dw.fact_admission(status_key);

CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_reports (
  id UUID PRIMARY KEY,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL CHECK (end_year >= start_year),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  data_fingerprint TEXT NOT NULL,
  input_snapshot JSONB NOT NULL,
  content JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_analysis_reports_scope_created
  ON admissions_dw.ai_analysis_reports (start_year, end_year, created_at DESC);

CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_jobs (
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  owner UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (start_year, end_year)
);
`;

  // Read governance marts views
  const governanceFile = path.join(rootDir, "outputs", "sql", "warehouse_governance_marts.sql");
  const admissionsFile = path.join(rootDir, "outputs", "sql", "admissions_all_rounds_warehouse.sql");

  // Dump data
  const tableOrder = [
    "dim_year",
    "dim_faculty",
    "dim_tcas_round",
    "dim_major",
    "dim_tcas_status",
    "dim_student",
    "fact_admission",
    "ai_analysis_reports"
  ];

  for (const t of tableOrder) {
    ddl += await dumpTable(t);
  }

  // Append views
  ddl += `\n-- ====================================================================\n-- Views and Analytical Marts\n-- ====================================================================\n`;
  if (fs.existsSync(admissionsFile)) {
    const content = fs.readFileSync(admissionsFile, "utf8");
    // Extract view definitions
    const viewMatches = content.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW[\s\S]*?;/gi);
    if (viewMatches) {
      for (const v of viewMatches) {
        ddl += `\n${v}\n`;
      }
    }
  }

  if (fs.existsSync(governanceFile)) {
    const govContent = fs.readFileSync(governanceFile, "utf8");
    const govViewMatches = govContent.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW[\s\S]*?;/gi);
    if (govViewMatches) {
      for (const v of govViewMatches) {
        ddl += `\n${v}\n`;
      }
    }
  }

  fs.writeFileSync(outputFile, ddl, "utf8");
  const stats = fs.statSync(outputFile);
  console.log(`Success! Created ${outputFile} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch(err => {
  console.error("Export error:", err);
  process.exit(1);
});
