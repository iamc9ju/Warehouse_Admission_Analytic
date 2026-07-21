CREATE SCHEMA IF NOT EXISTS admissions_dw;

DROP VIEW IF EXISTS admissions_dw.mart_channel_effectiveness;

CREATE TABLE IF NOT EXISTS admissions_dw.dw_dataset_catalog (
    dataset_key BIGSERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL UNIQUE,
    warehouse_layer TEXT NOT NULL,
    grain_description TEXT NOT NULL,
    source_system TEXT NOT NULL,
    refresh_cadence TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    sensitivity_level TEXT NOT NULL,
    business_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dw_dataset_catalog_layer_check CHECK (
        warehouse_layer IN ('source', 'staging', 'core', 'mart', 'governance')
    ),
    CONSTRAINT dw_dataset_catalog_sensitivity_check CHECK (
        sensitivity_level IN ('public', 'internal', 'restricted')
    )
);

CREATE TABLE IF NOT EXISTS admissions_dw.dw_lineage_edge (
    lineage_key BIGSERIAL PRIMARY KEY,
    upstream_dataset TEXT NOT NULL,
    downstream_dataset TEXT NOT NULL,
    transform_name TEXT NOT NULL,
    transform_type TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dw_lineage_edge_unique UNIQUE (
        upstream_dataset,
        downstream_dataset,
        transform_name
    ),
    CONSTRAINT dw_lineage_edge_type_check CHECK (
        transform_type IN ('extract', 'aggregate', 'load', 'normalize', 'join', 'publish')
    )
);

CREATE TABLE IF NOT EXISTS admissions_dw.dw_refresh_run (
    run_key BIGSERIAL PRIMARY KEY,
    pipeline_name TEXT NOT NULL,
    source_name TEXT NOT NULL,
    target_dataset TEXT NOT NULL,
    run_status TEXT NOT NULL,
    source_rows BIGINT NOT NULL DEFAULT 0 CHECK (source_rows >= 0),
    loaded_rows BIGINT NOT NULL DEFAULT 0 CHECK (loaded_rows >= 0),
    rejected_rows BIGINT NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    CONSTRAINT dw_refresh_run_status_check CHECK (
        run_status IN ('success', 'warning', 'failed', 'running')
    )
);

INSERT INTO admissions_dw.dw_dataset_catalog (
    dataset_name,
    warehouse_layer,
    grain_description,
    source_system,
    refresh_cadence,
    owner_name,
    sensitivity_level,
    business_description
)
VALUES
    (
        'source_round3_excel',
        'source',
        'Raw TCAS Round 3 Excel files by academic year',
        'User-provided Excel',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'restricted',
        'Original admissions extracts used only as ETL source; raw PII is not loaded to warehouse.'
    ),
    (
        'processed_round3_csv',
        'staging',
        'Aggregated CSV outputs by year, major, status and quality checks',
        'outputs/etl/aggregate_round3_admissions.py',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'PII-free aggregate staging files produced from Excel before loading to Neon.'
    ),
    (
        'fact_admission_year_overview',
        'core',
        'One row per academic year across all TCAS rounds with true cross-round unique applicants',
        'Neon PostgreSQL',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'Year-level admissions fact created from raw in-memory applicant identifiers before PII is removed from outputs.'
    ),
    (
        'fact_admission_round_overview',
        'core',
        'One row per academic year and TCAS round',
        'Neon PostgreSQL',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'Round-grain admissions fact for comparing TCAS1 Portfolio, TCAS2 Quota, TCAS3 Admission and TCAS4 Direct Admission.'
    ),
    (
        'admission_round_source_data_quality',
        'governance',
        'One row per source workbook file',
        'outputs/etl/aggregate_admissions_all_rounds.py',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'Source-file data quality metadata including row counts, missing fields and PII removed from exports.'
    ),
    (
        'fact_admission_round_year_summary',
        'core',
        'One row per academic year, TCAS round, project and faculty',
        'Neon PostgreSQL',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'Conformed admissions fact used for annual application and confirmed applicant KPIs.'
    ),
    (
        'fact_admission_round_major_summary',
        'core',
        'One row per academic year, TCAS round, project, faculty and major',
        'Neon PostgreSQL',
        'Manual per admissions cycle',
        'Admissions analytics project',
        'internal',
        'Major-level admissions fact for ranking, conversion and score analytics.'
    ),
    (
        'fact_website_analytics_monthly',
        'core',
        'One row per academic year, month, channel group and landing page',
        'Google Analytics 4',
        'API refresh when GA4 has data',
        'Admissions analytics project',
        'internal',
        'Aggregate website analytics fact table for admissions website traffic and engagement.'
    ),
    (
        'mart_tcas_year_summary',
        'mart',
        'One row per academic year across all TCAS rounds',
        'admissions_dw core facts',
        'After all-round fact refresh',
        'Admissions analytics project',
        'internal',
        'Dashboard-ready year comparison mart using true cross-round unique applicant counts.'
    ),
    (
        'mart_tcas_round_summary',
        'mart',
        'One row per academic year and TCAS round',
        'admissions_dw core facts',
        'After all-round fact refresh',
        'Admissions analytics project',
        'internal',
        'Dashboard-ready round comparison mart for TCAS1-4.'
    ),
    (
        'mart_admissions_executive_summary',
        'mart',
        'One row per academic year for executive dashboard KPIs',
        'admissions_dw core facts',
        'After core fact refresh',
        'Admissions analytics project',
        'internal',
        'Presentation mart joining admissions, owned website analytics and quality indicators for dashboard consumption.'
    ),
    (
        'mart_major_conversion',
        'mart',
        'One row per academic year and major offering',
        'admissions_dw core facts',
        'After core fact refresh',
        'Admissions analytics project',
        'internal',
        'Presentation mart for major demand, confirmation rate and year-over-year change.'
    )
ON CONFLICT (dataset_name) DO UPDATE
SET
    warehouse_layer = EXCLUDED.warehouse_layer,
    grain_description = EXCLUDED.grain_description,
    source_system = EXCLUDED.source_system,
    refresh_cadence = EXCLUDED.refresh_cadence,
    owner_name = EXCLUDED.owner_name,
    sensitivity_level = EXCLUDED.sensitivity_level,
    business_description = EXCLUDED.business_description,
    updated_at = now();

DELETE FROM admissions_dw.dw_dataset_catalog
WHERE dataset_name IN (
    'fact_social_media_monthly_summary'
);

INSERT INTO admissions_dw.dw_lineage_edge (
    upstream_dataset,
    downstream_dataset,
    transform_name,
    transform_type,
    notes
)
VALUES
    (
        'source_all_round_excel',
        'processed_round_all_round_csv',
        'aggregate_admissions_all_rounds.py',
        'aggregate',
        'Aggregates all supplied TCAS round workbooks while using raw applicant identifiers only in memory.'
    ),
    (
        'processed_round_all_round_csv',
        'fact_admission_year_overview',
        'load_admissions_all_rounds_to_neon.cjs',
        'load',
        'Loads true year-level aggregate metrics across TCAS rounds.'
    ),
    (
        'processed_round_all_round_csv',
        'fact_admission_round_overview',
        'load_admissions_all_rounds_to_neon.cjs',
        'load',
        'Loads round-level aggregate metrics for TCAS1-4.'
    ),
    (
        'processed_round_all_round_csv',
        'admission_round_source_data_quality',
        'load_admissions_all_rounds_to_neon.cjs',
        'load',
        'Loads source-file quality metadata for all supplied Excel files.'
    ),
    (
        'source_round3_excel',
        'processed_round3_csv',
        'aggregate_round3_admissions.py',
        'aggregate',
        'Aggregates applicant choices to year, major, status and quality outputs while removing raw PII.'
    ),
    (
        'processed_round3_csv',
        'fact_admission_round_year_summary',
        'load_round3_to_neon.cjs',
        'load',
        'Loads annual admissions summary with idempotent upsert semantics.'
    ),
    (
        'processed_round3_csv',
        'fact_admission_round_major_summary',
        'load_round3_to_neon.cjs',
        'load',
        'Loads major-level admissions summary with idempotent upsert semantics.'
    ),
    (
        'processed_round3_csv',
        'fact_admission_round_status_summary',
        'load_round3_to_neon.cjs',
        'load',
        'Loads TCAS status distribution summary.'
    ),
    (
        'ga4_data_api',
        'fact_website_analytics_monthly',
        'load_website_analytics_to_neon.cjs',
        'load',
        'Loads aggregate monthly website analytics from GA4 exports.'
    ),
    (
        'core_facts',
        'mart_admissions_executive_summary',
        'mart_admissions_executive_summary view',
        'join',
        'Combines admissions, owned website analytics and data quality metrics at academic-year grain.'
    ),
    (
        'fact_admission_round_major_summary',
        'mart_major_conversion',
        'mart_major_conversion view',
        'publish',
        'Publishes major-level conversion KPIs and year-over-year comparison fields.'
    )
ON CONFLICT (upstream_dataset, downstream_dataset, transform_name) DO UPDATE
SET
    transform_type = EXCLUDED.transform_type,
    notes = EXCLUDED.notes;

DELETE FROM admissions_dw.dw_lineage_edge
WHERE upstream_dataset = 'social_source_exports'
   OR downstream_dataset = 'fact_social_media_monthly_summary';

CREATE OR REPLACE VIEW admissions_dw.vw_dw_dataset_inventory AS
SELECT
    warehouse_layer,
    COUNT(*) AS dataset_count,
    COUNT(*) FILTER (WHERE sensitivity_level = 'restricted') AS restricted_dataset_count,
    COUNT(*) FILTER (WHERE sensitivity_level = 'internal') AS internal_dataset_count,
    COUNT(*) FILTER (WHERE sensitivity_level = 'public') AS public_dataset_count
FROM admissions_dw.dw_dataset_catalog
GROUP BY warehouse_layer;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_lineage_overview AS
SELECT
    upstream_dataset,
    downstream_dataset,
    transform_name,
    transform_type,
    notes
FROM admissions_dw.dw_lineage_edge
ORDER BY lineage_key;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_table_row_counts AS
SELECT
    'dim_major' AS object_name,
    'dimension' AS object_type,
    COUNT(*)::BIGINT AS row_count
FROM admissions_dw.dim_major
UNION ALL
SELECT
    'fact_admission_year_overview',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_admission_year_overview
UNION ALL
SELECT
    'fact_admission_round_overview',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_admission_round_overview
UNION ALL
SELECT
    'fact_admission_round_year_summary',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_admission_round_year_summary
UNION ALL
SELECT
    'fact_admission_round_major_summary',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_admission_round_major_summary
UNION ALL
SELECT
    'fact_admission_round_status_summary',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_admission_round_status_summary
UNION ALL
SELECT
    'fact_website_analytics_monthly',
    'fact',
    COUNT(*)::BIGINT
FROM admissions_dw.fact_website_analytics_monthly
UNION ALL
SELECT
    'admission_round_source_data_quality',
    'quality',
    COUNT(*)::BIGINT
FROM admissions_dw.admission_round_source_data_quality
UNION ALL
SELECT
    'admission_round_data_quality',
    'quality',
    COUNT(*)::BIGINT
FROM admissions_dw.admission_round_data_quality
UNION ALL
SELECT
    'dw_dataset_catalog',
    'governance',
    COUNT(*)::BIGINT
FROM admissions_dw.dw_dataset_catalog
UNION ALL
SELECT
    'dw_lineage_edge',
    'governance',
    COUNT(*)::BIGINT
FROM admissions_dw.dw_lineage_edge;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_quality_scorecard AS
WITH admissions_quality AS (
    SELECT
        SUM(source_rows) AS source_rows,
        SUM(missing_score_rows) AS missing_score_rows,
        SUM(missing_priority_rows) AS missing_priority_rows,
        SUM(missing_major_rows) AS missing_major_rows,
        SUM(duplicate_applicant_rows) AS duplicate_applicant_rows
    FROM admissions_dw.admission_round_data_quality
),
website_quality AS (
    SELECT
        COUNT(*) AS website_rows,
        COALESCE(SUM(sessions), 0) AS website_sessions
    FROM admissions_dw.fact_website_analytics_monthly
)
SELECT
    source_rows,
    missing_score_rows,
    missing_priority_rows,
    missing_major_rows,
    duplicate_applicant_rows,
    website_rows,
    website_sessions,
    CASE
        WHEN missing_score_rows = 0
            AND missing_major_rows = 0
            AND source_rows > 0
        THEN 'pass'
        ELSE 'review'
    END AS admissions_quality_status,
    CASE
        WHEN website_rows > 0 THEN 'pass'
        ELSE 'waiting_for_data'
    END AS website_quality_status
FROM admissions_quality
CROSS JOIN website_quality;

CREATE OR REPLACE VIEW admissions_dw.mart_admissions_executive_summary AS
SELECT
    a.academic_year,
    a.application_choices,
    a.unique_applicants,
    a.confirmed_unique_applicants,
    a.confirmed_unique_rate,
    a.unique_majors,
    a.avg_score,
    q.source_rows,
    q.missing_score_rows,
    q.missing_major_rows,
    COALESCE(w.total_sessions, 0) AS total_website_sessions,
    COALESCE(w.total_page_views, 0) AS total_website_page_views,
    a.unique_applicants - LAG(a.unique_applicants) OVER (ORDER BY a.academic_year) AS unique_applicants_change,
    a.confirmed_unique_applicants - LAG(a.confirmed_unique_applicants) OVER (ORDER BY a.academic_year) AS confirmed_applicants_change
FROM admissions_dw.vw_round3_year_overview a
LEFT JOIN admissions_dw.admission_round_data_quality q
    ON a.academic_year = q.academic_year
LEFT JOIN admissions_dw.vw_website_analytics_year_overview w
    ON a.academic_year = w.academic_year;

CREATE OR REPLACE VIEW admissions_dw.mart_major_conversion AS
SELECT
    academic_year,
    major_id,
    major_name,
    major_type,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score,
    unique_applicants - LAG(unique_applicants) OVER (
        PARTITION BY major_id, major_name, major_type
        ORDER BY academic_year
    ) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (
        PARTITION BY major_id, major_name, major_type
        ORDER BY academic_year
    ) AS confirmed_applicants_change,
    RANK() OVER (
        PARTITION BY academic_year
        ORDER BY unique_applicants DESC
    ) AS demand_rank,
    RANK() OVER (
        PARTITION BY academic_year
        ORDER BY confirmed_unique_rate DESC NULLS LAST
    ) AS conversion_rank
FROM admissions_dw.vw_round3_major_performance;
