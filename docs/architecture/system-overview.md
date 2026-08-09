# System Overview

```text
Excel 2567-2569
  -> canonical column mapping
  -> HMAC tokenization and PII boundary
  -> application fact staging
  -> dimensions (student, year, round, project, faculty, major, program, status, source)
  -> fact_admission (one application choice + score)
  -> views/marts
  -> generated artifact or live server query
  -> dashboard routes
```

Dependency direction คือ source → staging → dimensions/single fact → marts → application
และห้าม application import source workbooks หรือ database credentials โดยตรง
