-- Dashboard metric contract:
--   people labels -> COUNT(DISTINCT student_key) at the displayed grain
--   choices/records -> COUNT(*) at the application-choice grain

CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_overview AS
SELECT
    y.academic_year,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::BIGINT AS confirmed_unique_applicants,
    ROUND(
        COUNT(DISTINCT f.student_key) FILTER (WHERE s.tcas_status = 'ยืนยันสิทธิ์')::NUMERIC
        / NULLIF(COUNT(DISTINCT f.student_key), 0), 4
    ) AS confirmed_unique_rate,
    COUNT(DISTINCT f.major_key)::BIGINT AS unique_majors,
    COUNT(DISTINCT f.round_key)::BIGINT AS tcas_rounds,
    COUNT(DISTINCT f.source_file_key)::BIGINT AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status IN ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2')
    )::BIGINT AS resigned_unique_applicants,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status IN (
            'ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2',
            'ยืนยันที่อื่นแล้ว', 'ไม่ใช้สิทธิ์', 'ผ่านการคัดเลือก',
            'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'
        )
    )::BIGINT AS eligible_unique_applicants
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
        * 100 / NULLIF(COUNT(DISTINCT f.student_key), 0), 2
    ) AS confirmed_rate,
    COUNT(DISTINCT f.source_file_key)::BIGINT AS source_files,
    ROUND(AVG(f.score), 4) AS avg_score,
    COUNT(DISTINCT f.student_key) FILTER (
        WHERE s.tcas_status IN (
            'ยืนยันสิทธิ์', 'สละสิทธิ์', 'สละสิทธิ์ในรอบ 2',
            'ยืนยันที่อื่นแล้ว', 'ไม่ใช้สิทธิ์', 'ผ่านการคัดเลือก',
            'ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2'
        )
    )::BIGINT AS eligible_applicants
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_round r ON r.round_key = f.round_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, r.tcas_round_code, r.tcas_round_name;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_year_status_distribution AS
SELECT
    y.academic_year,
    s.tcas_status,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants,
    ROUND(COUNT(*)::NUMERIC * 100 / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY y.academic_year), 0), 2) AS choice_share_pct,
    CASE
        WHEN s.tcas_status = 'ยืนยันสิทธิ์' THEN 'orange'
        WHEN s.tcas_status = 'ไม่ผ่านการคัดเลือก' THEN 'green'
        WHEN s.tcas_status = 'ผ่านการคัดเลือกในลำดับที่ดีกว่า' THEN 'amber'
        WHEN s.tcas_status IN ('ผู้สมัคร', 'ยืนยันที่อื่นแล้ว') THEN 'blue'
        WHEN s.tcas_status IN ('สละสิทธิ์', 'สละสิทธิ์ในรอบ 2') THEN 'red'
        WHEN s.tcas_status = 'ไม่เข้าระบบมาดำเนินการใดๆ' THEN 'purple'
        ELSE 'muted'
    END AS tone
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, s.tcas_status;

CREATE OR REPLACE VIEW admissions_dw.vw_admission_major_status_distribution AS
SELECT
    y.academic_year,
    m.major_id AS major_code,
    m.major_name,
    s.tcas_status,
    COUNT(*)::BIGINT AS application_choices,
    COUNT(DISTINCT f.student_key)::BIGINT AS unique_applicants
FROM admissions_dw.fact_admission f
JOIN admissions_dw.dim_year y ON y.year_key = f.year_key
JOIN admissions_dw.dim_major m ON m.major_key = f.major_key
JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
GROUP BY y.academic_year, m.major_id, m.major_name, s.tcas_status;

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
    JOIN admissions_dw.dim_program_type p ON p.program_type_key = f.program_type_key
    JOIN admissions_dw.dim_tcas_status s ON s.status_key = f.status_key
    GROUP BY y.academic_year, m.major_id, m.major_name, p.program_type
)
SELECT
    academic_year, major_code, major_name, program_type,
    applicant_count, confirmed_count, confirmed_rate, avg_score,
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

-- Governance-only pages were retired; remove their views and physical tables.
DROP VIEW IF EXISTS admissions_dw.vw_admission_source_quality;
DROP VIEW IF EXISTS admissions_dw.vw_dw_dataset_inventory;
DROP VIEW IF EXISTS admissions_dw.vw_dw_lineage_overview;
DROP VIEW IF EXISTS admissions_dw.vw_dw_table_row_counts;
DROP VIEW IF EXISTS admissions_dw.vw_dw_quality_scorecard;
DROP VIEW IF EXISTS admissions_dw.vw_dw_refresh_health;

DROP TABLE IF EXISTS admissions_dw.admission_round_source_data_quality;
DROP TABLE IF EXISTS admissions_dw.dw_dataset_catalog;
DROP TABLE IF EXISTS admissions_dw.dw_lineage_edge;
DROP TABLE IF EXISTS admissions_dw.dw_refresh_run;
