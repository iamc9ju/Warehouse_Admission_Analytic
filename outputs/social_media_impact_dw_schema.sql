-- Social Media Impact Analytics for Engineering Admissions
-- PostgreSQL star schema

CREATE SCHEMA IF NOT EXISTS engineering_admissions_dw;
SET search_path TO engineering_admissions_dw;

CREATE TABLE IF NOT EXISTS dim_time (
    time_key INTEGER PRIMARY KEY,
    full_date DATE NOT NULL UNIQUE,
    day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    month_number INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
    month_name VARCHAR(20) NOT NULL,
    quarter_number INTEGER NOT NULL CHECK (quarter_number BETWEEN 1 AND 4),
    calendar_year INTEGER NOT NULL,
    academic_year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_department (
    department_key SERIAL PRIMARY KEY,
    department_code VARCHAR(30) UNIQUE,
    department_name_th VARCHAR(255) NOT NULL,
    department_name_en VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dim_round (
    round_key SERIAL PRIMARY KEY,
    round_code VARCHAR(30) UNIQUE NOT NULL,
    round_name VARCHAR(255) NOT NULL,
    round_order INTEGER
);

CREATE TABLE IF NOT EXISTS dim_province (
    province_key SERIAL PRIMARY KEY,
    province_name_th VARCHAR(255) NOT NULL UNIQUE,
    province_name_en VARCHAR(255),
    region_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_platform (
    platform_key SERIAL PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL UNIQUE,
    platform_type VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_keyword (
    keyword_key SERIAL PRIMARY KEY,
    keyword_text VARCHAR(255) NOT NULL UNIQUE,
    keyword_group VARCHAR(100),
    related_department_key INTEGER REFERENCES dim_department(department_key)
);

CREATE TABLE IF NOT EXISTS dim_sentiment (
    sentiment_key SERIAL PRIMARY KEY,
    sentiment_label VARCHAR(30) NOT NULL UNIQUE,
    sentiment_score INTEGER NOT NULL CHECK (sentiment_score BETWEEN -1 AND 1)
);

CREATE TABLE IF NOT EXISTS fact_admission (
    admission_fact_key BIGSERIAL PRIMARY KEY,
    time_key INTEGER NOT NULL REFERENCES dim_time(time_key),
    department_key INTEGER NOT NULL REFERENCES dim_department(department_key),
    round_key INTEGER NOT NULL REFERENCES dim_round(round_key),
    province_key INTEGER NOT NULL REFERENCES dim_province(province_key),
    applicants INTEGER NOT NULL DEFAULT 0 CHECK (applicants >= 0),
    interview_passed INTEGER NOT NULL DEFAULT 0 CHECK (interview_passed >= 0),
    confirmed INTEGER NOT NULL DEFAULT 0 CHECK (confirmed >= 0),
    enrolled INTEGER NOT NULL DEFAULT 0 CHECK (enrolled >= 0),
    loaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fact_admission_non_increasing_funnel
        CHECK (
            interview_passed <= applicants
            AND confirmed <= interview_passed
            AND enrolled <= confirmed
        )
);

CREATE TABLE IF NOT EXISTS fact_social_media (
    social_fact_key BIGSERIAL PRIMARY KEY,
    time_key INTEGER NOT NULL REFERENCES dim_time(time_key),
    platform_key INTEGER NOT NULL REFERENCES dim_platform(platform_key),
    keyword_key INTEGER NOT NULL REFERENCES dim_keyword(keyword_key),
    department_key INTEGER REFERENCES dim_department(department_key),
    sentiment_key INTEGER NOT NULL REFERENCES dim_sentiment(sentiment_key),
    source_post_id VARCHAR(255),
    post_url TEXT,
    post_text TEXT,
    mention_count INTEGER NOT NULL DEFAULT 1 CHECK (mention_count >= 0),
    like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
    share_count INTEGER NOT NULL DEFAULT 0 CHECK (share_count >= 0),
    view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    engagement_score NUMERIC(18, 2) GENERATED ALWAYS AS (
        like_count + comment_count + share_count + view_count
    ) STORED,
    loaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fact_admission_time ON fact_admission(time_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_department ON fact_admission(department_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_round ON fact_admission(round_key);
CREATE INDEX IF NOT EXISTS idx_fact_admission_province ON fact_admission(province_key);

CREATE INDEX IF NOT EXISTS idx_fact_social_time ON fact_social_media(time_key);
CREATE INDEX IF NOT EXISTS idx_fact_social_platform ON fact_social_media(platform_key);
CREATE INDEX IF NOT EXISTS idx_fact_social_keyword ON fact_social_media(keyword_key);
CREATE INDEX IF NOT EXISTS idx_fact_social_department ON fact_social_media(department_key);
CREATE INDEX IF NOT EXISTS idx_fact_social_sentiment ON fact_social_media(sentiment_key);

CREATE OR REPLACE VIEW vw_admissions_kpi AS
SELECT
    t.academic_year,
    d.department_name_en,
    r.round_name,
    SUM(f.applicants) AS applicants,
    SUM(f.interview_passed) AS interview_passed,
    SUM(f.confirmed) AS confirmed,
    SUM(f.enrolled) AS enrolled,
    ROUND(SUM(f.interview_passed)::NUMERIC / NULLIF(SUM(f.applicants), 0), 4) AS interview_rate,
    ROUND(SUM(f.confirmed)::NUMERIC / NULLIF(SUM(f.interview_passed), 0), 4) AS confirmation_rate,
    ROUND(SUM(f.enrolled)::NUMERIC / NULLIF(SUM(f.confirmed), 0), 4) AS enrollment_rate
FROM fact_admission f
JOIN dim_time t ON f.time_key = t.time_key
JOIN dim_department d ON f.department_key = d.department_key
JOIN dim_round r ON f.round_key = r.round_key
GROUP BY t.academic_year, d.department_name_en, r.round_name;

CREATE OR REPLACE VIEW vw_social_media_kpi AS
SELECT
    t.calendar_year,
    t.month_number,
    p.platform_name,
    s.sentiment_label,
    SUM(f.mention_count) AS total_mentions,
    SUM(f.like_count) AS total_likes,
    SUM(f.comment_count) AS total_comments,
    SUM(f.share_count) AS total_shares,
    SUM(f.view_count) AS total_views,
    SUM(f.engagement_score) AS total_engagement
FROM fact_social_media f
JOIN dim_time t ON f.time_key = t.time_key
JOIN dim_platform p ON f.platform_key = p.platform_key
JOIN dim_sentiment s ON f.sentiment_key = s.sentiment_key
GROUP BY t.calendar_year, t.month_number, p.platform_name, s.sentiment_label;

CREATE OR REPLACE VIEW vw_monthly_admission_social_correlation AS
WITH admission_by_month AS (
    SELECT
        t.calendar_year,
        t.month_number,
        SUM(a.applicants) AS applicants
    FROM fact_admission a
    JOIN dim_time t ON a.time_key = t.time_key
    GROUP BY t.calendar_year, t.month_number
),
social_by_month AS (
    SELECT
        t.calendar_year,
        t.month_number,
        SUM(sm.mention_count) AS mentions,
        SUM(sm.engagement_score) AS engagement
    FROM fact_social_media sm
    JOIN dim_time t ON sm.time_key = t.time_key
    GROUP BY t.calendar_year, t.month_number
)
SELECT
    COALESCE(a.calendar_year, s.calendar_year) AS calendar_year,
    COALESCE(a.month_number, s.month_number) AS month_number,
    COALESCE(a.applicants, 0) AS applicants,
    COALESCE(s.mentions, 0) AS mentions,
    COALESCE(s.engagement, 0) AS engagement
FROM admission_by_month a
FULL OUTER JOIN social_by_month s
    ON a.calendar_year = s.calendar_year
   AND a.month_number = s.month_number;

INSERT INTO dim_sentiment (sentiment_label, sentiment_score)
VALUES
    ('Negative', -1),
    ('Neutral', 0),
    ('Positive', 1)
ON CONFLICT (sentiment_label) DO NOTHING;

INSERT INTO dim_platform (platform_name, platform_type)
VALUES
    ('Facebook', 'Social Network'),
    ('X', 'Microblogging'),
    ('Pantip', 'Forum'),
    ('TikTok', 'Short Video'),
    ('YouTube', 'Video'),
    ('Website', 'Web'),
    ('News', 'News')
ON CONFLICT (platform_name) DO NOTHING;
