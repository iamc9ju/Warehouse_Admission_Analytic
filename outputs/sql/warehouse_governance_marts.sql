CREATE SCHEMA IF NOT EXISTS admissions_dw;

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
    confirmed_unique_applicants - LAG(confirmed_unique_applicants) OVER (ORDER BY academic_year) AS confirmed_change,
    resigned_unique_applicants AS resigned_applicants,
    eligible_unique_applicants AS eligible_applicants
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
        ROUND(AVG(f.score), 4) AS avg_score,
        COUNT(*)::BIGINT AS application_choices,
        COUNT(DISTINCT f.student_key) FILTER (
            WHERE s.tcas_status IN (
                'ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2',
                'ยืนยันที่อื่นแล้ว', 'ไม่ใช้สิทธิ์', 'ผ่านการคัดเลือก',
                'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'
            )
        )::BIGINT AS eligible_count
    FROM admissions_dw.fact_admission f
    JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
    JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
    JOIN admissions_dw.dim_program_type p ON p.program_type_key = f.program_type_key
    JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
    GROUP BY y.academic_year, m.major_id, m.major_name, p.program_type
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
    COALESCE(applicant_count - LAG(applicant_count) OVER (
        PARTITION BY major_code, major_name, program_type ORDER BY academic_year
    ), 0) AS applicant_change,
    COALESCE(confirmed_count - LAG(confirmed_count) OVER (
        PARTITION BY major_code, major_name, program_type ORDER BY academic_year
    ), 0) AS confirmed_change,
    RANK() OVER (PARTITION BY academic_year ORDER BY applicant_count DESC) AS demand_rank,
    application_choices,
    eligible_count
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
