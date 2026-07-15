CREATE SCHEMA IF NOT EXISTS admissions_dw;

ALTER TABLE admissions_dw.fact_admission_round_year_summary
    ADD COLUMN IF NOT EXISTS selected_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_rows >= 0),
    ADD COLUMN IF NOT EXISTS confirmed_elsewhere_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_elsewhere_rows >= 0),
    ADD COLUMN IF NOT EXISTS round2_surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (round2_surrendered_rows >= 0);

ALTER TABLE admissions_dw.fact_admission_round_major_summary
    ADD COLUMN IF NOT EXISTS selected_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_rows >= 0),
    ADD COLUMN IF NOT EXISTS confirmed_elsewhere_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_elsewhere_rows >= 0),
    ADD COLUMN IF NOT EXISTS round2_surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (round2_surrendered_rows >= 0);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission_round_overview (
    academic_year INTEGER NOT NULL,
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    application_choices INTEGER NOT NULL CHECK (application_choices >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    confirmed_unique_applicants INTEGER NOT NULL CHECK (confirmed_unique_applicants >= 0),
    unique_majors INTEGER NOT NULL CHECK (unique_majors >= 0),
    source_files INTEGER NOT NULL CHECK (source_files >= 0),
    avg_score NUMERIC(10, 4),
    applicant_rows INTEGER NOT NULL DEFAULT 0 CHECK (applicant_rows >= 0),
    selected_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_rows >= 0),
    excluded_second_processing_rows INTEGER NOT NULL DEFAULT 0 CHECK (excluded_second_processing_rows >= 0),
    selected_in_better_choice_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_in_better_choice_rows >= 0),
    confirmed_elsewhere_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_elsewhere_rows >= 0),
    confirmed_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_rows >= 0),
    surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (surrendered_rows >= 0),
    round2_surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (round2_surrendered_rows >= 0),
    rejected_rows INTEGER NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
    no_action_rows INTEGER NOT NULL DEFAULT 0 CHECK (no_action_rows >= 0),
    not_used_rows INTEGER NOT NULL DEFAULT 0 CHECK (not_used_rows >= 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_admission_round_overview_unique UNIQUE (academic_year, round_key)
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission_year_overview (
    academic_year INTEGER PRIMARY KEY,
    application_choices INTEGER NOT NULL CHECK (application_choices >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    confirmed_unique_applicants INTEGER NOT NULL CHECK (confirmed_unique_applicants >= 0),
    unique_majors INTEGER NOT NULL CHECK (unique_majors >= 0),
    tcas_rounds INTEGER NOT NULL CHECK (tcas_rounds >= 0),
    source_files INTEGER NOT NULL CHECK (source_files >= 0),
    avg_score NUMERIC(10, 4),
    applicant_rows INTEGER NOT NULL DEFAULT 0 CHECK (applicant_rows >= 0),
    selected_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_rows >= 0),
    excluded_second_processing_rows INTEGER NOT NULL DEFAULT 0 CHECK (excluded_second_processing_rows >= 0),
    selected_in_better_choice_rows INTEGER NOT NULL DEFAULT 0 CHECK (selected_in_better_choice_rows >= 0),
    confirmed_elsewhere_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_elsewhere_rows >= 0),
    confirmed_rows INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_rows >= 0),
    surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (surrendered_rows >= 0),
    round2_surrendered_rows INTEGER NOT NULL DEFAULT 0 CHECK (round2_surrendered_rows >= 0),
    rejected_rows INTEGER NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
    no_action_rows INTEGER NOT NULL DEFAULT 0 CHECK (no_action_rows >= 0),
    not_used_rows INTEGER NOT NULL DEFAULT 0 CHECK (not_used_rows >= 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admissions_dw.admission_round_source_data_quality (
    academic_year INTEGER NOT NULL,
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    source_file TEXT NOT NULL,
    source_rows INTEGER NOT NULL CHECK (source_rows >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    duplicate_applicant_rows INTEGER NOT NULL CHECK (duplicate_applicant_rows >= 0),
    missing_score_rows INTEGER NOT NULL CHECK (missing_score_rows >= 0),
    missing_priority_rows INTEGER NOT NULL CHECK (missing_priority_rows >= 0),
    missing_major_rows INTEGER NOT NULL CHECK (missing_major_rows >= 0),
    pii_columns_removed TEXT NOT NULL,
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admission_round_source_quality_unique UNIQUE (
        academic_year,
        round_key,
        source_file
    )
);

CREATE INDEX IF NOT EXISTS idx_fact_admission_round_overview_year
    ON admissions_dw.fact_admission_round_overview (academic_year);

CREATE INDEX IF NOT EXISTS idx_fact_admission_round_overview_round
    ON admissions_dw.fact_admission_round_overview (round_key);

CREATE INDEX IF NOT EXISTS idx_admission_round_source_quality_year
    ON admissions_dw.admission_round_source_data_quality (academic_year);

CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_overview AS
SELECT
    f.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    f.application_choices,
    f.unique_applicants,
    f.confirmed_unique_applicants,
    ROUND(f.confirmed_unique_applicants::NUMERIC / NULLIF(f.unique_applicants, 0), 4) AS confirmed_unique_rate,
    f.unique_majors,
    f.source_files,
    f.avg_score,
    f.applicant_rows,
    f.selected_rows,
    f.excluded_second_processing_rows,
    f.selected_in_better_choice_rows,
    f.confirmed_elsewhere_rows,
    f.confirmed_rows,
    f.surrendered_rows,
    f.round2_surrendered_rows,
    f.rejected_rows,
    f.no_action_rows,
    f.not_used_rows
FROM admissions_dw.fact_admission_round_overview f
JOIN admissions_dw.dim_tcas_round r ON f.round_key = r.round_key;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_overview AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    ROUND(confirmed_unique_applicants::NUMERIC / NULLIF(unique_applicants, 0), 4) AS confirmed_unique_rate,
    unique_majors,
    tcas_rounds,
    source_files,
    avg_score,
    applicant_rows,
    selected_rows,
    excluded_second_processing_rows,
    selected_in_better_choice_rows,
    confirmed_elsewhere_rows,
    confirmed_rows,
    surrendered_rows,
    round2_surrendered_rows,
    rejected_rows,
    no_action_rows,
    not_used_rows
FROM admissions_dw.fact_admission_year_overview;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_overview_all_rounds AS
SELECT
    academic_year,
    SUM(application_choices) AS application_choices,
    SUM(unique_applicants) AS round_level_unique_applicants,
    SUM(confirmed_unique_applicants) AS confirmed_unique_applicants,
    ROUND(
        SUM(confirmed_unique_applicants)::NUMERIC
        / NULLIF(SUM(unique_applicants), 0),
        4
    ) AS round_level_confirmed_rate,
    COUNT(*) AS tcas_rounds,
    SUM(source_files) AS source_files,
    SUM(unique_majors) AS round_major_slots
FROM admissions_dw.vw_admission_round_overview
GROUP BY academic_year;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_status_distribution AS
SELECT
    f.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    s.tcas_status,
    s.applicant_status,
    f.application_choices,
    f.unique_applicants,
    f.unique_majors,
    f.avg_score,
    ROUND(
        f.application_choices::NUMERIC
        / NULLIF(SUM(f.application_choices) OVER (PARTITION BY f.academic_year, f.round_key), 0),
        4
    ) AS application_choice_share
FROM admissions_dw.fact_admission_round_status_summary f
JOIN admissions_dw.dim_tcas_round r ON f.round_key = r.round_key
JOIN admissions_dw.dim_tcas_status s ON f.status_key = s.status_key;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_source_quality AS
SELECT
    q.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    q.source_file,
    q.source_rows,
    q.unique_applicants,
    q.duplicate_applicant_rows,
    q.missing_score_rows,
    q.missing_priority_rows,
    q.missing_major_rows,
    q.pii_columns_removed,
    CASE
        WHEN q.missing_major_rows = 0
            AND q.missing_priority_rows = 0
            AND q.source_rows > 0
        THEN 'pass'
        ELSE 'review'
    END AS quality_status
FROM admissions_dw.admission_round_source_data_quality q
JOIN admissions_dw.dim_tcas_round r ON q.round_key = r.round_key;

CREATE OR REPLACE VIEW admissions_dw.mart_tcas_round_summary AS
SELECT
    academic_year,
    tcas_round_code,
    tcas_round_name,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    unique_majors,
    source_files,
    avg_score,
    unique_applicants - LAG(unique_applicants) OVER (
        PARTITION BY tcas_round_code
        ORDER BY academic_year
    ) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (
        PARTITION BY tcas_round_code
        ORDER BY academic_year
    ) AS confirmed_unique_applicants_change
FROM admissions_dw.vw_admission_round_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_tcas_year_summary AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    unique_majors,
    tcas_rounds,
    source_files,
    avg_score,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_unique_applicants_change,
    application_choices - LAG(application_choices) OVER (ORDER BY academic_year) AS application_choices_change
FROM admissions_dw.vw_admission_year_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_major_round_conversion AS
SELECT
    academic_year,
    tcas_round_code,
    tcas_round_name,
    major_id,
    major_name,
    major_type,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score,
    RANK() OVER (
        PARTITION BY academic_year, tcas_round_code
        ORDER BY unique_applicants DESC
    ) AS demand_rank_in_round,
    RANK() OVER (
        PARTITION BY academic_year, tcas_round_code
        ORDER BY confirmed_unique_rate DESC NULLS LAST
    ) AS conversion_rank_in_round
FROM admissions_dw.vw_round3_major_performance;
