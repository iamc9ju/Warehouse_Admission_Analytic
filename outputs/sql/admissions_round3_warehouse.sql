CREATE SCHEMA IF NOT EXISTS admissions_dw;

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_round (
    round_key BIGSERIAL PRIMARY KEY,
    tcas_round_code TEXT NOT NULL UNIQUE,
    tcas_round_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_faculty (
    faculty_key BIGSERIAL PRIMARY KEY,
    fac_id TEXT NOT NULL UNIQUE,
    fac_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_major (
    major_key BIGSERIAL PRIMARY KEY,
    major_id TEXT NOT NULL,
    major_name TEXT NOT NULL,
    major_type TEXT NOT NULL,
    CONSTRAINT dim_major_unique UNIQUE (major_id, major_name, major_type)
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_status (
    status_key BIGSERIAL PRIMARY KEY,
    tcas_status TEXT NOT NULL,
    applicant_status INTEGER,
    CONSTRAINT dim_tcas_status_unique UNIQUE (tcas_status, applicant_status)
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission_round_major_summary (
    academic_year INTEGER NOT NULL,
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    project_id TEXT NOT NULL,
    faculty_key BIGINT NOT NULL REFERENCES admissions_dw.dim_faculty(faculty_key),
    major_key BIGINT NOT NULL REFERENCES admissions_dw.dim_major(major_key),
    application_choices INTEGER NOT NULL CHECK (application_choices >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    confirmed_unique_applicants INTEGER NOT NULL CHECK (confirmed_unique_applicants >= 0),
    applicant_status_1_rows INTEGER NOT NULL CHECK (applicant_status_1_rows >= 0),
    applicant_status_2_rows INTEGER NOT NULL CHECK (applicant_status_2_rows >= 0),
    applicant_status_3_rows INTEGER NOT NULL CHECK (applicant_status_3_rows >= 0),
    avg_score NUMERIC(10, 4),
    min_score NUMERIC(10, 4),
    max_score NUMERIC(10, 4),
    avg_priority NUMERIC(10, 4),
    min_priority INTEGER,
    max_priority INTEGER,
    applicant_rows INTEGER NOT NULL CHECK (applicant_rows >= 0),
    excluded_second_processing_rows INTEGER NOT NULL CHECK (excluded_second_processing_rows >= 0),
    selected_in_better_choice_rows INTEGER NOT NULL CHECK (selected_in_better_choice_rows >= 0),
    confirmed_rows INTEGER NOT NULL CHECK (confirmed_rows >= 0),
    surrendered_rows INTEGER NOT NULL CHECK (surrendered_rows >= 0),
    rejected_rows INTEGER NOT NULL CHECK (rejected_rows >= 0),
    no_action_rows INTEGER NOT NULL CHECK (no_action_rows >= 0),
    not_used_rows INTEGER NOT NULL CHECK (not_used_rows >= 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_round_major_unique UNIQUE (
        academic_year,
        round_key,
        project_id,
        faculty_key,
        major_key
    )
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission_round_year_summary (
    academic_year INTEGER NOT NULL,
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    project_id TEXT NOT NULL,
    faculty_key BIGINT NOT NULL REFERENCES admissions_dw.dim_faculty(faculty_key),
    application_choices INTEGER NOT NULL CHECK (application_choices >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    confirmed_unique_applicants INTEGER NOT NULL CHECK (confirmed_unique_applicants >= 0),
    unique_majors INTEGER NOT NULL CHECK (unique_majors >= 0),
    avg_score NUMERIC(10, 4),
    min_score NUMERIC(10, 4),
    max_score NUMERIC(10, 4),
    avg_priority NUMERIC(10, 4),
    applicant_rows INTEGER NOT NULL CHECK (applicant_rows >= 0),
    excluded_second_processing_rows INTEGER NOT NULL CHECK (excluded_second_processing_rows >= 0),
    selected_in_better_choice_rows INTEGER NOT NULL CHECK (selected_in_better_choice_rows >= 0),
    confirmed_rows INTEGER NOT NULL CHECK (confirmed_rows >= 0),
    surrendered_rows INTEGER NOT NULL CHECK (surrendered_rows >= 0),
    rejected_rows INTEGER NOT NULL CHECK (rejected_rows >= 0),
    no_action_rows INTEGER NOT NULL CHECK (no_action_rows >= 0),
    not_used_rows INTEGER NOT NULL CHECK (not_used_rows >= 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_round_year_unique UNIQUE (
        academic_year,
        round_key,
        project_id,
        faculty_key
    )
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission_round_status_summary (
    academic_year INTEGER NOT NULL,
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    status_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_status(status_key),
    application_choices INTEGER NOT NULL CHECK (application_choices >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    unique_majors INTEGER NOT NULL CHECK (unique_majors >= 0),
    avg_score NUMERIC(10, 4),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_round_status_unique UNIQUE (
        academic_year,
        round_key,
        status_key
    )
);

CREATE TABLE IF NOT EXISTS admissions_dw.admission_round_data_quality (
    academic_year INTEGER PRIMARY KEY,
    source_rows INTEGER NOT NULL CHECK (source_rows >= 0),
    unique_applicants INTEGER NOT NULL CHECK (unique_applicants >= 0),
    duplicate_applicant_rows INTEGER NOT NULL CHECK (duplicate_applicant_rows >= 0),
    missing_score_rows INTEGER NOT NULL CHECK (missing_score_rows >= 0),
    missing_priority_rows INTEGER NOT NULL CHECK (missing_priority_rows >= 0),
    missing_major_rows INTEGER NOT NULL CHECK (missing_major_rows >= 0),
    pii_columns_removed TEXT NOT NULL,
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_round_major_year
    ON admissions_dw.fact_admission_round_major_summary (academic_year);

CREATE INDEX IF NOT EXISTS idx_fact_round_major_major
    ON admissions_dw.fact_admission_round_major_summary (major_key);

CREATE INDEX IF NOT EXISTS idx_fact_round_status_year
    ON admissions_dw.fact_admission_round_status_summary (academic_year);

CREATE OR REPLACE VIEW admissions_dw.vw_round3_year_overview AS
SELECT
    f.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    fa.fac_id,
    fa.fac_name,
    f.application_choices,
    f.unique_applicants,
    f.confirmed_unique_applicants,
    ROUND(f.confirmed_unique_applicants::NUMERIC / NULLIF(f.unique_applicants, 0), 4) AS confirmed_unique_rate,
    f.unique_majors,
    f.avg_score,
    f.min_score,
    f.max_score,
    f.avg_priority,
    f.applicant_rows,
    f.selected_in_better_choice_rows,
    f.confirmed_rows,
    f.surrendered_rows,
    f.rejected_rows,
    f.no_action_rows,
    f.not_used_rows
FROM admissions_dw.fact_admission_round_year_summary f
JOIN admissions_dw.dim_tcas_round r ON f.round_key = r.round_key
JOIN admissions_dw.dim_faculty fa ON f.faculty_key = fa.faculty_key;

CREATE OR REPLACE VIEW admissions_dw.vw_round3_major_performance AS
SELECT
    f.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    fa.fac_id,
    fa.fac_name,
    m.major_id,
    m.major_name,
    m.major_type,
    f.application_choices,
    f.unique_applicants,
    f.confirmed_unique_applicants,
    ROUND(f.confirmed_unique_applicants::NUMERIC / NULLIF(f.unique_applicants, 0), 4) AS confirmed_unique_rate,
    f.avg_score,
    f.min_score,
    f.max_score,
    f.avg_priority,
    f.min_priority,
    f.max_priority,
    f.applicant_rows,
    f.selected_in_better_choice_rows,
    f.confirmed_rows,
    f.surrendered_rows,
    f.rejected_rows,
    f.no_action_rows,
    f.not_used_rows
FROM admissions_dw.fact_admission_round_major_summary f
JOIN admissions_dw.dim_tcas_round r ON f.round_key = r.round_key
JOIN admissions_dw.dim_faculty fa ON f.faculty_key = fa.faculty_key
JOIN admissions_dw.dim_major m ON f.major_key = m.major_key;

CREATE OR REPLACE VIEW admissions_dw.vw_round3_status_summary AS
SELECT
    f.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    s.tcas_status,
    s.applicant_status,
    f.application_choices,
    f.unique_applicants,
    f.unique_majors,
    f.avg_score
FROM admissions_dw.fact_admission_round_status_summary f
JOIN admissions_dw.dim_tcas_round r ON f.round_key = r.round_key
JOIN admissions_dw.dim_tcas_status s ON f.status_key = s.status_key;

CREATE OR REPLACE VIEW admissions_dw.vw_round3_year_comparison AS
WITH year_metrics AS (
    SELECT
        academic_year,
        application_choices,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate
    FROM admissions_dw.vw_round3_year_overview
)
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    application_choices - LAG(application_choices) OVER (ORDER BY academic_year) AS application_choices_change,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_unique_applicants_change
FROM year_metrics;
