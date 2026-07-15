const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const csvPath =
  process.env.WEBSITE_ANALYTICS_CSV ??
  path.join(rootDir, "outputs", "real_data", "ga4_website_monthly.csv");
const schemaPath = path.join(rootDir, "outputs", "sql", "website_analytics_warehouse.sql");

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

function decimal(value) {
  return Number(value);
}

function monthDate(value) {
  return `${value}-01`;
}

async function upsertChannel(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_website_channel (channel_group)
      VALUES ($1)
      ON CONFLICT (channel_group)
      DO UPDATE SET channel_group = EXCLUDED.channel_group
      RETURNING channel_key
    `,
    [row.channel_group]
  );
  return result.rows[0].channel_key;
}

async function upsertLandingPage(client, row) {
  const result = await client.query(
    `
      INSERT INTO admissions_dw.dim_website_landing_page (landing_page)
      VALUES ($1)
      ON CONFLICT (landing_page)
      DO UPDATE SET landing_page = EXCLUDED.landing_page
      RETURNING landing_page_key
    `,
    [row.landing_page]
  );
  return result.rows[0].landing_page_key;
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
      const channelKey = await upsertChannel(client, row);
      const landingPageKey = await upsertLandingPage(client, row);

      await client.query(
        `
          INSERT INTO admissions_dw.fact_website_analytics_monthly (
            academic_year,
            calendar_month,
            channel_key,
            landing_page_key,
            sessions,
            active_users,
            total_users,
            new_users,
            screen_page_views,
            engaged_sessions,
            engagement_rate,
            event_count,
            key_events,
            user_engagement_duration_seconds,
            loaded_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
          ON CONFLICT (
            academic_year,
            calendar_month,
            channel_key,
            landing_page_key
          )
          DO UPDATE SET
            sessions = EXCLUDED.sessions,
            active_users = EXCLUDED.active_users,
            total_users = EXCLUDED.total_users,
            new_users = EXCLUDED.new_users,
            screen_page_views = EXCLUDED.screen_page_views,
            engaged_sessions = EXCLUDED.engaged_sessions,
            engagement_rate = EXCLUDED.engagement_rate,
            event_count = EXCLUDED.event_count,
            key_events = EXCLUDED.key_events,
            user_engagement_duration_seconds = EXCLUDED.user_engagement_duration_seconds,
            loaded_at = now()
        `,
        [
          integer(row.academic_year),
          monthDate(row.calendar_month),
          channelKey,
          landingPageKey,
          integer(row.sessions),
          integer(row.active_users),
          integer(row.total_users),
          integer(row.new_users),
          integer(row.screen_page_views),
          integer(row.engaged_sessions),
          decimal(row.engagement_rate),
          integer(row.event_count),
          decimal(row.key_events),
          decimal(row.user_engagement_duration_seconds),
        ]
      );
    }

    await client.query("COMMIT");

    const verification = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM admissions_dw.fact_website_analytics_monthly) AS website_rows,
        (SELECT COUNT(*) FROM admissions_dw.dim_website_channel) AS channel_count,
        (SELECT COUNT(*) FROM admissions_dw.dim_website_landing_page) AS landing_page_count
    `);
    const overview = await client.query(`
      SELECT *
      FROM admissions_dw.vw_website_admissions_year_correlation
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
