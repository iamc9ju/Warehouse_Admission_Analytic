-- Social Media Analytics Queries
-- Note: sample social media data is synthetic and is used for demonstration.

SELECT
    academic_year,
    total_mentions,
    total_engagement,
    engagement_per_mention,
    weighted_sentiment_score
FROM admissions_dw.vw_social_media_year_overview
ORDER BY academic_year;

SELECT
    academic_year,
    platform_name,
    total_mentions,
    total_engagement,
    engagement_per_mention
FROM admissions_dw.vw_social_media_platform_summary
ORDER BY academic_year, total_mentions DESC;

SELECT
    academic_year,
    sentiment_label,
    total_mentions,
    mention_share
FROM admissions_dw.vw_social_media_sentiment_summary
ORDER BY academic_year, sentiment_score DESC;

SELECT
    academic_year,
    unique_applicants,
    confirmed_unique_applicants,
    confirmed_unique_rate,
    total_mentions,
    total_engagement,
    weighted_sentiment_score,
    mention_change,
    engagement_change,
    unique_applicants_change,
    confirmed_change
FROM admissions_dw.vw_social_admissions_year_correlation
ORDER BY academic_year;

