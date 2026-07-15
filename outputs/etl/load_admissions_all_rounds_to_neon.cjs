const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const processedDir = path.join(rootDir, "outputs", "processed");
const schemaPaths = [
  path.join(rootDir, "outputs", "sql", "admissions_round3_warehouse.sql"),
  path.join(rootDir, "outputs", "sql", "admissions_all_rounds_warehouse.sql"),
];

const files = {
  yearOverview: path.join(processedDir, "admissions_all_rounds_2568_2569_year_overview.csv"),
  roundOverview: path.join(processedDir, "admissions_all_rounds_2568_2569_round_overview.csv"),
  byMajor: path.join(processedDir, "admissions_all_rounds_2568_2569_by_major.csv"),
  summary: path.join(processedDir, "admissions_all_rounds_2568_2569_summary.csv"),
  statusSummary: path.join(processedDir, "admissions_all_rounds_2568_2569_status_summary.csv"),
  dataQuality: path.join(processedDir, "admissions_all_rounds_2568_2569_data_quality.csv"),
};

const statusCountColumns = [
  "applicant_rows",
  "selected_rows",
  "excluded_second_processing_rows",
  "selected_in_better_choice_rows",
  "confirmed_elsewhere_rows",
  "confirmed_rows",
  "surrendered_rows",
  "round2_surrendered_rows",
  "rejected_rows",
  "no_action_rows",
  "not_used_rows",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Invalid CSV row ${rowIndex + 2}: expected ${headers.length} columns, received ${values.length}`
      );
    }

    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function integer(value, fallback = null) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }
  return Number.parseInt(value, 10);
}

function numeric(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return Number.parseFloat(value);
}

function statusValues(row) {
  return statusCountColumns.map((column) => integer(row[column], 0));
}

async function upsertRound(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_tcas_round (tcas_round_code, tcas_round_name)
      VALUES ($1, $2)
      ON CONFLICT (tcas_round_code)
      DO UPDATE SET tcas_round_name = EXCLUDED.tcas_round_name
      RETURNING round_key
    `,
    [row.tcas_round_code, row.tcas_round_name]
  );
  return result.rows[0].round_key;
}

async function upsertFaculty(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_faculty (fac_id, fac_name)
      VALUES ($1, $2)
      ON CONFLICT (fac_id)
      DO UPDATE SET fac_name = EXCLUDED.fac_name
      RETURNING faculty_key
    `,
    [row.fac_id, row.fac_name]
  );
  return result.rows[0].faculty_key;
}

async function upsertMajor(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_major (major_id, major_name, major_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (major_id, major_name, major_type)
      DO UPDATE SET major_name = EXCLUDED.major_name
      RETURNING major_key
    `,
    [row.major_id, row.major_name, row.major_type]
  );
  return result.rows[0].major_key;
}

async function upsertStatus(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_tcas_status (tcas_status, applicant_status)
      VALUES ($1, $2)
      ON CONFLICT (tcas_status, applicant_status)
      DO UPDATE SET tcas_status = EXCLUDED.tcas_status
      RETURNING status_key
    `,
    [row.tcas_status, integer(row.applicant_status)]
  );
  return result.rows[0].status_key;
}

async function loadRoundOverview(client, rows) {
  for (const row of rows) {
    const roundKey = await upsertRound(client, row);

    await client.query(
      `
        INSERT INTO admissions_dw.fact_admission_round_overview (
          academic_year, round_key,
          application_choices, unique_applicants, confirmed_unique_applicants,
          unique_majors, source_files, avg_score,
          applicant_rows, selected_rows, excluded_second_processing_rows,
          selected_in_better_choice_rows, confirmed_elsewhere_rows, confirmed_rows,
          surrendered_rows, round2_surrendered_rows, rejected_rows, no_action_rows,
          not_used_rows, loaded_at
        )
        VALUES (
          $1, $2,
          $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17, $18,
          $19, now()
        )
        ON CONFLICT (academic_year, round_key)
        DO UPDATE SET
          application_choices = EXCLUDED.application_choices,
          unique_applicants = EXCLUDED.unique_applicants,
          confirmed_unique_applicants = EXCLUDED.confirmed_unique_applicants,
          unique_majors = EXCLUDED.unique_majors,
          source_files = EXCLUDED.source_files,
          avg_score = EXCLUDED.avg_score,
          applicant_rows = EXCLUDED.applicant_rows,
          selected_rows = EXCLUDED.selected_rows,
          excluded_second_processing_rows = EXCLUDED.excluded_second_processing_rows,
          selected_in_better_choice_rows = EXCLUDED.selected_in_better_choice_rows,
          confirmed_elsewhere_rows = EXCLUDED.confirmed_elsewhere_rows,
          confirmed_rows = EXCLUDED.confirmed_rows,
          surrendered_rows = EXCLUDED.surrendered_rows,
          round2_surrendered_rows = EXCLUDED.round2_surrendered_rows,
          rejected_rows = EXCLUDED.rejected_rows,
          no_action_rows = EXCLUDED.no_action_rows,
          not_used_rows = EXCLUDED.not_used_rows,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        roundKey,
        integer(row.application_choices, 0),
        integer(row.unique_applicants, 0),
        integer(row.confirmed_unique_applicants, 0),
        integer(row.unique_majors, 0),
        integer(row.source_files, 0),
        numeric(row.avg_score),
        ...statusValues(row),
      ]
    );
  }
}

async function loadYearOverview(client, rows) {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO admissions_dw.fact_admission_year_overview (
          academic_year,
          application_choices, unique_applicants, confirmed_unique_applicants,
          unique_majors, tcas_rounds, source_files, avg_score,
          applicant_rows, selected_rows, excluded_second_processing_rows,
          selected_in_better_choice_rows, confirmed_elsewhere_rows, confirmed_rows,
          surrendered_rows, round2_surrendered_rows, rejected_rows, no_action_rows,
          not_used_rows, loaded_at
        )
        VALUES (
          $1,
          $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17, $18,
          $19, now()
        )
        ON CONFLICT (academic_year)
        DO UPDATE SET
          application_choices = EXCLUDED.application_choices,
          unique_applicants = EXCLUDED.unique_applicants,
          confirmed_unique_applicants = EXCLUDED.confirmed_unique_applicants,
          unique_majors = EXCLUDED.unique_majors,
          tcas_rounds = EXCLUDED.tcas_rounds,
          source_files = EXCLUDED.source_files,
          avg_score = EXCLUDED.avg_score,
          applicant_rows = EXCLUDED.applicant_rows,
          selected_rows = EXCLUDED.selected_rows,
          excluded_second_processing_rows = EXCLUDED.excluded_second_processing_rows,
          selected_in_better_choice_rows = EXCLUDED.selected_in_better_choice_rows,
          confirmed_elsewhere_rows = EXCLUDED.confirmed_elsewhere_rows,
          confirmed_rows = EXCLUDED.confirmed_rows,
          surrendered_rows = EXCLUDED.surrendered_rows,
          round2_surrendered_rows = EXCLUDED.round2_surrendered_rows,
          rejected_rows = EXCLUDED.rejected_rows,
          no_action_rows = EXCLUDED.no_action_rows,
          not_used_rows = EXCLUDED.not_used_rows,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        integer(row.application_choices, 0),
        integer(row.unique_applicants, 0),
        integer(row.confirmed_unique_applicants, 0),
        integer(row.unique_majors, 0),
        integer(row.tcas_rounds, 0),
        integer(row.source_files, 0),
        numeric(row.avg_score),
        ...statusValues(row),
      ]
    );
  }
}

async function loadSummary(client, rows) {
  for (const row of rows) {
    const roundKey = await upsertRound(client, row);
    const facultyKey = await upsertFaculty(client, row);

    await client.query(
      `
        INSERT INTO admissions_dw.fact_admission_round_year_summary (
          academic_year, round_key, project_id, faculty_key,
          application_choices, unique_applicants, confirmed_unique_applicants, unique_majors,
          avg_score, min_score, max_score, avg_priority,
          applicant_rows, selected_rows, excluded_second_processing_rows,
          selected_in_better_choice_rows, confirmed_elsewhere_rows, confirmed_rows,
          surrendered_rows, round2_surrendered_rows, rejected_rows, no_action_rows,
          not_used_rows, loaded_at
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20, $21, $22,
          $23, now()
        )
        ON CONFLICT (academic_year, round_key, project_id, faculty_key)
        DO UPDATE SET
          application_choices = EXCLUDED.application_choices,
          unique_applicants = EXCLUDED.unique_applicants,
          confirmed_unique_applicants = EXCLUDED.confirmed_unique_applicants,
          unique_majors = EXCLUDED.unique_majors,
          avg_score = EXCLUDED.avg_score,
          min_score = EXCLUDED.min_score,
          max_score = EXCLUDED.max_score,
          avg_priority = EXCLUDED.avg_priority,
          applicant_rows = EXCLUDED.applicant_rows,
          selected_rows = EXCLUDED.selected_rows,
          excluded_second_processing_rows = EXCLUDED.excluded_second_processing_rows,
          selected_in_better_choice_rows = EXCLUDED.selected_in_better_choice_rows,
          confirmed_elsewhere_rows = EXCLUDED.confirmed_elsewhere_rows,
          confirmed_rows = EXCLUDED.confirmed_rows,
          surrendered_rows = EXCLUDED.surrendered_rows,
          round2_surrendered_rows = EXCLUDED.round2_surrendered_rows,
          rejected_rows = EXCLUDED.rejected_rows,
          no_action_rows = EXCLUDED.no_action_rows,
          not_used_rows = EXCLUDED.not_used_rows,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        roundKey,
        row.project_id,
        facultyKey,
        integer(row.application_choices, 0),
        integer(row.unique_applicants, 0),
        integer(row.confirmed_unique_applicants, 0),
        integer(row.unique_majors, 0),
        numeric(row.avg_score),
        numeric(row.min_score),
        numeric(row.max_score),
        numeric(row.avg_priority),
        ...statusValues(row),
      ]
    );
  }
}

async function loadByMajor(client, rows) {
  for (const row of rows) {
    const roundKey = await upsertRound(client, row);
    const facultyKey = await upsertFaculty(client, row);
    const majorKey = await upsertMajor(client, row);

    await client.query(
      `
        INSERT INTO admissions_dw.fact_admission_round_major_summary (
          academic_year, round_key, project_id, faculty_key, major_key,
          application_choices, unique_applicants, confirmed_unique_applicants,
          applicant_status_1_rows, applicant_status_2_rows, applicant_status_3_rows,
          avg_score, min_score, max_score, avg_priority, min_priority, max_priority,
          applicant_rows, selected_rows, excluded_second_processing_rows,
          selected_in_better_choice_rows, confirmed_elsewhere_rows, confirmed_rows,
          surrendered_rows, round2_surrendered_rows, rejected_rows, no_action_rows,
          not_used_rows, loaded_at
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16, $17,
          $18, $19, $20,
          $21, $22, $23,
          $24, $25, $26, $27,
          $28, now()
        )
        ON CONFLICT (academic_year, round_key, project_id, faculty_key, major_key)
        DO UPDATE SET
          application_choices = EXCLUDED.application_choices,
          unique_applicants = EXCLUDED.unique_applicants,
          confirmed_unique_applicants = EXCLUDED.confirmed_unique_applicants,
          applicant_status_1_rows = EXCLUDED.applicant_status_1_rows,
          applicant_status_2_rows = EXCLUDED.applicant_status_2_rows,
          applicant_status_3_rows = EXCLUDED.applicant_status_3_rows,
          avg_score = EXCLUDED.avg_score,
          min_score = EXCLUDED.min_score,
          max_score = EXCLUDED.max_score,
          avg_priority = EXCLUDED.avg_priority,
          min_priority = EXCLUDED.min_priority,
          max_priority = EXCLUDED.max_priority,
          applicant_rows = EXCLUDED.applicant_rows,
          selected_rows = EXCLUDED.selected_rows,
          excluded_second_processing_rows = EXCLUDED.excluded_second_processing_rows,
          selected_in_better_choice_rows = EXCLUDED.selected_in_better_choice_rows,
          confirmed_elsewhere_rows = EXCLUDED.confirmed_elsewhere_rows,
          confirmed_rows = EXCLUDED.confirmed_rows,
          surrendered_rows = EXCLUDED.surrendered_rows,
          round2_surrendered_rows = EXCLUDED.round2_surrendered_rows,
          rejected_rows = EXCLUDED.rejected_rows,
          no_action_rows = EXCLUDED.no_action_rows,
          not_used_rows = EXCLUDED.not_used_rows,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        roundKey,
        row.project_id,
        facultyKey,
        majorKey,
        integer(row.application_choices, 0),
        integer(row.unique_applicants, 0),
        integer(row.confirmed_unique_applicants, 0),
        integer(row.applicant_status_1_rows, 0),
        integer(row.applicant_status_2_rows, 0),
        integer(row.applicant_status_3_rows, 0),
        numeric(row.avg_score),
        numeric(row.min_score),
        numeric(row.max_score),
        numeric(row.avg_priority),
        integer(row.min_priority),
        integer(row.max_priority),
        ...statusValues(row),
      ]
    );
  }
}

async function loadStatusSummary(client, rows) {
  for (const row of rows) {
    const roundKey = await upsertRound(client, row);
    const statusKey = await upsertStatus(client, row);

    await client.query(
      `
        INSERT INTO admissions_dw.fact_admission_round_status_summary (
          academic_year, round_key, status_key,
          application_choices, unique_applicants, unique_majors, avg_score,
          loaded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (academic_year, round_key, status_key)
        DO UPDATE SET
          application_choices = EXCLUDED.application_choices,
          unique_applicants = EXCLUDED.unique_applicants,
          unique_majors = EXCLUDED.unique_majors,
          avg_score = EXCLUDED.avg_score,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        roundKey,
        statusKey,
        integer(row.application_choices, 0),
        integer(row.unique_applicants, 0),
        integer(row.unique_majors, 0),
        numeric(row.avg_score),
      ]
    );
  }
}

async function loadSourceDataQuality(client, rows) {
  for (const row of rows) {
    const roundKey = await upsertRound(client, row);

    await client.query(
      `
        INSERT INTO admissions_dw.admission_round_source_data_quality (
          academic_year, round_key, source_file,
          source_rows, unique_applicants, duplicate_applicant_rows,
          missing_score_rows, missing_priority_rows, missing_major_rows,
          pii_columns_removed, loaded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
        ON CONFLICT (academic_year, round_key, source_file)
        DO UPDATE SET
          source_rows = EXCLUDED.source_rows,
          unique_applicants = EXCLUDED.unique_applicants,
          duplicate_applicant_rows = EXCLUDED.duplicate_applicant_rows,
          missing_score_rows = EXCLUDED.missing_score_rows,
          missing_priority_rows = EXCLUDED.missing_priority_rows,
          missing_major_rows = EXCLUDED.missing_major_rows,
          pii_columns_removed = EXCLUDED.pii_columns_removed,
          loaded_at = now()
      `,
      [
        integer(row.academic_year),
        roundKey,
        row.source_file,
        integer(row.source_rows, 0),
        integer(row.unique_applicants, 0),
        integer(row.duplicate_applicant_rows, 0),
        integer(row.missing_score_rows, 0),
        integer(row.missing_priority_rows, 0),
        integer(row.missing_major_rows, 0),
        row.pii_columns_removed,
      ]
    );
  }
}

async function loadLegacyYearQuality(client, rows) {
  const byYear = new Map();

  for (const row of rows) {
    const year = integer(row.academic_year);
    const current =
      byYear.get(year) ??
      {
        source_rows: 0,
        unique_applicants: 0,
        duplicate_applicant_rows: 0,
        missing_score_rows: 0,
        missing_priority_rows: 0,
        missing_major_rows: 0,
        pii_columns_removed: new Set(),
      };

    current.source_rows += integer(row.source_rows, 0);
    current.unique_applicants += integer(row.unique_applicants, 0);
    current.duplicate_applicant_rows += integer(row.duplicate_applicant_rows, 0);
    current.missing_score_rows += integer(row.missing_score_rows, 0);
    current.missing_priority_rows += integer(row.missing_priority_rows, 0);
    current.missing_major_rows += integer(row.missing_major_rows, 0);
    for (const column of String(row.pii_columns_removed || "").split(",")) {
      const trimmed = column.trim();
      if (trimmed) current.pii_columns_removed.add(trimmed);
    }

    byYear.set(year, current);
  }

  for (const [academicYear, row] of byYear.entries()) {
    await client.query(
      `
        INSERT INTO admissions_dw.admission_round_data_quality (
          academic_year,
          source_rows,
          unique_applicants,
          duplicate_applicant_rows,
          missing_score_rows,
          missing_priority_rows,
          missing_major_rows,
          pii_columns_removed,
          loaded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (academic_year)
        DO UPDATE SET
          source_rows = EXCLUDED.source_rows,
          unique_applicants = EXCLUDED.unique_applicants,
          duplicate_applicant_rows = EXCLUDED.duplicate_applicant_rows,
          missing_score_rows = EXCLUDED.missing_score_rows,
          missing_priority_rows = EXCLUDED.missing_priority_rows,
          missing_major_rows = EXCLUDED.missing_major_rows,
          pii_columns_removed = EXCLUDED.pii_columns_removed,
          loaded_at = now()
      `,
      [
        academicYear,
        row.source_rows,
        row.unique_applicants,
        row.duplicate_applicant_rows,
        row.missing_score_rows,
        row.missing_priority_rows,
        row.missing_major_rows,
        [...row.pii_columns_removed].sort().join(", "),
      ]
    );
  }
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
    const yearOverviewRows = readCsv(files.yearOverview);
    const roundOverviewRows = readCsv(files.roundOverview);
    const summaryRows = readCsv(files.summary);
    const byMajorRows = readCsv(files.byMajor);
    const statusRows = readCsv(files.statusSummary);
    const qualityRows = readCsv(files.dataQuality);

    await client.query("BEGIN");

    for (const schemaPath of schemaPaths) {
      await client.query(fs.readFileSync(schemaPath, "utf8"));
    }

    await loadYearOverview(client, yearOverviewRows);
    await loadRoundOverview(client, roundOverviewRows);
    await loadSummary(client, summaryRows);
    await loadByMajor(client, byMajorRows);
    await loadStatusSummary(client, statusRows);
    await loadSourceDataQuality(client, qualityRows);
    await loadLegacyYearQuality(client, qualityRows);
    await client.query("COMMIT");

    const verification = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM admissions_dw.dim_tcas_round) AS round_count,
        (SELECT COUNT(*) FROM admissions_dw.dim_major) AS major_count,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission_year_overview) AS year_overview_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission_round_overview) AS round_overview_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission_round_year_summary) AS project_summary_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission_round_major_summary) AS major_summary_rows,
        (SELECT COUNT(*) FROM admissions_dw.fact_admission_round_status_summary) AS status_summary_rows,
        (SELECT COUNT(*) FROM admissions_dw.admission_round_source_data_quality) AS source_quality_rows
    `);

    const overview = await client.query(`
      SELECT
        academic_year,
        tcas_round_code,
        application_choices,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate
      FROM admissions_dw.vw_admission_round_overview
      ORDER BY academic_year, tcas_round_code
    `);

    console.log(JSON.stringify({ verification: verification.rows[0], overview: overview.rows }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
