# YouTube Real Data Fetch Report

## Status

ดึงข้อมูลจริงจาก YouTube Data API สำเร็จแล้ว

## Output Files

- `outputs/real_data/youtube_mentions_monthly.csv`
- `outputs/real_data/youtube_videos.json`

## Fetch Result

| Metric | Value |
|---|---:|
| Raw videos | 79 |
| Monthly aggregate rows | 31 |
| Platform label in warehouse | YouTube API |

## Loaded to Neon

หลังโหลดเข้า Neon:

| Metric | Value |
|---|---:|
| Social fact rows | 59 |
| Platforms | 8 |
| Keywords | 14 |

## YouTube API Summary

| Academic Year | YouTube API Mentions | YouTube API Engagement |
|---:|---:|---:|
| 2568 | 40 | 259,372 |
| 2569 | 39 | 113,443 |

## Updated Social + Admissions Overview

| Academic Year | Total Mentions | Total Engagement | Unique Applicants | Confirmed Applicants | Confirmed Rate |
|---:|---:|---:|---:|---:|---:|
| 2568 | 797 | 890,244 | 1,810 | 214 | 11.82% |
| 2569 | 1,121 | 1,134,693 | 1,620 | 283 | 17.47% |

## Notes

- YouTube values are real API data from public videos returned by YouTube Data API search.
- Existing non-YouTube social rows are still synthetic demonstration data unless replaced with real platform collectors.
- API key was used only as an environment variable during fetch and was not written to project files.

