# Production Review Report

## Objective

TCAS Admissions Data Warehouse ใช้ admissions source data เพื่อสร้าง governed warehouse, quality gates, decision marts และ dashboard สำหรับตอบคำถามการวางแผนรับสมัครของคณะวิศวกรรมศาสตร์ กำแพงแสน

## Active Source Scope

- Admissions Excel files for TCAS1-4, academic years 2568 and 2569
- 11 source files
- 9,432 source rows
- No active social media ingestion
- PII is source-only and must not appear in processed outputs, Neon marts or dashboard artifacts

## Architecture

```text
Admissions source files
  -> ETL and PII-free aggregates
  -> admissions_dw facts and dimensions
  -> governed marts, quality scorecard and lineage
  -> business question / decision mart query results
  -> generated artifact or live Neon server-side adapter
  -> dashboard routes
```

## Business Questions

The production dashboard answers 15 business questions across 5 decision domains:

| Domain | Examples |
|---|---|
| Demand | demand drop, demand growth, high-demand low-conversion majors |
| Conversion | funnel friction, status share, high-fit low-awareness programs |
| Round Strategy | best converting round, high-volume low-conversion round, flagship round |
| Program Portfolio | quota review, normal vs special program mix |
| Data Trust | report readiness, critical quality gates, freshness SLA |

## Decision Outputs

| Insight | Decision use |
|---|---|
| High demand but low conversion: วิศวกรรมโยธา-โครงสร้างพื้นฐาน | Review offer competitiveness and communication flow |
| TCAS3 creates the strongest confirmed volume | Allocate operational effort around TCAS3 timing |
| Status friction is concentrated in not-selected choices | Review capacity, criteria and expectation setting |
| Applicants decreased while confirmed increased | Separate demand-generation actions from conversion actions |
| Dashboard data is decision-ready | Approve executive review artifact while preserving source evidence |
| วิศวกรรมเครื่องกล-เกษตร demand drop risk | Run recovery campaign and positioning review |
| วิศวกรรมอุตสาหการ-โลจิสติกส์ grows against trend | Expand high-performing logistics messaging |
| High conversion but low demand program | Increase targeted awareness |
| TCAS1 high volume but weak conversion | Strengthen post-shortlist communication |
| Special program tracking needed | Add program-type planning view |

## Quality Gates

| Gate | Required result |
|---|---|
| Source rows | 9,432 |
| Source files | 11 |
| Missing score | 0 |
| Missing major | 0 |
| PII exported | 0 columns |
| Active source groups | 1 |
| Round coverage | TCAS1-4 for 2568 and 2569 |
| ETL checks | all pass |

## Runtime

```text
Primary: server-side Neon adapter using DATABASE_URL
Fallback: generated warehouse dashboard artifact
```

The browser never receives database credentials.

## Limitations

- Current admissions scope covers two academic years, so trend output is descriptive.
- Generated artifact is fallback, not a replacement for warehouse refresh automation.
- Future production hardening should add scheduled refresh, alerting and environment separation for dev/staging/prod.
