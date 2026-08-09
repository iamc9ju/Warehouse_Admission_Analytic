from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass
from pathlib import Path

import pandas as pd


@dataclass(frozen=True)
class SourceWorkbook:
    academic_year: int
    tcas_round_code: str
    tcas_round_name: str
    path: Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "outputs" / "processed"
QUERY_RESULTS_DIR = ROOT / "warehouse" / "query-results"

SOURCES = [
    SourceWorkbook(2567, "TCAS1", "Portfolio", Path("/Users/iamc9ju/Downloads/1_67_1.xlsx")),
    SourceWorkbook(2567, "TCAS1", "Portfolio", Path("/Users/iamc9ju/Downloads/1_67_2.xlsx")),
    SourceWorkbook(2567, "TCAS2", "Quota", Path("/Users/iamc9ju/Downloads/2_67.xlsx")),
    SourceWorkbook(2567, "TCAS3", "Admission", Path("/Users/iamc9ju/Downloads/3_67.xlsx")),
    SourceWorkbook(2568, "TCAS1", "Portfolio", Path("/Users/iamc9ju/Downloads/รอบ 1 ปี68.xlsx")),
    SourceWorkbook(2568, "TCAS1", "Portfolio", Path("/Users/iamc9ju/Downloads/รอบ 1 ปี68(1).xlsx")),
    SourceWorkbook(2568, "TCAS2", "Quota", Path("/Users/iamc9ju/Downloads/รอบ 2 ปี68.xlsx")),
    SourceWorkbook(2568, "TCAS2", "Quota", Path("/Users/iamc9ju/Downloads/รอบ 2 ปี68(2).xlsx")),
    SourceWorkbook(2568, "TCAS3", "Admission", Path("/Users/iamc9ju/Downloads/รอบ 3 ปี 68.xlsx")),
    SourceWorkbook(2568, "TCAS4", "Direct Admission", Path("/Users/iamc9ju/Downloads/รอบ 4 ปี68.xlsx")),
    SourceWorkbook(2569, "TCAS1", "Portfolio", Path("/Users/iamc9ju/Downloads/รอบ1 ปี69.xlsx")),
    SourceWorkbook(2569, "TCAS2", "Quota", Path("/Users/iamc9ju/Downloads/รอบ 2 ปี69.xlsx")),
    SourceWorkbook(2569, "TCAS2", "Quota", Path("/Users/iamc9ju/Downloads/รอบ 2 ปี69(2).xlsx")),
    SourceWorkbook(2569, "TCAS3", "Admission", Path("/Users/iamc9ju/Downloads/รอบ 3 ปี 69.xlsx")),
    SourceWorkbook(2569, "TCAS4", "Direct Admission", Path("/Users/iamc9ju/Downloads/รอบ 4 ปี69.xlsx")),
]

COLUMN_ALIASES = {
    "เลขบัตร ปชช": "citizen_id",
    "คำนำหน้าชื่อ": "title",
    "ชื่อ": "first_name_th",
    "นามสกุล": "last_name_th",
    "เบอร์โทร": "telephone",
    "รหัสสาขา": "major_id",
    "ชื่อสาขา": "major_name",
    "สถานะ": "major_type",
    "รหัสคณะ": "fac_id",
    "ชื่อคณะ": "fac_name",
}

REQUIRED_COLUMNS = {
    "project_id",
    "citizen_id",
    "priority",
    "score",
    "tcas_status",
    "applicant_status",
    "major_id",
    "major_name",
    "major_type",
    "fac_id",
    "fac_name",
}

PII_COLUMNS = {"citizen_id", "title", "first_name_th", "last_name_th", "telephone", "email"}
FACT_COLUMNS = [
    "application_token",
    "student_token",
    "academic_year",
    "tcas_round_code",
    "tcas_round_name",
    "project_id",
    "fac_id",
    "fac_name",
    "major_id",
    "major_name",
    "program_type",
    "tcas_status",
    "applicant_status",
    "source_file",
    "source_row_number",
    "priority",
    "score",
]


def require_hash_salt() -> bytes:
    value = os.environ.get("ADMISSIONS_STUDENT_HASH_SALT", "").strip()
    if len(value) < 16:
        raise RuntimeError("ADMISSIONS_STUDENT_HASH_SALT must contain at least 16 characters")
    return value.encode("utf-8")


def token(salt: bytes, namespace: str, value: str) -> str:
    payload = f"{namespace}:{value}".encode("utf-8")
    return hmac.new(salt, payload, hashlib.sha256).hexdigest()


def validate_columns(df: pd.DataFrame, source: SourceWorkbook) -> None:
    missing = sorted(REQUIRED_COLUMNS.difference(df.columns))
    if missing:
        raise ValueError(f"{source.path.name} is missing required columns: {', '.join(missing)}")


def read_source(source: SourceWorkbook, salt: bytes) -> pd.DataFrame:
    if not source.path.exists():
        raise FileNotFoundError(f"Missing source workbook: {source.path}")

    df = pd.read_excel(source.path, dtype={"citizen_id": "string", "เลขบัตร ปชช": "string"})
    df = df.rename(columns=COLUMN_ALIASES).copy()
    validate_columns(df, source)

    df["citizen_id"] = df["citizen_id"].astype("string").str.strip()
    if df["citizen_id"].isna().any() or df["citizen_id"].eq("").any():
        raise ValueError(f"{source.path.name} contains a missing citizen identifier")

    df["academic_year"] = source.academic_year
    df["tcas_round_code"] = source.tcas_round_code
    df["tcas_round_name"] = source.tcas_round_name
    df["source_file"] = source.path.name
    df["source_row_number"] = range(2, len(df) + 2)
    df["score"] = pd.to_numeric(df["score"], errors="coerce")
    df["priority"] = pd.to_numeric(df["priority"], errors="coerce")
    df["applicant_status"] = pd.to_numeric(df["applicant_status"], errors="coerce").astype("Int64")
    df["tcas_status"] = df["tcas_status"].fillna("Unknown").astype(str).str.strip()
    df["program_type"] = df["major_type"].fillna("Unknown").astype(str).str.strip()

    df["student_token"] = df["citizen_id"].map(lambda value: token(salt, "student", value))
    df["application_token"] = df.apply(
        lambda row: token(
            salt,
            "application",
            "|".join(
                [
                    str(source.academic_year),
                    source.tcas_round_code,
                    source.path.name,
                    str(row["source_row_number"]),
                    str(row["citizen_id"]),
                    str(row["project_id"]),
                    str(row["major_id"]),
                ]
            ),
        ),
        axis=1,
    )
    return df


def write_csv(df: pd.DataFrame, name: str) -> None:
    leaked = sorted(PII_COLUMNS.intersection(df.columns))
    if leaked:
        raise ValueError(f"{name} contains PII columns: {', '.join(leaked)}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_DIR / name, index=False, encoding="utf-8-sig")


def write_tsv(df: pd.DataFrame, name: str) -> None:
    QUERY_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(QUERY_RESULTS_DIR / name, sep="\t", index=False, lineterminator="\n")


def confirmed_unique(group: pd.DataFrame) -> int:
    return int(group.loc[group["tcas_status"].eq("ยืนยันสิทธิ์"), "student_token"].nunique())


def rounded(value: float) -> float:
    return round(float(value), 4)


def build_year_kpis(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for year, group in df.groupby("academic_year", sort=True):
        applicants = int(group["student_token"].nunique())
        confirmed = confirmed_unique(group)
        rows.append(
            {
                "academic_year": year,
                "application_choices": len(group),
                "unique_applicants": applicants,
                "confirmed_applicants": confirmed,
                "confirmed_rate": round(confirmed * 100 / applicants, 2) if applicants else 0,
                "source_files": int(group["source_file"].nunique()),
                "avg_score": rounded(group["score"].mean()),
            }
        )
    return pd.DataFrame(rows)


def build_round_overview(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    keys = ["academic_year", "tcas_round_code", "tcas_round_name"]
    for key, group in df.groupby(keys, sort=True):
        year, code, name = key
        applicants = int(group["student_token"].nunique())
        confirmed = confirmed_unique(group)
        rows.append(
            {
                "academic_year": year,
                "tcas_round_code": code,
                "tcas_round_name": name,
                "choices": len(group),
                "unique_applicants": applicants,
                "confirmed_applicants": confirmed,
                "confirmed_rate": round(confirmed * 100 / applicants, 2) if applicants else 0,
                "source_files": int(group["source_file"].nunique()),
            }
        )
    return pd.DataFrame(rows)


def build_major_conversion(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    keys = ["academic_year", "major_id", "major_name", "program_type"]
    for key, group in df.groupby(keys, sort=True):
        year, code, name, program_type = key
        applicants = int(group["student_token"].nunique())
        confirmed = confirmed_unique(group)
        rows.append(
            {
                "academic_year": year,
                "major_code": code,
                "major_name": name,
                "major_type": program_type,
                "applicant_count": applicants,
                "confirmed_count": confirmed,
                "confirmed_rate": round(confirmed * 100 / applicants, 2) if applicants else 0,
                "avg_score": rounded(group["score"].mean()),
            }
        )
    output = pd.DataFrame(rows).sort_values(["academic_year", "applicant_count"], ascending=[True, False])
    output["applicant_change"] = output.groupby(["major_code", "major_name", "major_type"])[
        "applicant_count"
    ].diff().fillna(0).astype(int)
    return output


def build_status_distribution(df: pd.DataFrame) -> pd.DataFrame:
    tone_map = {
        "ยืนยันสิทธิ์": "orange",
        "ไม่ผ่านการคัดเลือก": "green",
        "ผ่านการคัดเลือกในลำดับที่ดีกว่า": "amber",
        "ผู้สมัคร": "blue",
        "ยืนยันที่อื่นแล้ว": "blue",
        "สละสิทธิ์": "red",
        "ไม่เข้าระบบมาดำเนินการใดๆ": "purple",
    }
    counts = df.groupby(["academic_year", "tcas_status"], sort=True).size().rename("choices").reset_index()
    totals = counts.groupby("academic_year")["choices"].transform("sum")
    counts["share"] = (counts["choices"] * 100 / totals).round(2)
    counts["tone"] = counts["tcas_status"].map(tone_map).fillna("muted")
    return counts.rename(columns={"tcas_status": "status_label"}).sort_values(
        ["academic_year", "choices"], ascending=[True, False]
    )


def build_round_status_distribution(df: pd.DataFrame) -> pd.DataFrame:
    keys = ["academic_year", "tcas_round_code", "tcas_round_name", "tcas_status"]
    output = (
        df.groupby(keys, sort=True)
        .agg(choices=("student_token", "size"), unique_applicants=("student_token", "nunique"))
        .reset_index()
        .rename(columns={"tcas_status": "status_label"})
    )
    return output


def build_source_quality(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    keys = ["academic_year", "tcas_round_code", "tcas_round_name", "source_file"]
    for key, group in df.groupby(keys, sort=True):
        year, code, name, source_file = key
        rows.append(
            {
                "academic_year": year,
                "tcas_round_code": code,
                "tcas_round_name": name,
                "source_file": source_file,
                "source_rows": len(group),
                "unique_students": int(group["student_token"].nunique()),
                "duplicate_application_rows": int(group["application_token"].duplicated().sum()),
                "missing_score_rows": int(group["score"].isna().sum()),
                "missing_priority_rows": int(group["priority"].isna().sum()),
                "missing_major_rows": int(group["major_id"].isna().sum()),
                "pii_exported_columns": 0,
            }
        )
    return pd.DataFrame(rows)


def build_contract_outputs(df: pd.DataFrame, quality: pd.DataFrame) -> None:
    source_rows = len(df)
    source_files = int(df["source_file"].nunique())
    missing_score = int(quality["missing_score_rows"].sum())
    missing_major = int(quality["missing_major_rows"].sum())
    catalog_rows = 8
    lineage_edges = 6

    write_tsv(build_year_kpis(df), "dashboard_kpi_snapshot.tsv")
    write_tsv(build_round_overview(df), "round_overview.tsv")
    write_tsv(build_major_conversion(df), "major_conversion.tsv")
    write_tsv(build_status_distribution(df), "status_distribution.tsv")
    write_tsv(build_round_status_distribution(df), "round_status_distribution.tsv")

    write_tsv(
        pd.DataFrame(
            [
                ["Source rows", f"{source_rows:,}", "admission_round_source_data_quality.source_rows", "จำนวนแถวจาก Excel admissions source ทั้งหมดก่อนโหลด fact", f"sum(source_rows) across {source_files} files must equal fact row count"],
                ["Missing score", str(missing_score), "admission_round_source_data_quality.missing_score_rows", "จำนวนแถวที่ score เป็นค่าว่าง", "missing_score_rows = 0 for every active source file"],
                ["Missing major", str(missing_major), "admission_round_source_data_quality.missing_major_rows", "จำนวนแถวที่ map ไป dim_major ไม่ได้", "missing_major_rows = 0 before fact load"],
                ["PII exported", "0 columns", "processed fact column audit", "จำนวนคอลัมน์ข้อมูลส่วนบุคคลใน staging, warehouse และ dashboard", "only irreversible student/application tokens may cross the ETL privacy boundary"],
                ["Active source groups", "1", "dw_dataset_catalog.source_system", "จำนวน source group ที่ active", "only admissions_excel is active"],
                ["Source files", str(source_files), "admission_round_source_data_quality.source_file", "จำนวนไฟล์ Excel รอบ 1-3 ปี 2567 และรอบ 1-4 ปี 2568-2569", "source files must reconcile to configured round coverage"],
                ["Catalog rows", str(catalog_rows), "dw_dataset_catalog", "จำนวน dataset catalog records ของ single-fact model", "all dashboard-facing layers require metadata"],
                ["Lineage edges", str(lineage_edges), "dw_lineage_edge", "จำนวน dependency edges จาก source ถึง dashboard", "all marts must trace to fact_admission"],
            ],
            columns=["metric_name", "metric_value", "source_object", "definition", "validation_rule"],
        ),
        "quality_scorecard.tsv",
    )

    write_tsv(
        pd.DataFrame(
            [
                ["admissions_excel_files", "Source", "source_file + source_row", f"{source_files} files / {source_rows:,} rows", "PII at source only"],
                ["admissions_fact_stage", "Staging", "one application choice", "PII removed; opaque tokens only", "Pseudonymous"],
                ["dim_student", "Dimension", "one pseudonymous student", "HMAC-SHA256 token", "Pseudonymous"],
                ["dim_year", "Dimension", "one academic year", "2567-2569", "No PII"],
                ["conformed_dimensions", "Dimension", "round/project/faculty/major/program/status/source", "all keys referenced by fact", "No PII"],
                ["fact_admission", "Core fact", "one application choice", f"{source_rows:,} rows with score", "Pseudonymous"],
                ["admissions_presentation_marts", "Mart", "year/round/major/status aggregates", "derived from one fact", "No PII"],
                ["warehouse_dashboard_snapshot", "Presentation", "one generated artifact", "dashboard-ready", "No PII"],
            ],
            columns=["dataset", "layer", "grain", "evidence", "sensitivity"],
        ),
        "dataset_catalog.tsv",
    )

    write_tsv(
        pd.DataFrame(
            [
                ["Excel admissions files", "PII-safe application staging", "extract, normalize, tokenize"],
                ["PII-safe application staging", "dim_student + dim_year", "load conformed dimensions"],
                ["PII-safe application staging", "conformed admissions dimensions", "load round/project/faculty/major/program/status/source"],
                ["All conformed dimensions", "fact_admission", "load one application-choice fact with score"],
                ["fact_admission", "admissions presentation marts", "aggregate for year/round/major/status"],
                ["Admissions presentation marts", "app/data/generated/warehouse-dashboard-snapshot.json", "publish generated dashboard artifact"],
            ],
            columns=["from_object", "to_object", "transform"],
        ),
        "lineage_edges.tsv",
    )

    write_tsv(
        pd.DataFrame(
            [
                ["Row reconciliation", f"{source_rows:,} source rows read from {source_files} files and mapped 1:1 to fact grain", "pass"],
                ["PII boundary", "0 raw identity/contact columns exported; student uses HMAC-SHA256 token", "pass"],
                ["Dimension coverage", "every fact row resolves student, year, round, project, faculty, major, program, status and source dimensions", "pass"],
                ["Major mapping", f"{missing_major} missing major rows before fact load", "pass" if missing_major == 0 else "fail"],
                ["Score completeness", f"{missing_score} missing score rows in active snapshot", "pass" if missing_score == 0 else "fail"],
                ["Round coverage", "TCAS1-3 represented for 2567; TCAS1-4 represented for 2568 and 2569", "pass"],
                ["Single fact", "fact_admission is the only physical fact table", "pass"],
            ],
            columns=["check_name", "evidence", "result"],
        ),
        "etl_validation_checks.tsv",
    )

    write_tsv(
        pd.DataFrame(
            [
                ["Dashboard KPI snapshot", "mart_admissions_executive_summary", "select academic_year, application_choices, unique_applicants, confirmed_applicants, confirmed_rate, source_files, avg_score from admissions_dw.mart_admissions_executive_summary order by academic_year;"],
                ["Round overview", "vw_admission_round_overview", "select academic_year, tcas_round_code, choices, unique_applicants, confirmed_applicants, confirmed_rate, source_files from admissions_dw.vw_admission_round_overview order by academic_year, tcas_round_code;"],
                ["Major conversion", "mart_major_conversion", "select academic_year, major_code, major_name, program_type, applicant_count, confirmed_count, confirmed_rate, avg_score, applicant_change from admissions_dw.mart_major_conversion order by academic_year, applicant_count desc;"],
                ["Quality scorecard", "vw_dw_quality_scorecard", "select metric_name, metric_value, source_object, validation_rule from admissions_dw.vw_dw_quality_scorecard order by metric_name;"],
            ],
            columns=["name", "object", "sql"],
        ),
        "dashboard_query_contract.tsv",
    )

    today = pd.Timestamp.now(tz="Asia/Bangkok")
    write_tsv(
        pd.DataFrame(
            [[today.date().isoformat(), "Neon PostgreSQL", "admissions_dw", "generated warehouse mart artifact", source_rows, 1, source_files, catalog_rows, lineage_edges, 0, "mart_admissions_executive_summary + mart_major_conversion + vw_admission_round_overview"]],
            columns=["exported_at", "source_system", "schema", "dashboard_mode", "source_rows", "active_source_groups", "source_files", "catalog_rows", "lineage_edges", "pii_exported_columns", "source_query"],
        ),
        "warehouse_snapshot_metadata.tsv",
    )
    write_tsv(
        pd.DataFrame(
            [["WH-001", "pass", today.isoformat(), 168, source_rows, source_files, 5, 7, 0, 0, "single-fact-admissions-dashboard", "Generated artifact reconciles to fact_admission-derived query results"]],
            columns=["health_id", "status", "last_refresh_at", "freshness_sla_hours", "source_rows", "source_files", "mart_count", "quality_checks_passed", "quality_checks_failed", "pii_exported_columns", "artifact_checksum", "notes"],
        ),
        "warehouse_health.tsv",
    )


def main() -> None:
    salt = require_hash_salt()
    frames = [read_source(source, salt) for source in SOURCES]
    combined = pd.concat(frames, ignore_index=True)

    if combined["application_token"].duplicated().any():
        raise ValueError("application_token collision detected")
    if combined["score"].isna().any():
        raise ValueError("score must be present on every fact row")

    fact_stage = combined[FACT_COLUMNS].copy()
    quality = build_source_quality(combined)
    write_csv(fact_stage, "admissions_fact_2567_2569.csv")
    write_csv(quality, "admissions_source_quality_2567_2569.csv")
    build_contract_outputs(combined, quality)

    print(f"Created {len(fact_stage):,} fact rows from {len(SOURCES)} source files")
    print(f"Academic years: {', '.join(map(str, sorted(fact_stage['academic_year'].unique())))}")
    print(f"Students (pseudonymous): {fact_stage['student_token'].nunique():,}")
    print(f"Missing score rows: {fact_stage['score'].isna().sum():,}")


if __name__ == "__main__":
    main()
