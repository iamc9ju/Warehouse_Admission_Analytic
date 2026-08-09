# ADR 0001: Use One Application-Grain Admissions Fact

## Status

Accepted (supersedes the former aggregate-fact model)

## Decision

Use `fact_admission` as the only physical fact table. Its grain is one application choice
and it references every conformed dimension, including the new `dim_student` and `dim_year`.
Store `priority`, `score` and `application_count` in this fact. Derive all summaries through views.

Direct applicant identifiers never enter the warehouse; `dim_student` contains only a stable
HMAC-SHA256 token generated inside the ETL privacy boundary.
