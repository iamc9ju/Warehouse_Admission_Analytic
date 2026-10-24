import { createHash } from "node:crypto";
import { DEFINITIONS, RULES, RULES_VERSION, type Fact, type ReportInput, type Scope, type Signal } from "./report-types";

const round = (n: number) => Math.round(n * 100) / 100;

export function computeSignals(facts: Fact[], scope: Scope): Signal[] {
  const signals: Signal[] = [];
  const majors = facts.filter(f => f.grain === "major" && f.year >= scope.startYear && f.year <= scope.endYear);
  for (const f of majors.filter(f => f.year >= scope.startYear && f.year <= scope.endYear)) {
    const previous = majors.find(p => p.year === f.year - 1 && p.key === f.key);
    const evidenceIds = previous ? [f.id, previous.id] : [f.id];
    const name = `${f.name} (${f.programType})`;
    if (previous && Math.min(f.applicants, previous.applicants) >= RULES.minApplicants) {
      const applicantChangePct = round((f.applicants - previous.applicants) * 100 / previous.applicants);
      const rateChangePp = f.eligibleRate === null || previous.eligibleRate === null ? undefined : round(f.eligibleRate - previous.eligibleRate);
      if (applicantChangePct <= -RULES.applicantChangePct || (rateChangePp !== undefined && rateChangePp <= -RULES.rateChangePp)) {
        signals.push({ kind: "watch", year: f.year, name, reason: "ผู้สมัครหรืออัตรายืนยันลดลงถึงเกณฑ์เฝ้าติดตาม", evidenceIds, applicantChangePct, rateChangePp });
      }
      if (applicantChangePct >= RULES.applicantChangePct || (rateChangePp !== undefined && rateChangePp >= RULES.rateChangePp)) {
        signals.push({ kind: "positive", year: f.year, name, reason: "ผู้สมัครหรืออัตรายืนยันเพิ่มขึ้นถึงเกณฑ์เชิงบวก (อาจมีสัญญาณด้านอื่นลดลงร่วมด้วย)", evidenceIds, applicantChangePct, rateChangePp });
      }
    }
    const peers = majors.filter(p => p.year === f.year).map(p => p.applicants).sort((a,b) => a-b);
    const median = (peers[Math.floor((peers.length - 1)/2)] + peers[Math.floor(peers.length/2)]) / 2;
    const overall = facts.find(p => p.grain === "year" && p.year === f.year);
    if (overall && f.eligibleRate !== null && overall.eligibleRate !== null && f.applicants >= Math.max(RULES.minApplicants, median) && f.eligibleRate < overall.eligibleRate) {
      signals.push({ kind: "watch", year: f.year, name, reason: "ผู้สมัครอย่างน้อยค่ามัธยฐานของสาขา แต่อัตรายืนยันต่ำกว่าภาพรวมปีเดียวกัน", evidenceIds: [f.id, overall.id] });
    }
  }
  return signals;
}

export function prepareInput(allFacts: Fact[], dataLoadedAt: string, scope: Scope): ReportInput {
  const years = allFacts.filter(f => f.grain === "year").map(f => f.year);
  if (!Number.isInteger(scope.startYear) || !Number.isInteger(scope.endYear) || scope.startYear > scope.endYear || !years.includes(scope.startYear) || !years.includes(scope.endYear)) {
    throw new Error("กรุณาเลือกช่วงปีที่มีข้อมูลและเรียงปีเริ่มต้นก่อนปีสิ้นสุด");
  }
  const facts = allFacts.filter(f => f.year >= scope.startYear && f.year <= scope.endYear)
    .sort((a,b) => a.id.localeCompare(b.id, "en"));
  const signals = computeSignals(facts, scope);
  const fingerprint = createHash("sha256").update(JSON.stringify({scope, facts, definitions: DEFINITIONS, rules: RULES, rulesVersion: RULES_VERSION})).digest("hex");
  return { scope, baselineYear: null, dataLoadedAt, fingerprint, facts, signals, definitions: DEFINITIONS, rules: RULES };
}
