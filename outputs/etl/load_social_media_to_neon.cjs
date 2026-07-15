const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const csvPath =
  process.env.SOCIAL_MEDIA_CSV ??
  path.join(rootDir, "outputs", "sample_data", "sample_social_media_monthly_2568_2569.csv");
const schemaPath = path.join(rootDir, "outputs", "sql", "social_media_warehouse.sql");

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

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`Invalid CSV row ${rowIndex + 2}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function integer(value) {
  return Number.parseInt(value, 10);
}

function monthDate(value) {
  return `${value}-01`;
}

function sentimentScore(label) {
  if (label === "Positive") return 1;
  if (label === "Negative") return -1;
  return 0;
}

async function upsertPlatform(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_social_platform (platform_name)
      VALUES ($1)
      ON CONFLICT (platform_name)
      DO UPDATE SET platform_name = EXCLUDED.platform_name
      RETURNING platform_key
    `,
    [row.platform_name]
  );
  return result.rows[0].platform_key;
}

async function upsertKeyword(client, row) {
  const majorId = row.major_id === "ALL" ? null : row.major_id;
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_social_keyword (
        keyword_group,
        keyword_text,
        major_id,
        major_name
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (keyword_group, keyword_text, (COALESCE(major_id, '')))
      DO UPDATE SET major_name = EXCLUDED.major_name
      RETURNING keyword_key
    `,
    [row.keyword_group, row.keyword_text, majorId, row.major_name]
  );
  return result.rows[0].keyword_key;
}

async function upsertSentiment(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_sentiment (sentiment_label, sentiment_score)
      VALUES ($1, $2)
      ON CONFLICT (sentiment_label)
      DO UPDATE SET sentiment_score = EXCLUDED.sentiment_score
      RETURNING sentiment_key
    `,
    [row.sentiment_label, sentimentScore(row.sentiment_label)]
  );
  return result.rows[0].sentiment_key;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(schemaSql);

    for (const row of rows) {
      const platformKey = await upsertPlatform(client, row);
      const keywordKey = await upsertKeyword(client, row);
      const sentimentKey = await upsertSentiment(client, row);

      await client.query(
        `
          INSERT INTO admissions_dw.fact_social_media_monthly_summary (
            academic_year,
            calendar_month,
            platform_key,
            keyword_key,
            sentiment_key,
            mention_count,
            like_count,
            comment_count,
            share_count,
            view_count,
            loaded_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
          ON CONFLICT (
            academic_year,
            calendar_month,
            platform_key,
            keyword_key,
            sentiment_key
          )
          DO UPDATE SET
            mention_count = EXCLUDED.mention_count,
            like_count = EXCLUDED.like_count,
            comment_count = EXCLUDED.comment_count,
            share_count = EXCLUDED.share_count,
            view_count = EXCLUDED.view_count,
            loaded_at = now()
        `,
        [
          integer(row.academic_year),
          monthDate(row.calendar_month),
          platformKey,
          keywordKey,
          sentimentKey,
          integer(row.mention_count),
          integer(row.like_count),
          integer(row.comment_count),
          integer(row.share_count),
          integer(row.view_count),
        ]
      );
    }

    await client.query("COMMIT");

    const verification = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM admissions_dw.fact_social_media_monthly_summary) AS social_rows,
        (SELECT COUNT(*) FROM admissions_dw.dim_social_platform) AS platform_count,
        (SELECT COUNT(*) FROM admissions_dw.dim_social_keyword) AS keyword_count
    `);
    const overview = await client.query(`
      SELECT *
      FROM admissions_dw.vw_social_admissions_year_correlation
      ORDER BY academic_year
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
