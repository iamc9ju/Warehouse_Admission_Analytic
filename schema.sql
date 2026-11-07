-- ============================================================================
-- PostgreSQL Database Schema Dump
-- Database / Schema : admissions_dw (TCAS Admissions Data Warehouse & AI Analytics)
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS admissions_dw;
SET search_path TO admissions_dw, public;

-- ============================================================================
-- 1. DIMENSION TABLES
-- ============================================================================

-- Table: admissions_dw.dim_year
CREATE TABLE IF NOT EXISTS admissions_dw.dim_year (
    year_key BIGSERIAL PRIMARY KEY,
    academic_year INTEGER NOT NULL UNIQUE,
    CONSTRAINT dim_year_range CHECK (academic_year >= 2500 AND academic_year <= 2700)
);

-- Table: admissions_dw.dim_faculty
CREATE TABLE IF NOT EXISTS admissions_dw.dim_faculty (
    faculty_key BIGSERIAL PRIMARY KEY,
    fac_id TEXT NOT NULL UNIQUE,
    fac_name TEXT NOT NULL
);

-- Table: admissions_dw.dim_tcas_round
CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_round (
    round_key BIGSERIAL PRIMARY KEY,
    tcas_round_code TEXT NOT NULL UNIQUE,
    tcas_round_name TEXT NOT NULL
);

-- Table: admissions_dw.dim_major
CREATE TABLE IF NOT EXISTS admissions_dw.dim_major (
    major_key BIGSERIAL PRIMARY KEY,
    major_id TEXT NOT NULL,
    major_name TEXT NOT NULL,
    major_type TEXT NOT NULL,
    CONSTRAINT dim_major_unique UNIQUE (major_id, major_name, major_type)
);

-- Table: admissions_dw.dim_tcas_status
CREATE TABLE IF NOT EXISTS admissions_dw.dim_tcas_status (
    status_key BIGSERIAL PRIMARY KEY,
    tcas_status TEXT NOT NULL,
    applicant_status INTEGER,
    CONSTRAINT dim_tcas_status_unique UNIQUE NULLS NOT DISTINCT (tcas_status, applicant_status)
);

-- Table: admissions_dw.dim_student
CREATE TABLE IF NOT EXISTS admissions_dw.dim_student (
    student_key BIGSERIAL PRIMARY KEY,
    student_token CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dim_student_token_format CHECK (student_token ~ '^[0-9a-f]{64}$')
);

-- ============================================================================
-- 2. FACT TABLE
-- ============================================================================

-- Table: admissions_dw.fact_admission
CREATE TABLE IF NOT EXISTS admissions_dw.fact_admission (
    admission_key BIGSERIAL PRIMARY KEY,
    application_token CHAR(64) NOT NULL UNIQUE,
    student_key BIGINT NOT NULL REFERENCES admissions_dw.dim_student(student_key),
    year_key BIGINT NOT NULL REFERENCES admissions_dw.dim_year(year_key),
    round_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_round(round_key),
    faculty_key BIGINT NOT NULL REFERENCES admissions_dw.dim_faculty(faculty_key),
    major_key BIGINT NOT NULL REFERENCES admissions_dw.dim_major(major_key),
    status_key BIGINT NOT NULL REFERENCES admissions_dw.dim_tcas_status(status_key),
    source_row_number INTEGER NOT NULL,
    priority NUMERIC(10, 4),
    score NUMERIC(12, 4) NOT NULL,
    application_count SMALLINT NOT NULL DEFAULT 1,
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_file TEXT NOT NULL,
    CONSTRAINT fact_admission_application_count_check CHECK (application_count = 1),
    CONSTRAINT fact_admission_source_row_number_check CHECK (source_row_number >= 2),
    CONSTRAINT fact_admission_token_format CHECK (application_token ~ '^[0-9a-f]{64}$')
);

-- Fact Table Indexes
CREATE INDEX IF NOT EXISTS idx_fact_admission_year ON admissions_dw.fact_admission USING btree (year_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_round ON admissions_dw.fact_admission USING btree (round_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_major ON admissions_dw.fact_admission USING btree (major_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_status ON admissions_dw.fact_admission USING btree (status_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_student ON admissions_dw.fact_admission USING btree (student_key);

-- ============================================================================
-- 3. AI INTELLIGENCE &OPERATIONAL TABLES
-- ============================================================================

-- Table: admissions_dw.ai_analysis_reports
CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_reports (
    id UUID PRIMARY KEY,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    data_fingerprint TEXT NOT NULL,
    input_snapshot JSONB NOT NULL,
    content JSONB NOT NULL,
    CONSTRAINT ai_analysis_reports_check CHECK (end_year >= start_year)
);

CREATE INDEX IF NOT EXISTS ai_analysis_reports_scope_created
    ON admissions_dw.ai_analysis_reports USING btree (start_year, end_year, created_at DESC);

-- Table: admissions_dw.ai_analysis_jobs
CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_jobs (
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    owner UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (start_year, end_year)
);

-- ============================================================================
-- 4. BASE ANALYTICAL VIEWS (vw_*)
-- ============================================================================

-- View: admissions_dw.vw_admission_year_overview
CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_overview AS
SELECT
    y.academic_year,
    COUNT(*) AS application_choices,
    COUNT(DISTINCT f.student_key) AS unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text) AS confirmed_unique_applicants,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text)::numeric
        / NULLIF(COUNT(DISTINCT f.student_key), 0)::numeric,
        4
    ) AS confirmed_unique_rate,
    COUNT(DISTINCT f.major_key) AS unique_majors,
    COUNT(DISTINCT f.round_key) AS tcas_rounds,
    COUNT(DISTINCT f.source_file) AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status = ANY (ARRAY['สละสิทธิ์'::text, 'สละสิทธิ์ในรอบ 2'::text])
    ) AS resigned_unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status = ANY (ARRAY[
            'ยืนยันสิทธิ์'::text,
            'สละสิทธิ์'::text,
            'สละสิทธิ์ในรอบ 2'::text,
            'ยืนยันที่อื่นแล้ว'::text,
            'ไม่ใช้สิทธิ์'::text,
            'ผ่านการคัดเลือก'::text,
            'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'::text,
            'ไม่เข้าระบบมาดำเนินการใดๆ'::text
        ])
    ) AS eligible_unique_applicants
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year;

-- View: admissions_dw.vw_admission_round_overview
CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_overview AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    COUNT(*) AS choices,
    COUNT(DISTINCT f.student_key) AS unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text) AS confirmed_applicants,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text)::numeric * 100::numeric
        / NULLIF(COUNT(DISTINCT f.student_key), 0)::numeric,
        2
    ) AS confirmed_rate,
    COUNT(DISTINCT f.source_file) AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status = ANY (ARRAY[
            'ยืนยันสิทธิ์'::text,
            'สละสิทธิ์'::text,
            'สละสิทธิ์ในรอบ 2'::text,
            'ยืนยันที่อื่นแล้ว'::text,
            'ไม่ใช้สิทธิ์'::text,
            'ผ่านการคัดเลือก'::text,
            'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'::text,
            'ไม่เข้าระบบมาดำเนินการใดๆ'::text
        ])
    ) AS eligible_applicants
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name;

-- View: admissions_dw.vw_admission_round_status_distribution
CREATE OR REPLACE VIEW admissions_dw.vw_admission_round_status_distribution AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    s.tcas_status,
    s.tcas_status AS status_label,
    COUNT(*) AS application_choices,
    COUNT(*) AS choices,
    COUNT(DISTINCT f.student_key) AS unique_applicants,
    ROUND(
        COUNT(*)::numeric * 100::numeric
        / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY y.academic_year), 0::numeric),
        2
    ) AS share_pct,
    CASE
        WHEN s.tcas_status = 'ยืนยันสิทธิ์'::text THEN 'orange'::text
        WHEN s.tcas_status = 'ไม่ผ่านการคัดเลือก'::text THEN 'green'::text
        WHEN s.tcas_status = 'ผ่านการคัดเลือกในลำดับที่ดีกว่า'::text THEN 'amber'::text
        WHEN s.tcas_status = ANY (ARRAY['ผู้สมัคร'::text, 'ยืนยันที่อื่นแล้ว'::text]) THEN 'blue'::text
        WHEN s.tcas_status = 'สละสิทธิ์'::text THEN 'red'::text
        WHEN s.tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ'::text THEN 'purple'::text
        ELSE 'muted'::text
    END AS tone
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name, s.tcas_status;

-- View: admissions_dw.vw_admission_year_status_distribution
CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_status_distribution AS
SELECT
    y.academic_year,
    s.tcas_status,
    COUNT(*) AS application_choices,
    COUNT(DISTINCT f.student_key) AS unique_applicants,
    ROUND(
        COUNT(*)::numeric * 100::numeric
        / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY y.academic_year), 0::numeric),
        2
    ) AS choice_share_pct,
    CASE
        WHEN s.tcas_status = 'ยืนยันสิทธิ์'::text THEN 'orange'::text
        WHEN s.tcas_status = 'ไม่ผ่านการคัดเลือก'::text THEN 'green'::text
        WHEN s.tcas_status = 'ผ่านการคัดเลือกในลำดับที่ดีกว่า'::text THEN 'amber'::text
        WHEN s.tcas_status = ANY (ARRAY['ผู้สมัคร'::text, 'ยืนยันที่อื่นแล้ว'::text]) THEN 'blue'::text
        WHEN s.tcas_status = ANY (ARRAY['สละสิทธิ์'::text, 'สละสิทธิ์ในรอบ 2'::text]) THEN 'red'::text
        WHEN s.tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ'::text THEN 'purple'::text
        ELSE 'muted'::text
    END AS tone
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, s.tcas_status;

-- View: admissions_dw.vw_admission_major_status_distribution
CREATE OR REPLACE VIEW admissions_dw.vw_admission_major_status_distribution AS
SELECT
    y.academic_year,
    m.major_id AS major_code,
    m.major_name,
    s.tcas_status,
    COUNT(*) AS application_choices,
    COUNT(DISTINCT f.student_key) AS unique_applicants,
    m.major_key
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY m.major_key, y.academic_year, m.major_id, m.major_name, s.tcas_status;

-- ============================================================================
-- 5. ANALYTICAL DATA MARTS (mart_*)
-- ============================================================================

-- Mart: admissions_dw.mart_tcas_year_summary
CREATE OR REPLACE VIEW admissions_dw.mart_tcas_year_summary AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    ROUND(confirmed_unique_rate * 100::numeric, 2) AS confirmed_rate,
    unique_majors,
    tcas_rounds,
    source_files,
    avg_score,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS unique_applicants_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_applicants_change
FROM admissions_dw.vw_admission_year_overview;

-- Mart: admissions_dw.mart_tcas_round_summary
CREATE OR REPLACE VIEW admissions_dw.mart_tcas_round_summary AS
SELECT
    academic_year,
    tcas_round_code,
    tcas_round_name,
    choices,
    unique_applicants,
    confirmed_applicants,
    confirmed_rate,
    source_files,
    avg_score,
    eligible_applicants,
    unique_applicants - LAG(unique_applicants) OVER (PARTITION BY tcas_round_code ORDER BY academic_year) AS unique_applicants_change,
    confirmed_applicants - LAG(confirmed_applicants) OVER (PARTITION BY tcas_round_code ORDER BY academic_year) AS confirmed_applicants_change
FROM admissions_dw.vw_admission_round_overview;

-- Mart: admissions_dw.mart_major_round_conversion
CREATE OR REPLACE VIEW admissions_dw.mart_major_round_conversion AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    m.major_id,
    m.major_name,
    m.major_type AS program_type,
    COUNT(DISTINCT f.student_key) AS applicant_count,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text) AS confirmed_count,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text)::numeric * 100::numeric
        / NULLIF(COUNT(DISTINCT f.student_key), 0)::numeric,
        2
    ) AS confirmed_rate,
    ROUND(AVG(f.score), 4) AS avg_score
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name, m.major_id, m.major_name, m.major_type;

-- Mart: admissions_dw.mart_admissions_executive_summary
CREATE OR REPLACE VIEW admissions_dw.mart_admissions_executive_summary AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants AS confirmed_applicants,
    ROUND(confirmed_unique_rate * 100::numeric, 2) AS confirmed_rate,
    source_files,
    avg_score,
    unique_majors,
    tcas_rounds,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS applicant_change,
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_change,
    resigned_unique_applicants AS resigned_applicants,
    eligible_unique_applicants AS eligible_applicants
FROM admissions_dw.vw_admission_year_overview;

-- Mart: admissions_dw.mart_major_conversion
CREATE OR REPLACE VIEW admissions_dw.mart_major_conversion AS
WITH major_year AS (
    SELECT
        y.academic_year,
        m.major_key,
        m.major_id AS major_code,
        m.major_name,
        m.major_type AS program_type,
        COUNT(DISTINCT f.student_key) AS applicant_count,
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text) AS confirmed_count,
        ROUND(
            COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์'::text)::numeric * 100::numeric
            / NULLIF(COUNT(DISTINCT f.student_key), 0)::numeric,
            2
        ) AS confirmed_rate,
        ROUND(AVG(f.score), 4) AS avg_score,
        COUNT(*) AS application_choices,
        COUNT(DISTINCT f.student_key) FILTER (
            WHERE s.tcas_status = ANY (ARRAY[
                'ยืนยันสิทธิ์'::text,
                'สละสิทธิ์'::text,
                'สละสิทธิ์ในรอบ 2'::text,
                'ยืนยันที่อื่นแล้ว'::text,
                'ไม่ใช้สิทธิ์'::text,
                'ผ่านการคัดเลือก'::text,
                'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'::text,
                'ไม่เข้าระบบมาดำเนินการใดๆ'::text
            ])
        ) AS eligible_count
    FROM admissions_dw.fact_admission f
    JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
    JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
    JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
    GROUP BY m.major_key, y.academic_year, m.major_id, m.major_name, m.major_type
)
SELECT
    academic_year,
    major_code,
    major_name,
    program_type,
    applicant_count,
    confirmed_count,
    confirmed_rate,
    avg_score,
    COALESCE(applicant_count - LAG(applicant_count) OVER (PARTITION BY major_key ORDER BY academic_year), 0::bigint) AS applicant_change,
    COALESCE(confirmed_count - LAG(confirmed_count) OVER (PARTITION BY major_key ORDER BY academic_year), 0::bigint) AS confirmed_change,
    RANK() OVER (PARTITION BY academic_year ORDER BY applicant_count DESC) AS demand_rank,
    application_choices,
    eligible_count,
    major_key
FROM major_year;

-- Mart: admissions_dw.mart_round_efficiency
CREATE OR REPLACE VIEW admissions_dw.mart_round_efficiency AS
SELECT
    academic_year,
    tcas_round_code,
    tcas_round_name,
    choices,
    unique_applicants,
    confirmed_applicants,
    confirmed_rate,
    source_files,
    avg_score,
    eligible_applicants
FROM admissions_dw.vw_admission_round_overview;

-- Mart: admissions_dw.mart_status_friction
CREATE OR REPLACE VIEW admissions_dw.mart_status_friction AS
SELECT
    academic_year,
    tcas_round_code,
    tcas_round_name,
    tcas_status,
    status_label,
    application_choices,
    choices,
    unique_applicants,
    share_pct,
    tone
FROM admissions_dw.vw_admission_round_status_distribution;

-- Mart: admissions_dw.mart_admissions_year_change
CREATE OR REPLACE VIEW admissions_dw.mart_admissions_year_change AS
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_applicants,
    confirmed_rate,
    source_files,
    avg_score,
    unique_majors,
    tcas_rounds,
    applicant_change,
    confirmed_change,
    resigned_applicants,
    eligible_applicants,
    unique_applicants - LAG(unique_applicants) OVER (ORDER BY academic_year) AS applicant_delta,
    confirmed_applicants - LAG(confirmed_applicants) OVER (ORDER BY academic_year) AS confirmed_delta,
    confirmed_rate - LAG(confirmed_rate) OVER (ORDER BY academic_year) AS rate_delta
FROM admissions_dw.mart_admissions_executive_summary;

-- Mart: admissions_dw.mart_major_year_change
CREATE OR REPLACE VIEW admissions_dw.mart_major_year_change AS
SELECT
    academic_year,
    major_code,
    major_name,
    program_type,
    applicant_count,
    confirmed_count,
    confirmed_rate,
    avg_score,
    applicant_change,
    confirmed_change,
    demand_rank,
    application_choices,
    eligible_count
FROM admissions_dw.mart_major_conversion;

-- Mart: admissions_dw.mart_major_opportunity
CREATE OR REPLACE VIEW admissions_dw.mart_major_opportunity AS
SELECT
    academic_year,
    major_code,
    major_name,
    program_type,
    applicant_count,
    confirmed_count,
    confirmed_rate,
    avg_score,
    applicant_change,
    confirmed_change,
    demand_rank,
    application_choices,
    eligible_count
FROM admissions_dw.mart_major_conversion
WHERE applicant_count > 0;

-- Mart: admissions_dw.mart_program_type_mix
CREATE OR REPLACE VIEW admissions_dw.mart_program_type_mix AS
SELECT
    academic_year,
    program_type,
    SUM(applicant_count)::bigint AS applicant_count,
    SUM(confirmed_count)::bigint AS confirmed_count,
    ROUND(SUM(confirmed_count) * 100::numeric / NULLIF(SUM(applicant_count), 0::numeric), 2) AS confirmed_rate
FROM admissions_dw.mart_major_conversion
GROUP BY academic_year, program_type;
