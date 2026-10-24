import { connectNeon, type QueryRow } from "../../data/db/neon-client";

export type QueryFact = {
  title: string;
  data: unknown;
};

// Sanitizer for safe read-only SQL
export function isSafeReadOnlyQuery(sql: string): boolean {
  const clean = sql.trim().toLowerCase();
  if (!clean.startsWith("select") && !clean.startsWith("with")) return false;
  const bannedKeywords = [
    "insert", "update", "delete", "drop", "alter", "create", 
    "truncate", "grant", "revoke", "execute", "copy", "lock",
    "pg_sleep", "pg_terminate", "into", "set"
  ];
  for (const word of bannedKeywords) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(clean)) return false;
  }
  return true;
}

export async function fetchExecutiveSummary(year?: number): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = year
    ? `SELECT academic_year, application_choices, unique_applicants, eligible_applicants, confirmed_applicants, confirmed_rate, resigned_applicants, avg_score 
       FROM admissions_dw.mart_admissions_executive_summary 
       WHERE academic_year = $1`
    : `SELECT academic_year, application_choices, unique_applicants, eligible_applicants, confirmed_applicants, confirmed_rate, resigned_applicants, avg_score 
       FROM admissions_dw.mart_admissions_executive_summary 
       ORDER BY academic_year ASC`;
  const res = await client.query(sql, year ? [year] : []);
  return res.rows;
}

export async function fetchRoundEfficiency(year?: number): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = year
    ? `SELECT academic_year, tcas_round_code, tcas_round_name, choices, unique_applicants, eligible_applicants, confirmed_applicants, confirmed_rate, avg_score 
       FROM admissions_dw.mart_round_efficiency 
       WHERE academic_year = $1 
       ORDER BY tcas_round_code ASC`
    : `SELECT academic_year, tcas_round_code, tcas_round_name, choices, unique_applicants, eligible_applicants, confirmed_applicants, confirmed_rate 
       FROM admissions_dw.mart_round_efficiency 
       ORDER BY academic_year DESC, tcas_round_code ASC`;
  const res = await client.query(sql, year ? [year] : []);
  return res.rows;
}

export async function fetchMajorOpportunity(year = 2569, limit = 10): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = `
    SELECT academic_year, major_code, major_name, program_type, applicant_count, eligible_count, confirmed_count, confirmed_rate, demand_rank 
    FROM admissions_dw.mart_major_opportunity 
    WHERE academic_year = $1 
    ORDER BY applicant_count::numeric DESC 
    LIMIT $2
  `;
  const res = await client.query(sql, [year, limit]);
  return res.rows;
}

export async function searchMajorStats(keyword: string): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = `
    SELECT academic_year, major_code, major_name, program_type, applicant_count, eligible_count, confirmed_count, confirmed_rate, avg_score 
    FROM admissions_dw.mart_major_opportunity 
    WHERE major_name ILIKE $1 
    ORDER BY academic_year DESC, program_type ASC
  `;
  const res = await client.query(sql, [`%${keyword}%` as unknown as number]);
  return res.rows;
}

export async function fetchProgramMix(year?: number): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = year
    ? `SELECT academic_year, program_type, applicant_count, confirmed_count, confirmed_rate 
       FROM admissions_dw.mart_program_type_mix 
       WHERE academic_year = $1`
    : `SELECT academic_year, program_type, applicant_count, confirmed_count, confirmed_rate 
       FROM admissions_dw.mart_program_type_mix 
       ORDER BY academic_year DESC, program_type ASC`;
  const res = await client.query(sql, year ? [year] : []);
  return res.rows;
}

export async function fetchStatusFriction(year = 2569): Promise<QueryRow[]> {
  const client = await connectNeon(process.env.DATABASE_URL!);
  const sql = `
    SELECT academic_year, tcas_round_code, status_label, choices, unique_applicants, share_pct 
    FROM admissions_dw.mart_status_friction 
    WHERE academic_year = $1 AND status_label NOT IN ('ยืนยันสิทธิ์')
    ORDER BY unique_applicants::numeric DESC 
    LIMIT 8
  `;
  const res = await client.query(sql, [year]);
  return res.rows;
}
