CREATE TABLE IF NOT EXISTS admissions_dw.dim_social_platform (
    platform_key BIGSERIAL PRIMARY KEY,
    platform_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_social_keyword (
    keyword_key BIGSERIAL PRIMARY KEY,
    keyword_group TEXT NOT NULL,
    keyword_text TEXT NOT NULL,
    major_id TEXT,
    major_name TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS dim_social_keyword_unique_idx
    ON admissions_dw.dim_social_keyword (keyword_group, keyword_text, COALESCE(major_id, ''));

CREATE TABLE IF NOT EXISTS admissions_dw.dim_sentiment (
    sentiment_key BIGSERIAL PRIMARY KEY,
    sentiment_label TEXT NOT NULL UNIQUE,
    sentiment_score INTEGER NOT NULL CHECK (sentiment_score BETWEEN -1 AND 1)
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_social_media_monthly_summary (
    academic_year INTEGER NOT NULL,
    calendar_month DATE NOT NULL,
    platform_key BIGINT NOT NULL REFERENCES admissions_dw.dim_social_platform(platform_key),
    keyword_key BIGINT NOT NULL REFERENCES admissions_dw.dim_social_keyword(keyword_key),
    sentiment_key BIGINT NOT NULL REFERENCES admissions_dw.dim_sentiment(sentiment_key),
    mention_count INTEGER NOT NULL CHECK (mention_count >= 0),
    like_count INTEGER NOT NULL CHECK (like_count >= 0),
    comment_count INTEGER NOT NULL CHECK (comment_count >= 0),
    share_count INTEGER NOT NULL CHECK (share_count >= 0),
    view_count INTEGER NOT NULL CHECK (view_count >= 0),
    engagement_count INTEGER GENERATED ALWAYS AS (
        like_count + comment_count + share_count + view_count
    ) STORED,
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_social_month_unique UNIQUE (
        academic_year,
        calendar_month,
        platform_key,
        keyword_key,
        sentiment_key
    )
);

CREATE INDEX IF NOT EXISTS idx_fact_social_month_year
    ON admissions_dw.fact_social_media_monthly_summary (academic_year);

CREATE INDEX IF NOT EXISTS idx_fact_social_month_platform
    ON admissions_dw.fact_social_media_monthly_summary (platform_key);

INSERT INTO admissions_dw.dim_sentiment (sentiment_label, sentiment_score)
VALUES
    ('Negative', -1),
    ('Neutral', 0),
    ('Positive', 1)
ON CONFLICT (sentiment_label) DO UPDATE
SET sentiment_score = EXCLUDED.sentiment_score;

CREATE OR REPLACE VIEW admissions_dw.vw_social_media_year_overview AS
SELECT
    f.academic_year,
    SUM(f.mention_count) AS total_mentions,
    SUM(f.engagement_count) AS total_engagement,
    SUM(f.like_count) AS total_likes,
    SUM(f.comment_count) AS total_comments,
    SUM(f.share_count) AS total_shares,
    SUM(f.view_count) AS total_views,
    ROUND(SUM(f.engagement_count)::NUMERIC / NULLIF(SUM(f.mention_count), 0), 2) AS engagement_per_mention,
    ROUND(
        SUM(f.mention_count * s.sentiment_score)::NUMERIC
        / NULLIF(SUM(f.mention_count), 0),
        4
    ) AS weighted_sentiment_score
FROM admissions_dw.fact_social_media_monthly_summary f
JOIN admissions_dw.dim_sentiment s ON f.sentiment_key = s.sentiment_key
GROUP BY f.academic_year;

CREATE OR REPLACE VIEW admissions_dw.vw_social_media_platform_summary AS
SELECT
    f.academic_year,
    p.platform_name,
    SUM(f.mention_count) AS total_mentions,
    SUM(f.engagement_count) AS total_engagement,
    ROUND(SUM(f.engagement_count)::NUMERIC / NULLIF(SUM(f.mention_count), 0), 2) AS engagement_per_mention
FROM admissions_dw.fact_social_media_monthly_summary f
JOIN admissions_dw.dim_social_platform p ON f.platform_key = p.platform_key
GROUP BY f.academic_year, p.platform_name;

CREATE OR REPLACE VIEW admissions_dw.vw_social_media_keyword_summary AS
SELECT
    f.academic_year,
    k.keyword_group,
    k.keyword_text,
    k.major_id,
    k.major_name,
    SUM(f.mention_count) AS total_mentions,
    SUM(f.engagement_count) AS total_engagement
FROM admissions_dw.fact_social_media_monthly_summary f
JOIN admissions_dw.dim_social_keyword k ON f.keyword_key = k.keyword_key
GROUP BY f.academic_year, k.keyword_group, k.keyword_text, k.major_id, k.major_name;

CREATE OR REPLACE VIEW admissions_dw.vw_social_media_sentiment_summary AS
SELECT
    f.academic_year,
    s.sentiment_label,
    s.sentiment_score,
    SUM(f.mention_count) AS total_mentions,
    ROUND(
        SUM(f.mention_count)::NUMERIC
        / NULLIF(SUM(SUM(f.mention_count)) OVER (PARTITION BY f.academic_year), 0),
        4
    ) AS mention_share
FROM admissions_dw.fact_social_media_monthly_summary f
JOIN admissions_dw.dim_sentiment s ON f.sentiment_key = s.sentiment_key
GROUP BY f.academic_year, s.sentiment_label, s.sentiment_score;

CREATE OR REPLACE VIEW admissions_dw.vw_social_admissions_year_correlation AS
SELECT
    a.academic_year,
    a.unique_applicants,
    a.confirmed_unique_applicants,
    a.confirmed_unique_rate,
    s.total_mentions,
    s.total_engagement,
    s.engagement_per_mention,
    s.weighted_sentiment_score,
    s.total_mentions - LAG(s.total_mentions) OVER (ORDER BY a.academic_year) AS mention_change,
    s.total_engagement - LAG(s.total_engagement) OVER (ORDER BY a.academic_year) AS engagement_change,
    a.unique_applicants - LAG(a.unique_applicants) OVER (ORDER BY a.academic_year) AS unique_applicants_change,
    a.confirmed_unique_applicants - LAG(a.confirmed_unique_applicants) OVER (ORDER BY a.academic_year) AS confirmed_change
FROM admissions_dw.vw_round3_year_overview a
JOIN admissions_dw.vw_social_media_year_overview s
    ON a.academic_year = s.academic_year;
