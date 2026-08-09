CREATE SCHEMA IF NOT EXISTS admissions_dw;

-- Retire every legacy aggregate/secondary fact. fact_admission is the only active fact.
DROP TABLE IF EXISTS admissions_dw.fact_admission_round_major_summary CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_admission_round_year_summary CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_admission_round_status_summary CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_admission_year_overview CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_admission_round_overview CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_website_analytics_monthly CASCADE;
DROP TABLE IF EXISTS admissions_dw.fact_social_media_monthly_summary CASCADE;
DROP TABLE IF EXISTS admissions_dw.admission_round_data_quality CASCADE;

DROP TABLE IF EXISTS admissions_dw.dim_website_channel CASCADE;
DROP TABLE IF EXISTS admissions_dw.dim_website_landing_page CASCADE;
DROP TABLE IF EXISTS admissions_dw.dim_social_platform CASCADE;
DROP TABLE IF EXISTS admissions_dw.dim_social_keyword CASCADE;
DROP TABLE IF EXISTS admissions_dw.dim_sentiment CASCADE;

CREATE TABLE IF NOT EXISTS admissions_dw.dim_student (
    student_key BIGSERIAL PRIMARY KEY,
    student_token CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dim_student_token_format CHECK (student_token ~ '^[0-9a-f]{64}$')
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_year (
    year_key BIGSERIAL PRIMARY KEY,
    academic_year INTEGER NOT NULL UNIQUE,
    CONSTRAINT dim_year_range CHECK (academic_year BETWEEN 2500 AND 2700)
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_round (
    round_key BIGSERIAL PRIMARY KEY,
    tcas_round_code TEXT NOT NULL UNIQUE,
    tcas_round_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_project (
    project_key BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE
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

CREATE TABLE IF NOT EXISTS admissions_dw.dim_program_type (
    program_type_key BIGSERIAL PRIMARY KEY,
    program_type TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_status (
    status_key BIGSERIAL PRIMARY KEY,
    tcas_status TEXT NOT NULL,
    applicant_status INTEGER,
    CONSTRAINT dim_tcas_status_unique UNIQUE NULLS NOT DISTINCT (tcas_status, applicant_status)
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_source_file (
    source_file_key BIGSERIAL PRIMARY KEY,
    source_file TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission (
    admission_key BIGSERIAL PRIMARY KEY,
    application_token CHAR(64) NOT NULL UNIQUE,
    student_key BIGINT NOT NULL REFERENCES admissions_dw.dim_student(student_key),
    year_key BIGINT NOT NULL REFERENCES admissions_dw.dim_year(year_key),
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    project_key BIGINT NOT NULL REFERENCES admissions_dw.dim_project(project_key),
    faculty_key BIGINT NOT NULL REFERENCES admissions_dw.dim_faculty(faculty_key),
    major_key BIGINT NOT NULL REFERENCES admissions_dw.dim_major(major_key),
    program_type_key BIGINT NOT NULL REFERENCES admissions_dw.dim_program_type(program_type_key),
    status_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_status(status_key),
    source_file_key BIGINT NOT NULL REFERENCES admissions_dw.dim_source_file(source_file_key),
    source_row_number INTEGER NOT NULL CHECK (source_row_number >= 2),
    priority NUMERIC(10, 4),
    score NUMERIC(12, 4) NOT NULL,
    application_count SMALLINT NOT NULL DEFAULT 1 CHECK (application_count = 1),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_admission_token_format CHECK (application_token ~ '^[0-9a-f]{64}$')
);

CREATE TABLE IF NOT EXISTS admissions_dw.admission_round_source_data_quality (
    source_file TEXT PRIMARY KEY,
    academic_year INTEGER NOT NULL,
    tcas_round_code TEXT NOT NULL,
    tcas_round_name TEXT NOT NULL,
    source_rows INTEGER NOT NULL CHECK (source_rows >= 0),
    unique_students INTEGER NOT NULL CHECK (unique_students >= 0),
    duplicate_application_rows INTEGER NOT NULL CHECK (duplicate_application_rows >= 0),
    missing_score_rows INTEGER NOT NULL CHECK (missing_score_rows >= 0),
    missing_priority_rows INTEGER NOT NULL CHECK (missing_priority_rows >= 0),
    missing_major_rows INTEGER NOT NULL CHECK (missing_major_rows >= 0),
    pii_exported_columns INTEGER NOT NULL DEFAULT 0 CHECK (pii_exported_columns = 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_admission_year ON admissions_dw.fact_admission (year_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_round ON admissions_dw.fact_admission (round_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_major ON admissions_dw.fact_admission (major_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_status ON admissions_dw.fact_admission (status_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_student ON admissions_dw.fact_admission (student_key);

CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_overview AS
SELECT
    y.academic_year,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::BIGINT AS confirmed_unique_applicants,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::NUMERIC
        / NULLIF(COUNT(DISTINCT f.student_key), 0),
        4
    ) AS confirmed_unique_rate,
    COUNT(DISTINCT f.major_key)::BIGINT AS unique_majors,
    COUNT(DISTINCT f.round_key)::BIGINT AS tcas_rounds,
    COUNT(DISTINCT f.source_file_key)::BIGINT AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_overview AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    COUNT(*)::BIGINT AS choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::BIGINT AS confirmed_applicants,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::NUMERIC
        * 100 / NULLIF(COUNT(DISTINCT f.student_key), 0),
        2
    ) AS confirmed_rate,
    COUNT(DISTINCT f.source_file_key)::BIGINT AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_status_distribution AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    s.tcas_status,
    s.tcas_status AS status_label,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(*)::BIGINT AS choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    ROUND(
        COUNT(*)::NUMERIC * 100
        / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY y.academic_year), 0),
        2
    ) AS share_pct,
    CASE
        WHEN s.tcas_status = 'ยืนยันสิทธิ์' THEN 'orange'
        WHEN s.tcas_status = 'ไม่ผ่านการคัดเลือก' THEN 'green'
        WHEN s.tcas_status = 'ผ่านการคัดเลือกในลำดับที่ดีกว่า' THEN 'amber'
        WHEN s.tcas_status IN ('ผู้สมัคร', 'ยืนยันที่อื่นแล้ว') THEN 'blue'
        WHEN s.tcas_status = 'สละสิทธิ์' THEN 'red'
        WHEN s.tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ' THEN 'purple'
        ELSE 'muted'
    END AS tone
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name, s.tcas_status;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_source_quality AS
SELECT
    q.*,
    CASE
        WHEN q.source_rows > 0
         AND q.duplicate_application_rows = 0
         AND q.missing_score_rows = 0
         AND q.missing_major_rows = 0
         AND q.pii_exported_columns = 0
        THEN 'pass'
        ELSE 'review'
    END AS quality_status
FROM admissions_dw.admission_round_source_data_quality q;

CREATE OR REPLACE VIEW admissions_dw.mart_tcas_year_summary AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    ROUND(confirmed_unique_rate * 100, 2) AS confirmed_rate,
    unique_majors,
    tcas_rounds,
    source_files,
    avg_score,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_applicants_change
FROM admissions_dw.vw_admission_year_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_tcas_round_summary AS
SELECT
    *,
    unique_applicants - LAG(unique_applicants) OVER (
        PARTITION BY tcas_round_code ORDER BY academic_year
    ) AS unique_applicants_change,
    confirmed_applicants - LAG(confirmed_applicants) OVER (
        PARTITION BY tcas_round_code ORDER BY academic_year
    ) AS confirmed_applicants_change
FROM admissions_dw.vw_admission_round_overview;

CREATE OR REPLACE VIEW admissions_dw.mart_major_round_conversion AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    m.major_id,
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
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
JOIN admissions_dw.dim_program_type p ON p.program_type_key = f.program_type_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name, m.major_id, m.major_name, p.program_type;
