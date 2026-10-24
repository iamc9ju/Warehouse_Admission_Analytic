-- Additive migration: preserves all admissions facts, dimensions, and views.
CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_reports (
  id UUID PRIMARY KEY,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL CHECK (end_year >= start_year),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  data_fingerprint TEXT NOT NULL,
  input_snapshot JSONB NOT NULL,
  content JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_analysis_reports_scope_created
  ON admissions_dw.ai_analysis_reports (start_year, end_year, created_at DESC);

-- A cross-process lease stops duplicate generation for the same scope.
CREATE TABLE IF NOT EXISTS admissions_dw.ai_analysis_jobs (
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  owner UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (start_year, end_year)
);
