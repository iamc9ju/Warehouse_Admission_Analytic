import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
try {
  const sql = await readFile(new URL("../docs/sql/ai-analysis-reports.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("AI report tables ready; admissions data unchanged.");
} catch (error) {
  console.error("AI report migration failed:", error.code ?? error.name);
  process.exitCode = 1;
} finally { await pool.end(); }
