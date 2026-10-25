import { NextResponse } from "next/server";
import { AnalysisError } from "../../ai-analysis/gemini";
import { generateReport, getAnalysisState } from "../../ai-analysis/report-service";
import type { Scope } from "../../ai-analysis/report-types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

function scopeOf(start: unknown, end: unknown): Scope {
  if (typeof start !== "number" || typeof end !== "number" || !Number.isInteger(start) || !Number.isInteger(end)
    || start < 2500 || end > 2700 || start > end) throw new AnalysisError("กรุณาเลือกช่วงปีให้ถูกต้อง", 400);
  return { startYear: start, endYear: end };
}
function failure(error: unknown) {
  if (error instanceof AnalysisError || (error && typeof error === "object" && (error as any).name === "AnalysisError")) {
    const err = error as AnalysisError;
    return NextResponse.json({ error: err.message }, { status: err.status || 500, headers });
  }
  // Avoid leaking connection strings, API keys, or database diagnostic details.
  return NextResponse.json({ error: "ไม่สามารถอ่านหรือบันทึกรายงานได้ กรุณาตรวจการเชื่อมต่อฐานข้อมูลและช่วงปีที่เลือก" }, { status: 503, headers });
}
export async function GET(req: Request) {
  try {
    const query = new URL(req.url).searchParams;
    const scope = query.has("startYear") || query.has("endYear") ? scopeOf(Number(query.get("startYear")), Number(query.get("endYear"))) : undefined;
    const id = query.get("reportId") || undefined;
    if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new AnalysisError("รหัสรายงานไม่ถูกต้อง", 400);
    return NextResponse.json(await getAnalysisState(scope, id), { headers });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) throw new AnalysisError("ไม่อนุญาตคำขอจากเว็บไซต์อื่น", 403);
    let body;
    try { body = await req.json(); } catch { throw new AnalysisError("คำขอไม่ถูกต้อง", 400); }
    const report = await generateReport(scopeOf(body?.startYear, body?.endYear));
    return NextResponse.json({ report }, { status: 201, headers });
  } catch (error) { return failure(error); }
}
