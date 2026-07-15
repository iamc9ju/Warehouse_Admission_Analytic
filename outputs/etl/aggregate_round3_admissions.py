from __future__ import annotations

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

SOURCES = [
    SourceWorkbook(
        academic_year=2568,
        tcas_round_code="TCAS3",
        tcas_round_name="Admission",
        path=Path("/Users/iamc9ju/Downloads/รอบ 3 ปี 68.xlsx"),
    ),
    SourceWorkbook(
        academic_year=2569,
        tcas_round_code="TCAS3",
        tcas_round_name="Admission",
        path=Path("/Users/iamc9ju/Downloads/รอบ 3 ปี 69.xlsx"),
    ),
]

REQUIRED_COLUMNS = {
    "project_id",
    "type",
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

STATUS_COLUMNS = {
    "ผู้สมัคร": "applicant_rows",
    "ยืนยันสิทธิ์": "confirmed_rows",
    "ไม่ผ่านการคัดเลือก": "rejected_rows",
    "ผ่านการคัดเลือกในลำดับที่ดีกว่า": "selected_in_better_choice_rows",
    "สละสิทธิ์": "surrendered_rows",
    "ไม่ใช้สิทธิ์": "not_used_rows",
    "ไม่เข้าระบบมาดำเนินการใดๆ": "no_action_rows",
    "ผ่านการคัดเลือกแต่ไม่นำมาประมวลผลรอบที่ 2": "excluded_second_processing_rows",
}

PII_COLUMNS = {
    "citizen_id",
    "title",
    "first_name_th",
    "last_name_th",
    "telephone",
    "email",
}


def validate_columns(df: pd.DataFrame, source: SourceWorkbook) -> None:
    missing_columns = sorted(REQUIRED_COLUMNS.difference(df.columns))
    if missing_columns:
        joined = ", ".join(missing_columns)
        raise ValueError(f"{source.path.name} is missing required columns: {joined}")


def read_source(source: SourceWorkbook) -> pd.DataFrame:
    df = pd.read_excel(source.path, dtype={"citizen_id": "string"})
    validate_columns(df, source)

    df = df.copy()
    df["academic_year"] = source.academic_year
    df["tcas_round_code"] = source.tcas_round_code
    df["tcas_round_name"] = source.tcas_round_name
    df["source_file"] = source.path.name
    df["score"] = pd.to_numeric(df["score"], errors="coerce")
    df["priority"] = pd.to_numeric(df["priority"], errors="coerce")
    df["tcas_status"] = df["tcas_status"].fillna("Unknown").astype(str)
    df["applicant_status"] = pd.to_numeric(df["applicant_status"], errors="coerce").astype("Int64")
    return df


def add_status_counts(grouped: pd.core.groupby.DataFrameGroupBy, output: pd.DataFrame) -> pd.DataFrame:
    status_counts = (
        grouped["tcas_status"]
        .value_counts()
        .unstack(fill_value=0)
        .rename(columns=STATUS_COLUMNS)
    )

    output = output.join(status_counts, how="left")
    for column in STATUS_COLUMNS.values():
        if column not in output.columns:
            output[column] = 0

    return output


def build_by_major(df: pd.DataFrame) -> pd.DataFrame:
    keys = [
        "academic_year",
        "tcas_round_code",
        "tcas_round_name",
        "project_id",
        "fac_id",
        "fac_name",
        "major_id",
        "major_name",
        "major_type",
    ]
    grouped = df.groupby(keys, dropna=False)

    output = grouped.agg(
        application_choices=("citizen_id", "size"),
        unique_applicants=("citizen_id", "nunique"),
        confirmed_unique_applicants=(
            "citizen_id",
            lambda values: values[df.loc[values.index, "tcas_status"].eq("ยืนยันสิทธิ์")].nunique(),
        ),
        applicant_status_1_rows=("applicant_status", lambda values: int((values == 1).sum())),
        applicant_status_2_rows=("applicant_status", lambda values: int((values == 2).sum())),
        applicant_status_3_rows=("applicant_status", lambda values: int((values == 3).sum())),
        avg_score=("score", "mean"),
        min_score=("score", "min"),
        max_score=("score", "max"),
        avg_priority=("priority", "mean"),
        min_priority=("priority", "min"),
        max_priority=("priority", "max"),
    )

    output = add_status_counts(grouped, output)
    output = output.reset_index()
    return format_numeric_columns(output)


def build_year_summary(df: pd.DataFrame) -> pd.DataFrame:
    keys = ["academic_year", "tcas_round_code", "tcas_round_name", "project_id", "fac_id", "fac_name"]
    grouped = df.groupby(keys, dropna=False)

    output = grouped.agg(
        application_choices=("citizen_id", "size"),
        unique_applicants=("citizen_id", "nunique"),
        confirmed_unique_applicants=(
            "citizen_id",
            lambda values: values[df.loc[values.index, "tcas_status"].eq("ยืนยันสิทธิ์")].nunique(),
        ),
        unique_majors=("major_id", "nunique"),
        avg_score=("score", "mean"),
        min_score=("score", "min"),
        max_score=("score", "max"),
        avg_priority=("priority", "mean"),
    )

    output = add_status_counts(grouped, output)
    output = output.reset_index()
    return format_numeric_columns(output)


def build_status_summary(df: pd.DataFrame) -> pd.DataFrame:
    keys = ["academic_year", "tcas_round_code", "tcas_round_name", "tcas_status", "applicant_status"]
    output = (
        df.groupby(keys, dropna=False)
        .agg(
            application_choices=("citizen_id", "size"),
            unique_applicants=("citizen_id", "nunique"),
            unique_majors=("major_id", "nunique"),
            avg_score=("score", "mean"),
        )
        .reset_index()
    )
    return format_numeric_columns(output)


def build_data_quality_summary(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for year, year_df in df.groupby("academic_year"):
        rows.append(
            {
                "academic_year": year,
                "source_rows": len(year_df),
                "unique_applicants": year_df["citizen_id"].nunique(),
                "duplicate_applicant_rows": len(year_df) - year_df["citizen_id"].nunique(),
                "missing_score_rows": int(year_df["score"].isna().sum()),
                "missing_priority_rows": int(year_df["priority"].isna().sum()),
                "missing_major_rows": int(year_df["major_id"].isna().sum()),
                "pii_columns_removed": ", ".join(sorted(PII_COLUMNS.intersection(year_df.columns))),
            }
        )
    return pd.DataFrame(rows)


def format_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    output = df.copy()
    for column in output.columns:
        if column.startswith(("avg_", "min_", "max_")):
            output[column] = output[column].round(4)

    count_columns = [
        column
        for column in output.columns
        if column.endswith("_rows")
        or column.endswith("_applicants")
        or column in {"application_choices", "unique_majors"}
    ]
    for column in count_columns:
        output[column] = output[column].fillna(0).astype(int)

    return output


def assert_no_pii_columns(df: pd.DataFrame, output_name: str) -> None:
    leaked_columns = sorted(PII_COLUMNS.intersection(df.columns))
    if leaked_columns:
        joined = ", ".join(leaked_columns)
        raise ValueError(f"{output_name} contains PII columns: {joined}")


def write_csv(df: pd.DataFrame, file_name: str) -> None:
    assert_no_pii_columns(df, file_name)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_DIR / file_name, index=False, encoding="utf-8-sig")


def main() -> None:
    frames = [read_source(source) for source in SOURCES]
    combined = pd.concat(frames, ignore_index=True)

    by_major = build_by_major(combined)
    year_summary = build_year_summary(combined)
    status_summary = build_status_summary(combined)
    data_quality = build_data_quality_summary(combined)

    write_csv(by_major, "admissions_round3_2568_2569_by_major.csv")
    write_csv(year_summary, "admissions_round3_2568_2569_summary.csv")
    write_csv(status_summary, "admissions_round3_2568_2569_status_summary.csv")
    write_csv(data_quality, "admissions_round3_2568_2569_data_quality.csv")

    print("Created aggregate admissions files:")
    for path in sorted(OUTPUT_DIR.glob("admissions_round3_2568_2569*.csv")):
        print(f"- {path}")


if __name__ == "__main__":
    main()
