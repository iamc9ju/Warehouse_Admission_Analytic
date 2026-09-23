CREATE OR REPLACE VIEW admissions_dw.mart_major_conversion AS
WITH major_year AS (
    SELECT
        y.academic_year,
        m.major_key,
        m.major_id AS major_code,
        m.major_name,
        m.major_type AS program_type,
        COUNT(DISTINCT f.student_key)::BIGINT AS applicant_count,
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::BIGINT AS confirmed_count,
        ROUND(
            COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::NUMERIC
            * 100 / NULLIF(COUNT(DISTINCT f.student_key), 0), 2
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
    JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
    GROUP BY m.major_key, y.academic_year, m.major_id, m.major_name, m.major_type
)
SELECT
    academic_year, major_code, major_name, program_type,
    applicant_count, confirmed_count, confirmed_rate, avg_score,
    COALESCE(applicant_count - LAG(applicant_count) OVER (
        PARTITION BY major_key ORDER BY academic_year
    ), 0) AS applicant_change,
    COALESCE(confirmed_count - LAG(confirmed_count) OVER (
        PARTITION BY major_key ORDER BY academic_year
    ), 0) AS confirmed_change,
    RANK() OVER (PARTITION BY academic_year ORDER BY applicant_count DESC) AS demand_rank,
    application_choices,
    eligible_count,
    major_key
FROM major_year;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_major_status_distribution AS
SELECT
    y.academic_year,
    m.major_id AS major_code,
    m.major_name,
    s.tcas_status,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    m.major_key
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY m.major_key, y.academic_year, m.major_id, m.major_name, s.tcas_status;

CREATE OR REPLACE VIEW admissions_dw.mart_major_round_conversion AS
SELECT
    y.academic_year,
    r.tcas_round_code,
    r.tcas_round_name,
    m.major_id,
    m.major_name,
    m.major_type AS program_type,
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
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name, m.major_id, m.major_name, m.major_type;
