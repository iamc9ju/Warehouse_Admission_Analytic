CREATE TABLE IF NOT EXISTS admissions_dw.dim_website_channel (
    channel_key BIGSERIAL PRIMARY KEY,
    channel_group TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.dim_website_landing_page (
    landing_page_key BIGSERIAL PRIMARY KEY,
    landing_page TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS admissions_dw.fact_website_analytics_monthly (
    academic_year INTEGER NOT NULL,
    calendar_month DATE NOT NULL,
    channel_key BIGINT NOT NULL REFERENCES admissions_dw.dim_website_channel(channel_key),
    landing_page_key BIGINT NOT NULL REFERENCES admissions_dw.dim_website_landing_page(landing_page_key),
    sessions INTEGER NOT NULL CHECK (sessions >= 0),
    active_users INTEGER NOT NULL CHECK (active_users >= 0),
    total_users INTEGER NOT NULL CHECK (total_users >= 0),
    new_users INTEGER NOT NULL CHECK (new_users >= 0),
    screen_page_views INTEGER NOT NULL CHECK (screen_page_views >= 0),
    engaged_sessions INTEGER NOT NULL CHECK (engaged_sessions >= 0),
    engagement_rate NUMERIC(10, 6) NOT NULL CHECK (engagement_rate >= 0),
    event_count INTEGER NOT NULL CHECK (event_count >= 0),
    key_events NUMERIC(14, 4) NOT NULL CHECK (key_events >= 0),
    user_engagement_duration_seconds NUMERIC(14, 2) NOT NULL CHECK (user_engagement_duration_seconds >= 0),
    loaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fact_website_month_unique UNIQUE (
        academic_year,
        calendar_month,
        channel_key,
        landing_page_key
    )
);

CREATE INDEX IF NOT EXISTS idx_fact_website_year
    ON admissions_dw.fact_website_analytics_monthly (academic_year);

CREATE INDEX IF NOT EXISTS idx_fact_website_month
    ON admissions_dw.fact_website_analytics_monthly (calendar_month);

CREATE INDEX IF NOT EXISTS idx_fact_website_channel
    ON admissions_dw.fact_website_analytics_monthly (channel_key);

CREATE OR REPLACE VIEW admissions_dw.vw_website_analytics_year_overview AS
SELECT
    f.academic_year,
    SUM(f.sessions) AS total_sessions,
    SUM(f.active_users) AS total_active_users,
    SUM(f.total_users) AS total_users,
    SUM(f.new_users) AS total_new_users,
    SUM(f.screen_page_views) AS total_page_views,
    SUM(f.engaged_sessions) AS total_engaged_sessions,
    ROUND(SUM(f.engaged_sessions)::NUMERIC / NULLIF(SUM(f.sessions), 0), 4) AS weighted_engagement_rate,
    SUM(f.event_count) AS total_events,
    SUM(f.key_events) AS total_key_events,
    SUM(f.user_engagement_duration_seconds) AS total_engagement_seconds
FROM admissions_dw.fact_website_analytics_monthly f
GROUP BY f.academic_year;

CREATE OR REPLACE VIEW admissions_dw.vw_website_analytics_channel_summary AS
SELECT
    f.academic_year,
    c.channel_group,
    SUM(f.sessions) AS total_sessions,
    SUM(f.active_users) AS total_active_users,
    SUM(f.screen_page_views) AS total_page_views,
    SUM(f.engaged_sessions) AS total_engaged_sessions,
    ROUND(SUM(f.engaged_sessions)::NUMERIC / NULLIF(SUM(f.sessions), 0), 4) AS weighted_engagement_rate,
    SUM(f.key_events) AS total_key_events
FROM admissions_dw.fact_website_analytics_monthly f
JOIN admissions_dw.dim_website_channel c ON f.channel_key = c.channel_key
GROUP BY f.academic_year, c.channel_group;

CREATE OR REPLACE VIEW admissions_dw.vw_website_analytics_landing_page_summary AS
SELECT
    f.academic_year,
    p.landing_page,
    SUM(f.sessions) AS total_sessions,
    SUM(f.active_users) AS total_active_users,
    SUM(f.screen_page_views) AS total_page_views,
    SUM(f.engaged_sessions) AS total_engaged_sessions,
    ROUND(SUM(f.engaged_sessions)::NUMERIC / NULLIF(SUM(f.sessions), 0), 4) AS weighted_engagement_rate,
    SUM(f.key_events) AS total_key_events
FROM admissions_dw.fact_website_analytics_monthly f
JOIN admissions_dw.dim_website_landing_page p ON f.landing_page_key = p.landing_page_key
GROUP BY f.academic_year, p.landing_page;

CREATE OR REPLACE VIEW admissions_dw.vw_website_admissions_year_correlation AS
SELECT
    a.academic_year,
    a.unique_applicants,
    a.confirmed_unique_applicants,
    a.confirmed_unique_rate,
    w.total_sessions,
    w.total_active_users,
    w.total_page_views,
    w.total_engaged_sessions,
    w.weighted_engagement_rate,
    w.total_key_events,
    w.total_sessions - LAG(w.total_sessions) OVER (ORDER BY a.academic_year) AS session_change,
    w.total_page_views - LAG(w.total_page_views) OVER (ORDER BY a.academic_year) AS page_view_change,
    a.unique_applicants - LAG(a.unique_applicants) OVER (ORDER BY a.academic_year) AS unique_applicants_change,
    a.confirmed_unique_applicants - LAG(a.confirmed_unique_applicants) OVER (ORDER BY a.academic_year) AS confirmed_change
FROM admissions_dw.vw_round3_year_overview a
JOIN admissions_dw.vw_website_analytics_year_overview w
    ON a.academic_year = w.academic_year;
