-- Admissions Round 3 Analytics Queries
-- Schema: admissions_dw
-- Purpose: reusable SQL for dashboard/report analysis after loading TCAS round 3 data.

-- 1. Year overview
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score,
    min_score,
    max_score,
    avg_priority
FROM admissions_dw.vw_round3_year_overview
ORDER BY academic_year;

-- 2. Year-over-year comparison
SELECT
    academic_year,
    application_choices,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    application_choices_change,
    unique_applicants_change,
    confirmed_unique_applicants_change,
    ROUND(
        application_choices_change::NUMERIC
        / NULLIF(application_choices - application_choices_change, 0),
        4
    ) AS application_choices_growth_rate,
    ROUND(
        unique_applicants_change::NUMERIC
        / NULLIF(unique_applicants - unique_applicants_change, 0),
        4
    ) AS unique_applicants_growth_rate,
    ROUND(
        confirmed_unique_applicants_change::NUMERIC
        / NULLIF(confirmed_unique_applicants - confirmed_unique_applicants_change, 0),
        4
    ) AS confirmed_unique_applicants_growth_rate
FROM admissions_dw.vw_round3_year_comparison
ORDER BY academic_year;

-- 3. Top majors by unique applicants
SELECT
    academic_year,
    major_id,
    major_name,
    major_type,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score
FROM admissions_dw.vw_round3_major_performance
ORDER BY academic_year, unique_applicants DESC, major_id
LIMIT 20;

-- 4. Top majors by confirmed applicants
SELECT
    academic_year,
    major_id,
    major_name,
    major_type,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score
FROM admissions_dw.vw_round3_major_performance
ORDER BY academic_year, confirmed_unique_applicants DESC, unique_applicants DESC, major_id
LIMIT 20;

-- 5. Major year-over-year movement
WITH major_metrics AS (
    SELECT
        academic_year,
        major_id,
        major_name,
        major_type,
        unique_applicants,
        confirmed_unique_applicants,
        confirmed_unique_rate
    FROM admissions_dw.vw_round3_major_performance
)
SELECT
    current_year.major_id,
    current_year.major_name,
    current_year.major_type,
    previous_year.academic_year AS previous_academic_year,
    current_year.academic_year AS current_academic_year,
    previous_year.unique_applicants AS previous_unique_applicants,
    current_year.unique_applicants AS current_unique_applicants,
    current_year.unique_applicants - previous_year.unique_applicants AS unique_applicants_change,
    previous_year.confirmed_unique_applicants AS previous_confirmed_unique_applicants,
    current_year.confirmed_unique_applicants AS current_confirmed_unique_applicants,
    current_year.confirmed_unique_applicants - previous_year.confirmed_unique_applicants AS confirmed_unique_applicants_change,
    previous_year.confirmed_unique_rate AS previous_confirmed_unique_rate,
    current_year.confirmed_unique_rate AS current_confirmed_unique_rate,
    current_year.confirmed_unique_rate - previous_year.confirmed_unique_rate AS confirmed_unique_rate_change
FROM major_metrics current_year
JOIN major_metrics previous_year
    ON current_year.major_id = previous_year.major_id
   AND current_year.major_name = previous_year.major_name
   AND current_year.major_type = previous_year.major_type
   AND current_year.academic_year = previous_year.academic_year + 1
ORDER BY unique_applicants_change DESC, current_year.major_id;

-- 6. Status distribution by academic year
SELECT
    academic_year,
    tcas_status,
    applicant_status,
    application_choices,
    unique_applicants,
    ROUND(
        application_choices::NUMERIC
        / NULLIF(SUM(application_choices) OVER (PARTITION BY academic_year), 0),
        4
    ) AS application_choice_share,
    avg_score
FROM admissions_dw.vw_round3_status_summary
ORDER BY academic_year, application_choices DESC, tcas_status;

-- 7. Performance by major type
SELECT
    academic_year,
    major_type,
    SUM(application_choices) AS application_choices,
    SUM(unique_applicants) AS unique_applicants,
    SUM(confirmed_unique_applicants) AS confirmed_unique_applicants,
    ROUND(
        SUM(confirmed_unique_applicants)::NUMERIC
        / NULLIF(SUM(unique_applicants), 0),
        4
    ) AS confirmed_unique_rate,
    ROUND(AVG(avg_score), 4) AS avg_major_score
FROM admissions_dw.vw_round3_major_performance
GROUP BY academic_year, major_type
ORDER BY academic_year, unique_applicants DESC;

-- 8. Highest average score by major
SELECT
    academic_year,
    major_id,
    major_name,
    major_type,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    avg_score,
    min_score,
    max_score
FROM admissions_dw.vw_round3_major_performance
ORDER BY academic_year, avg_score DESC, unique_applicants DESC
LIMIT 20;

-- 9. Data quality summary
SELECT
    academic_year,
    source_rows,
    unique_applicants,
    duplicate_applicant_rows,
    missing_score_rows,
    missing_priority_rows,
    missing_major_rows,
    pii_columns_removed
FROM admissions_dw.admission_round_data_quality
ORDER BY academic_year;
