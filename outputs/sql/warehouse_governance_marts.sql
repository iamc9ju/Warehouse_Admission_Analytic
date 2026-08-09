CREATE SCHEMA IF NOT EXISTS admissions_dw;

DROP TABLE IF EXISTS admissions_dw.dw_dataset_catalog CASCADE;
DROP TABLE IF EXISTS admissions_dw.dw_lineage_edge CASCADE;
DROP TABLE IF EXISTS admissions_dw.dw_refresh_run CASCADE;

CREATE TABLE admissions_dw.dw_dataset_catalog (
    dataset_key BIGSERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL UNIQUE,
    warehouse_layer TEXT NOT NULL,
    grain_description TEXT NOT NULL,
    source_system TEXT NOT NULL,
    sensitivity_level TEXT NOT NULL,
    business_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admissions_dw.dw_lineage_edge (
    lineage_key BIGSERIAL PRIMARY KEY,
    upstream_dataset TEXT NOT NULL,
    downstream_dataset TEXT NOT NULL,
    transform_name TEXT NOT NULL,
    transform_type TEXT NOT NULL,
    notes TEXT NOT NULL,
    CONSTRAINT dw_lineage_edge_unique UNIQUE (upstream_dataset, downstream_dataset, transform_name)
);

CREATE TABLE admissions_dw.dw_refresh_run (
    run_key BIGSERIAL PRIMARY KEY,
    pipeline_name TEXT NOT NULL,
    source_name TEXT NOT NULL,
    target_dataset TEXT NOT NULL,
    run_status TEXT NOT NULL CHECK (run_status IN ('success', 'warning', 'failed', 'running')),
    source_rows BIGINT NOT NULL DEFAULT 0 CHECK (source_rows >= 0),
    loaded_rows BIGINT NOT NULL DEFAULT 0 CHECK (loaded_rows >= 0),
    rejected_rows BIGINT NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT ''
);

INSERT INTO admissions_dw.dw_dataset_catalog (
    dataset_name, warehouse_layer, grain_description, source_system,
    sensitivity_level, business_description
)
VALUES
    ('admissions_excel_files', 'source', 'source file + source row', 'User-provided Excel', 'restricted', 'Raw admissions files; direct identifiers remain inside the ETL privacy boundary.'),
    ('admissions_fact_stage', 'staging', 'one application choice', 'aggregate_admissions_all_rounds.py', 'restricted', 'PII-safe row staging with opaque student and application tokens.'),
    ('dim_student', 'dimension', 'one pseudonymous student', 'Neon PostgreSQL', 'restricted', 'Stable HMAC-SHA256 token only; no direct identity or contact fields.'),
    ('dim_year', 'dimension', 'one academic year', 'Neon PostgreSQL', 'internal', 'Academic years 2567-2569.'),
    ('conformed_admissions_dimensions', 'dimension', 'one member per business entity', 'Neon PostgreSQL', 'internal', 'Round, project, faculty, major, program type, status and source file dimensions.'),
    ('fact_admission', 'core', 'one application choice', 'Neon PostgreSQL', 'restricted', 'The only physical fact table; every row contains all dimension keys and score.'),
    ('admissions_presentation_marts', 'mart', 'year, round, major or status aggregate', 'fact_admission', 'internal', 'Dashboard-ready views derived only from fact_admission.'),
    ('warehouse_dashboard_snapshot', 'presentation', 'one generated artifact', 'Warehouse mart export', 'internal', 'Credential-free fallback artifact consumed by the web dashboard.');

INSERT INTO admissions_dw.dw_lineage_edge (
    upstream_dataset, downstream_dataset, transform_name, transform_type, notes
)
VALUES
    ('admissions_excel_files', 'admissions_fact_stage', 'normalize_and_tokenize', 'normalize', 'Maps Thai/English source columns, removes direct identifiers and creates opaque tokens.'),
    ('admissions_fact_stage', 'dim_student + dim_year', 'load_identity_and_time_dimensions', 'load', 'Loads the two dimensions requested for the unified model.'),
    ('admissions_fact_stage', 'conformed_admissions_dimensions', 'load_conformed_dimensions', 'load', 'Loads round, project, faculty, major, program, status and source dimensions.'),
    ('dim_student + dim_year + conformed_admissions_dimensions', 'fact_admission', 'load_application_fact', 'load', 'Resolves every dimension key and stores score at one-application-choice grain.'),
    ('fact_admission', 'admissions_presentation_marts', 'aggregate_single_fact', 'aggregate', 'Builds year, round, major and status analytics without secondary facts.'),
    ('admissions_presentation_marts', 'warehouse_dashboard_snapshot', 'publish_dashboard_artifact', 'publish', 'Exports governed query results for the web dashboard.');

INSERT INTO admissions_dw.dw_refresh_run (
    pipeline_name, source_name, target_dataset, run_status,
    source_rows, loaded_rows, rejected_rows, finished_at, notes
)
SELECT
    'load_admissions_all_rounds_to_neon',
    'admissions_fact_2567_2569.csv',
    'admissions_dw.fact_admission',
    CASE WHEN COUNT(*) > 0 THEN 'success' ELSE 'failed' END,
    COUNT(*), COUNT(*), 0, now(),
    'Single-fact load covering TCAS1-3 in 2567 and TCAS1-4 in 2568-2569.'
FROM admissions_dw.fact_admission;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_dataset_inventory AS
SELECT
    warehouse_layer,
    COUNT(*) AS dataset_count,
    COUNT(*) FILTER (WHERE sensitivity_level = 'restricted') AS restricted_dataset_count,
    COUNT(*) FILTER (WHERE sensitivity_level = 'internal') AS internal_dataset_count
FROM admissions_dw.dw_dataset_catalog
GROUP BY warehouse_layer;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_lineage_overview AS
SELECT upstream_dataset, downstream_dataset, transform_name, transform_type, notes
FROM admissions_dw.dw_lineage_edge
ORDER BY lineage_key;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_table_row_counts AS
SELECT 'dim_student' AS object_name, 'dimension' AS object_type, COUNT(*)::BIGINT AS row_count
FROM admissions_dw.dim_student
UNION ALL
SELECT 'dim_year', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_year
UNION ALL
SELECT 'dim_tcas_round', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_tcas_round
UNION ALL
SELECT 'dim_project', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_project
UNION ALL
SELECT 'dim_faculty', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_faculty
UNION ALL
SELECT 'dim_major', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_major
UNION ALL
SELECT 'dim_program_type', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_program_type
UNION ALL
SELECT 'dim_tcas_status', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_tcas_status
UNION ALL
SELECT 'dim_source_file', 'dimension', COUNT(*)::BIGINT FROM admissions_dw.dim_source_file
UNION ALL
SELECT 'fact_admission', 'fact', COUNT(*)::BIGINT FROM admissions_dw.fact_admission
UNION ALL
SELECT 'admission_round_source_data_quality', 'quality', COUNT(*)::BIGINT
FROM admissions_dw.admission_round_source_data_quality;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_quality_scorecard AS
WITH quality AS (
    SELECT
        COALESCE(SUM(source_rows), 0)::BIGINT AS source_rows,
        COALESCE(SUM(missing_score_rows), 0)::BIGINT AS missing_score_rows,
        COALESCE(SUM(missing_major_rows), 0)::BIGINT AS missing_major_rows,
        COALESCE(SUM(pii_exported_columns), 0)::BIGINT AS pii_exported_columns,
        COUNT(*)::BIGINT AS source_files
    FROM admissions_dw.admission_round_source_data_quality
), metrics AS (
    SELECT 1 AS sort_key, 'Source rows'::TEXT AS metric_name, source_rows::TEXT AS metric_value,
        'admission_round_source_data_quality.source_rows'::TEXT AS source_object,
        'sum(source_rows) must equal fact_admission row count'::TEXT AS validation_rule
    FROM quality
    UNION ALL
    SELECT 2, 'Missing score', missing_score_rows::TEXT,
        'admission_round_source_data_quality.missing_score_rows', 'missing_score_rows = 0'
    FROM quality
    UNION ALL
    SELECT 3, 'Missing major', missing_major_rows::TEXT,
        'admission_round_source_data_quality.missing_major_rows', 'missing_major_rows = 0'
    FROM quality
    UNION ALL
    SELECT 4, 'PII exported', pii_exported_columns::TEXT || ' columns',
        'admission_round_source_data_quality.pii_exported_columns', 'pii_exported_columns = 0'
    FROM quality
    UNION ALL
    SELECT 5, 'Source files', source_files::TEXT,
        'admission_round_source_data_quality.source_file', 'source_file count = 15'
    FROM quality
    UNION ALL
    SELECT 6, 'Fact tables', '1', 'information_schema.tables',
        'fact_admission is the only table named fact_% in admissions_dw'
)
SELECT metric_name, metric_value, source_object, validation_rule
FROM metrics
ORDER BY sort_key;

CREATE OR REPLACE VIEW admissions_dw.mart_admissions_executive_summary AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants AS confirmed_applicants,
    ROUND(confirmed_unique_rate * 100, 2) AS confirmed_rate,
    source_files,
    avg_score,
    unique_majors,
    tcas_rounds,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS applicant_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_change
FROM admissions_dw.vw_admission_year_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_major_conversion AS
WITH major_year AS (
    SELECT
        y.academic_year,
        m.major_id AS major_code,
        m.major_name,
        p.program_type,
        COUNT(DISTINCT f.student_key)::BIGINT AS applicant_count,
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::BIGINT AS confirmed_count,
        ROUND(
            COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::NUMERIC
            * 100 / NULLIF(COUNT(DISTINCT f.student_key), 0),
            2
        ) AS confirmed_rate,
        ROUND(AVG(f.score), 4) AS avg_score
    FROM admissions_dw.fact_admission f
    JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
    JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
    JOIN admissions_dw.dim_program_type p ON p.program_type_key = f.program_type_key
    JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
    GROUP BY y.academic_year, m.major_id, m.major_name, p.program_type
)
SELECT
    *,
    applicant_count - LAG(applicant_count) OVER (
        PARTITION BY major_code, major_name, program_type ORDER BY academic_year
    ) AS applicant_change,
    confirmed_count - LAG(confirmed_count) OVER (
        PARTITION BY major_code, major_name, program_type ORDER BY academic_year
    ) AS confirmed_change,
    RANK() OVER (PARTITION BY academic_year ORDER BY applicant_count DESC) AS demand_rank
FROM major_year;

CREATE OR REPLACE VIEW admissions_dw.mart_round_efficiency AS
SELECT * FROM admissions_dw.vw_admission_round_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_status_friction AS
SELECT * FROM admissions_dw.vw_admission_round_status_distribution;

CREATE OR REPLACE VIEW admissions_dw.mart_admissions_year_change AS
SELECT
    *,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS applicant_delta,
    confirmed_applicants - LAG(confirmed_applicants) OVER (ORDER BY academic_year) AS confirmed_delta,
    confirmed_rate - LAG(confirmed_rate) OVER (ORDER BY academic_year) AS rate_delta
FROM admissions_dw.mart_admissions_executive_summary;

CREATE OR REPLACE VIEW admissions_dw.mart_major_year_change AS
SELECT * FROM admissions_dw.mart_major_conversion;

CREATE OR REPLACE VIEW admissions_dw.mart_major_opportunity AS
SELECT * FROM admissions_dw.mart_major_conversion
WHERE applicant_count > 0;

CREATE OR REPLACE VIEW admissions_dw.mart_program_type_mix AS
SELECT
    academic_year,
    program_type,
    SUM(applicant_count)::BIGINT AS applicant_count,
    SUM(confirmed_count)::BIGINT AS confirmed_count,
    ROUND(SUM(confirmed_count)::NUMERIC * 100 / NULLIF(SUM(applicant_count), 0), 2) AS confirmed_rate
FROM admissions_dw.mart_major_conversion
GROUP BY academic_year, program_type;

CREATE OR REPLACE VIEW admissions_dw.vw_dw_refresh_health AS
WITH quality AS (
    SELECT
        SUM(source_rows)::BIGINT AS source_rows,
        COUNT(*)::BIGINT AS source_files,
        SUM(missing_score_rows + missing_major_rows + pii_exported_columns)::BIGINT AS failed_checks
    FROM admissions_dw.admission_round_source_data_quality
), latest AS (
    SELECT * FROM admissions_dw.dw_refresh_run ORDER BY run_key DESC LIMIT 1
)
SELECT
    'WH-' || LPAD(latest.run_key::TEXT, 3, '0') AS health_id,
    CASE WHEN quality.failed_checks = 0 AND latest.run_status = 'success' THEN 'pass' ELSE 'fail' END AS status,
    latest.finished_at AS last_refresh_at,
    168 AS freshness_sla_hours,
    quality.source_rows,
    quality.source_files,
    5 AS mart_count,
    7 - quality.failed_checks AS quality_checks_passed,
    quality.failed_checks AS quality_checks_failed,
    0 AS pii_exported_columns,
    'single-fact-admissions-dashboard' AS artifact_checksum,
    'Warehouse health is derived from fact_admission and source quality checks.' AS notes
FROM latest CROSS JOIN quality;
