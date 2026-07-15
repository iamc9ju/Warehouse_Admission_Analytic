const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const reportDir = path.join(rootDir, "outputs", "reports");
const reportPath = path.join(reportDir, "admissions_round3_analytics_report.md");

const queries = [
  {
    title: "Year Overview",
    description: "ภาพรวมจำนวนตัวเลือกสมัคร ผู้สมัครไม่ซ้ำ และผู้ยืนยันสิทธิ์รายปี",
    sql: `
      SELECT
        academic_year,
        application_choices,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate,
        avg_score,
        min_score,
        max_score,
        avg_priority
      FROM admissions_dw.vw_round3_year_overview
      ORDER BY academic_year
    `,
  },
  {
    title: "Year-Over-Year Comparison",
    description: "เปรียบเทียบการเปลี่ยนแปลงระหว่างปี 2568 และ 2569",
    sql: `
      SELECT
        academic_year,
        application_choices,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate,
        application_choices_change,
        unique_applicants_change,
        confirmed_unique_applicants_change
      FROM admissions_dw.vw_round3_year_comparison
      ORDER BY academic_year
    `,
  },
  {
    title: "Top Majors by Unique Applicants",
    description: "สาขาที่มีจำนวนผู้สมัครไม่ซ้ำสูงสุด แยกตามปี",
    sql: `
      SELECT
        academic_year,
        major_id,
        major_name,
        major_type,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate,
        avg_score
      FROM admissions_dw.vw_round3_major_performance
      ORDER BY academic_year, unique_applicants DESC, major_id
      LIMIT 20
    `,
  },
  {
    title: "Top Majors by Confirmed Applicants",
    description: "สาขาที่มีจำนวนผู้ยืนยันสิทธิ์สูงสุด แยกตามปี",
    sql: `
      SELECT
        academic_year,
        major_id,
        major_name,
        major_type,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate,
        avg_score
      FROM admissions_dw.vw_round3_major_performance
      ORDER BY academic_year, confirmed_unique_applicants DESC, unique_applicants DESC, major_id
      LIMIT 20
    `,
  },
  {
    title: "Major Year-Over-Year Movement",
    description: "การเปลี่ยนแปลงของผู้สมัครและผู้ยืนยันสิทธิ์ในแต่ละสาขาจากปี 2568 เป็น 2569",
    sql: `
      WITH major_metrics AS (
        SELECT
          academic_year,
          major_id,
          major_name,
          major_type,
          unique_applicants,
          confirmed_unique_applicants,
          confirmed_unique_rate
        FROM admissions_dw.vw_round3_major_performance
      )
      SELECT
        current_year.major_id,
        current_year.major_name,
        current_year.major_type,
        previous_year.unique_applicants AS previous_unique_applicants,
        current_year.unique_applicants AS current_unique_applicants,
        current_year.unique_applicants - previous_year.unique_applicants AS unique_applicants_change,
        previous_year.confirmed_unique_applicants AS previous_confirmed_unique_applicants,
        current_year.confirmed_unique_applicants AS current_confirmed_unique_applicants,
        current_year.confirmed_unique_applicants - previous_year.confirmed_unique_applicants AS confirmed_unique_applicants_change,
        previous_year.confirmed_unique_rate AS previous_confirmed_unique_rate,
        current_year.confirmed_unique_rate AS current_confirmed_unique_rate,
        current_year.confirmed_unique_rate - previous_year.confirmed_unique_rate AS confirmed_unique_rate_change
      FROM major_metrics current_year
      JOIN major_metrics previous_year
        ON current_year.major_id = previous_year.major_id
       AND current_year.major_name = previous_year.major_name
       AND current_year.major_type = previous_year.major_type
       AND current_year.academic_year = previous_year.academic_year + 1
      ORDER BY unique_applicants_change DESC, current_year.major_id
    `,
  },
  {
    title: "Status Distribution",
    description: "สัดส่วนสถานะ TCAS ของแต่ละปี",
    sql: `
      SELECT
        academic_year,
        tcas_status,
        applicant_status,
        application_choices,
        unique_applicants,
        ROUND(
          application_choices::NUMERIC
          / NULLIF(SUM(application_choices) OVER (PARTITION BY academic_year), 0),
          4
        ) AS application_choice_share,
        avg_score
      FROM admissions_dw.vw_round3_status_summary
      ORDER BY academic_year, application_choices DESC, tcas_status
    `,
  },
  {
    title: "Performance by Major Type",
    description: "เปรียบเทียบภาคปกติและภาคพิเศษ",
    sql: `
      SELECT
        academic_year,
        major_type,
        SUM(application_choices) AS application_choices,
        SUM(unique_applicants) AS unique_applicants,
        SUM(confirmed_unique_applicants) AS confirmed_unique_applicants,
        ROUND(
          SUM(confirmed_unique_applicants)::NUMERIC
          / NULLIF(SUM(unique_applicants), 0),
          4
        ) AS confirmed_unique_rate,
        ROUND(AVG(avg_score), 4) AS avg_major_score
      FROM admissions_dw.vw_round3_major_performance
      GROUP BY academic_year, major_type
      ORDER BY academic_year, unique_applicants DESC
    `,
  },
  {
    title: "Highest Average Score by Major",
    description: "สาขาที่มีคะแนนเฉลี่ยสูงสุด",
    sql: `
      SELECT
        academic_year,
        major_id,
        major_name,
        major_type,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate,
        avg_score,
        min_score,
        max_score
      FROM admissions_dw.vw_round3_major_performance
      ORDER BY academic_year, avg_score DESC, unique_applicants DESC
      LIMIT 20
    `,
  },
  {
    title: "Data Quality Summary",
    description: "ตรวจคุณภาพข้อมูลและยืนยันว่า output ไม่มี PII columns",
    sql: `
      SELECT
        academic_year,
        source_rows,
        unique_applicants,
        duplicate_applicant_rows,
        missing_score_rows,
        missing_priority_rows,
        missing_major_rows,
        pii_columns_removed
      FROM admissions_dw.admission_round_data_quality
      ORDER BY academic_year
    `,
  },
];

function formatValue(value, header = "") {
  if (value === null || value === undefined) {
    return "";
  }

  if (header === "academic_year" || header === "previous_academic_year" || header === "current_academic_year") {
    return String(value);
  }

  if (header.endsWith("_rate") || header.endsWith("_share")) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return `${(parsed * 100).toFixed(2)}%`;
    }
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(4);
  }

  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed.toLocaleString("en-US");
    }
    return parsed.toFixed(4);
  }

  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function markdownTable(rows) {
  if (rows.length === 0) {
    return "_No rows returned._";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];

  for (const row of rows) {
    lines.push(`| ${headers.map((header) => formatValue(row[header], header)).join(" | ")} |`);
  }

  return lines.join("\n");
}

function buildExecutiveSummary(resultsByTitle) {
  const overview = resultsByTitle.get("Year Overview") ?? [];
  const comparison = resultsByTitle.get("Year-Over-Year Comparison") ?? [];
  const latest = overview.at(-1);
  const latestComparison = comparison.at(-1);

  const lines = [
    "## Executive Summary",
    "",
    "- ข้อมูลชุดนี้เป็น aggregate TCAS รอบ 3 ปี 2568 และ 2569 เท่านั้น",
    "- `application_choices` คือจำนวนตัวเลือกสาขา ไม่ใช่จำนวนคน เพราะผู้สมัครหนึ่งคนเลือกได้หลายสาขา",
  ];

  if (latest && latestComparison) {
    lines.push(
      `- ปี ${latest.academic_year} มีผู้สมัครไม่ซ้ำ ${formatValue(
        latest.unique_applicants
      )} คน และยืนยันสิทธิ์ ${formatValue(latest.confirmed_unique_applicants)} คน`,
      `- เมื่อเทียบกับปีก่อน ผู้สมัครไม่ซ้ำเปลี่ยนแปลง ${formatValue(
        latestComparison.unique_applicants_change
      )} คน และผู้ยืนยันสิทธิ์เปลี่ยนแปลง ${formatValue(
        latestComparison.confirmed_unique_applicants_change
      )} คน`,
      `- อัตรายืนยันสิทธิ์ล่าสุดอยู่ที่ ${formatValue(latest.confirmed_unique_rate, "confirmed_unique_rate")}`
    );
  }

  lines.push("");
  return lines.join("\n");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  await client.connect();

  try {
    const resultsByTitle = new Map();
    for (const query of queries) {
      const result = await client.query(query.sql);
      resultsByTitle.set(query.title, result.rows);
    }

    const parts = [
      "# Admissions Round 3 Analytics Report",
      "",
      "Generated from Neon PostgreSQL schema `admissions_dw`.",
      "",
      buildExecutiveSummary(resultsByTitle),
    ];

    for (const query of queries) {
      parts.push(`## ${query.title}`, "", query.description, "", markdownTable(resultsByTitle.get(query.title)), "");
    }

    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportPath, `${parts.join("\n")}\n`, "utf8");
    console.log(reportPath);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
