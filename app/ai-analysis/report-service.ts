import { randomUUID } from "node:crypto";
import { prepareInput } from "./analysis";
import { readWarehouse, reportDatabase } from "./data";
import { AnalysisError, generateWithGemini } from "./gemini";
import { PROMPT_VERSION, type AnalysisState, type SavedReport, type Scope } from "./report-types";
import type { QueryRow } from "../data/db/neon-client";

function saved(row: QueryRow): SavedReport {
  return { id: String(row.id), createdAt: new Date(String(row.created_at)).toISOString(), model: String(row.model),
    promptVersion: String(row.prompt_version), input: row.input_snapshot as SavedReport["input"], content: row.content as SavedReport["content"] };
}

async function storageReady() {
  const db = await reportDatabase();
  const { rows } = await db.query("select to_regclass('admissions_dw.ai_analysis_reports') as reports, to_regclass('admissions_dw.ai_analysis_jobs') as jobs");
  if (!rows[0]?.reports || !rows[0]?.jobs) throw new AnalysisError("ยังไม่ได้เตรียมตารางรายงาน กรุณารัน npm run ai:migrate", 503);
  return db;
}

export async function getAnalysisState(requested?: Scope, reportId?: string): Promise<AnalysisState> {
  const warehouse = await readWarehouse();
  const latestYear = warehouse.availableYears.at(-1)!;
  const scope = requested ?? { startYear: latestYear, endYear: latestYear };
  const input = prepareInput(warehouse.facts, warehouse.dataLoadedAt, scope);
  const db = await storageReady();
  const [{rows: reports}, {rows: jobs}] = await Promise.all([
    db.query(`select id, created_at, model from admissions_dw.ai_analysis_reports
      where start_year = $1 and end_year = $2 order by created_at desc, id desc limit 30`, [scope.startYear, scope.endYear]),
    db.query(`select owner from admissions_dw.ai_analysis_jobs where start_year = $1 and end_year = $2 and expires_at > now()`, [scope.startYear, scope.endYear]),
  ]);
  let report: SavedReport | null = null;
  const id = reportId || reports[0]?.id;
  if (id) {
    const {rows} = await db.query(`select * from admissions_dw.ai_analysis_reports where id = $1 and start_year = $2 and end_year = $3`, [id, scope.startYear, scope.endYear]);
    if (rows[0]) report = saved(rows[0]);
    else if (reportId) throw new AnalysisError("ไม่พบรายงานในช่วงปีที่เลือก", 404);
  }
  return { availableYears: warehouse.availableYears, scope, currentFingerprint: input.fingerprint,
    currentDataLoadedAt: warehouse.dataLoadedAt, report, history: reports.map(r => ({ id: String(r.id), createdAt: new Date(String(r.created_at)).toISOString(), model: String(r.model) })),
    generating: jobs.length > 0, configured: Boolean(process.env.GEMINI_API_KEY?.trim()) };
}

export async function generateReport(scope: Scope): Promise<SavedReport> {
  if (!process.env.GEMINI_API_KEY?.trim()) throw new AnalysisError("ยังไม่ได้ตั้งค่า GEMINI_API_KEY ฝั่งเซิร์ฟเวอร์", 503);
  const warehouse = await readWarehouse();
  const input = prepareInput(warehouse.facts, warehouse.dataLoadedAt, scope);
  const db = await storageReady();
  const owner = randomUUID();
  const { rows: lease } = await db.query(`
    insert into admissions_dw.ai_analysis_jobs(start_year, end_year, owner, expires_at)
    values ($1, $2, $3, now() + interval '4 minutes')
    on conflict (start_year, end_year) do update set owner = excluded.owner, expires_at = excluded.expires_at
    where ai_analysis_jobs.expires_at <= now() returning owner
  `, [scope.startYear, scope.endYear, owner]);
  if (!lease.length) throw new AnalysisError("กำลังสร้างรายงานช่วงปีนี้อยู่ กรุณารอ", 409);
  try {
    const { content, model } = await generateWithGemini(input);
    const id = randomUUID();
    // Saving and releasing the lease is atomic; an expired/replaced owner cannot overwrite a newer job.
    const { rows } = await db.query(`
      with owned as (
        delete from admissions_dw.ai_analysis_jobs
        where start_year = $1 and end_year = $2 and owner = $3 and expires_at > now() returning owner
      )
      insert into admissions_dw.ai_analysis_reports(id, start_year, end_year, model, prompt_version, data_fingerprint, input_snapshot, content)
      select $4, $1, $2, $5, $6, $7, $8::jsonb, $9::jsonb from owned returning *
    `, [scope.startYear, scope.endYear, owner, id, model, PROMPT_VERSION, input.fingerprint, JSON.stringify(input), JSON.stringify(content)]);
    if (!rows[0]) throw new AnalysisError("งานสร้างหมดเวลา กรุณาลองใหม่ รายงานเดิมยังอยู่", 409);
    return saved(rows[0]);
  } finally {
    await db.query("delete from admissions_dw.ai_analysis_jobs where start_year = $1 and end_year = $2 and owner = $3", [scope.startYear, scope.endYear, owner]);
  }
}
