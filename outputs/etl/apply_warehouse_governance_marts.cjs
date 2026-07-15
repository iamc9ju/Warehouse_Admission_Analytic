const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "../..");
const schemaPaths = [
  path.join(rootDir, "outputs", "sql", "admissions_round3_warehouse.sql"),
  path.join(rootDir, "outputs", "sql", "admissions_all_rounds_warehouse.sql"),
  path.join(rootDir, "outputs", "sql", "social_media_warehouse.sql"),
  path.join(rootDir, "outputs", "sql", "website_analytics_warehouse.sql"),
  path.join(rootDir, "outputs", "sql", "warehouse_governance_marts.sql"),
];

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}

async function main() {
  requireDatabaseUrl();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query("BEGIN");

    for (const schemaPath of schemaPaths) {
      await client.query(fs.readFileSync(schemaPath, "utf8"));
    }

    await client.query(
      `
        INSERT INTO admissions_dw.dw_refresh_run (
          pipeline_name,
          source_name,
          target_dataset,
          run_status,
          loaded_rows,
          notes,
          finished_at
        )
        VALUES (
          'apply_warehouse_governance_marts',
          'outputs/sql/warehouse_governance_marts.sql',
          'admissions_dw governance and mart objects',
          'success',
          (
            SELECT COUNT(*)
            FROM admissions_dw.dw_dataset_catalog
          ),
          'Applied dataset catalog, lineage, quality scorecard and presentation marts.',
          now()
        )
      `
    );

    await client.query("COMMIT");

    const result = await client.query(
      `
        SELECT
          (SELECT COUNT(*) FROM admissions_dw.dw_dataset_catalog) AS catalog_rows,
          (SELECT COUNT(*) FROM admissions_dw.dw_lineage_edge) AS lineage_edges,
          (SELECT COUNT(*) FROM admissions_dw.mart_admissions_executive_summary) AS executive_rows,
          (SELECT COUNT(*) FROM admissions_dw.mart_major_conversion) AS major_rows,
          (SELECT COUNT(*) FROM admissions_dw.mart_channel_effectiveness) AS channel_rows
      `
    );

    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
