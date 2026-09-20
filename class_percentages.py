import re
import unicodedata
from typing import Optional

import pandas as pd


# =============================================================
# Column name normalization helpers
# =============================================================

# Arabic → Persian letter mapping (common source of mismatches)
_ARABIC_TO_PERSIAN = {
    "ي": "ی",   # Arabic Yeh      -> Persian Yeh
    "ى": "ی",   # Alef Maksura    -> Persian Yeh
    "ك": "ک",   # Arabic Kaf      -> Persian Kaf
    "ة": "ه",   # Arabic Teh Marb -> Persian Heh
    "ۀ": "ه",   # Heh with Yeh    -> Persian Heh
    "ؤ": "و",
    "إ": "ا",
    "أ": "ا",
    "ٱ": "ا",
}

# Zero-width / invisible characters to strip out
_INVISIBLE_CHARS = [
    "\u200b",  # zero-width space
    "\u200c",  # zero-width non-joiner (نیم‌فاصله)
    "\u200d",  # zero-width joiner
    "\u200e",  # left-to-right mark
    "\u200f",  # right-to-left mark
    "\u2060",  # word joiner
    "\ufeff",  # BOM
    "\xa0",    # non-breaking space
    "\u202f",  # narrow no-break space
]


def normalize_text(value) -> str:
    """
    Normalize a column name (or any text) so that small invisible
    differences between Excel exports do not break column matching.

    Steps:
      1. Convert to string
      2. Unicode NFKC normalization
      3. Arabic -> Persian letter unification
      4. Remove invisible / zero-width characters
      5. Collapse all whitespace to single spaces
      6. Strip leading/trailing whitespace
      7. Lowercase (harmless for Persian, useful for English headers)
    """
    if value is None:
        return ""

    text = str(value)

    # Unicode normalization (compatibility form)
    text = unicodedata.normalize("NFKC", text)

    # Unify Arabic letters to Persian equivalents
    for ar, fa in _ARABIC_TO_PERSIAN.items():
        text = text.replace(ar, fa)

    # Remove invisible characters
    for ch in _INVISIBLE_CHARS:
        text = text.replace(ch, "")

    # Collapse all whitespace (spaces, tabs, newlines) into single spaces
    text = re.sub(r"\s+", " ", text)

    # Trim
    text = text.strip()

    # Lowercase (only affects Latin chars)
    text = text.lower()

    return text


def find_column(df: pd.DataFrame, *candidates: str) -> Optional[str]:
    """
    Return the first column in `df` whose normalized name matches
    any of the normalized candidate names.

    Matching order:
      1. Exact normalized match
      2. Startswith match (in case of suffixes like 'شده')
      3. Substring match (last resort)
    """
    normalized_map = {
        normalize_text(col): col
        for col in df.columns
    }

    normalized_candidates = [normalize_text(c) for c in candidates]

    # 1. Exact match
    for cand in normalized_candidates:
        if cand in normalized_map:
            return normalized_map[cand]

    # 2. Startswith match
    for cand in normalized_candidates:
        for norm_col, original in normalized_map.items():
            if norm_col.startswith(cand):
                return original

    # 3. Substring match
    for cand in normalized_candidates:
        for norm_col, original in normalized_map.items():
            if cand in norm_col:
                return original

    return None


# =============================================================
# Main function
# =============================================================

def calculate_class_percentages(
    input_file: str,
    output_file: str = "class_percentages.xlsx",
    sheet_name: Optional[str] = "Medical Docs Status",
    sheet_index: int = 1,
) -> pd.DataFrame:
    """
    Calculate percentage distribution of classes 0-5 for each
    'پرونده الکترونیک' for:
        - کلاس امتیاز خام
        - کلاس امتیاز کالیبره

    A Total row is added at the bottom.

    The function is resilient to:
      - hidden / zero-width characters in headers
      - Arabic vs Persian letter variants (ي/ی, ك/ک, ة/ه ...)
      - extra spaces (leading, trailing, internal)
      - missing sheet name (falls back to sheet_index)
      - slightly different column names (prefix/substring match)
      - empty / non-numeric class values
      - missing class columns entirely (skips that block gracefully)
    """

    # ---------------------------------------------------------
    # 1. Read Excel (with sheet fallback)
    # ---------------------------------------------------------
    try:
        df = pd.read_excel(input_file, sheet_name=sheet_name)
    except (ValueError, KeyError):
        # Sheet name not found → try by index
        print(
            f"[warn] Sheet '{sheet_name}' not found. "
            f"Falling back to sheet index {sheet_index}."
        )
        df = pd.read_excel(input_file, sheet_name=sheet_index)

    # Normalize column names (strip invisible chars, unify letters)
    df.columns = [str(c).strip() for c in df.columns]

    print("[info] Columns found in file:")
    for c in df.columns:
        print(f"    {c!r}  ->  normalized: {normalize_text(c)!r}")

    # ---------------------------------------------------------
    # 2. Locate required columns (flexible matching)
    # ---------------------------------------------------------
    group_col = find_column(
        df,
        "پرونده الکترونیک",
        "پرونده الكترونیک",
        "پرونده الکترونیکی",
    )
    raw_col = find_column(
        df,
        "کلاس امتیاز خام",
        "کلاس امتیاز خام ",
        "کلاس امتیازخام",
    )
    calibrated_col = find_column(
        df,
        "کلاس امتیاز کالیبره",
        "کلاس امتیاز کالیبره شده",
        "کلاس امتیاز کالیبره‌شده",
        "کلاس امتیاز کالیبره شده ",
        "کلاس امتیاز کاليبره",
    )

    if group_col is None:
        raise ValueError(
            "Could not find the 'پرونده الکترونیک' column. "
            f"Available columns: {list(df.columns)}"
        )

    if raw_col is None and calibrated_col is None:
        raise ValueError(
            "Could not find either 'کلاس امتیاز خام' or "
            "'کلاس امتیاز کالیبره' column. "
            f"Available columns: {list(df.columns)}"
        )

    print(f"[info] Using group column      : {group_col!r}")
    print(f"[info] Using raw column        : {raw_col!r}")
    print(f"[info] Using calibrated column : {calibrated_col!r}")

    # ---------------------------------------------------------
    # 3. Clean class columns
    # ---------------------------------------------------------
    valid_classes = [0, 1, 2, 3, 4, 5]

    def clean_class_column(col_name: Optional[str]) -> Optional[str]:
        if col_name is None:
            return None
        df[col_name] = pd.to_numeric(df[col_name], errors="coerce")
        df.loc[~df[col_name].isin(valid_classes), col_name] = pd.NA
        return col_name

    raw_col = clean_class_column(raw_col)
    calibrated_col = clean_class_column(calibrated_col)

    # ---------------------------------------------------------
    # Helper: percentage table per group
    # ---------------------------------------------------------
    def percentage_table(data: pd.DataFrame, class_column: str) -> pd.DataFrame:
        counts = pd.crosstab(data[group_col], data[class_column])
        counts = counts.reindex(columns=valid_classes, fill_value=0)
        percentages = counts.div(counts.sum(axis=1), axis=0) * 100
        return percentages

    # ---------------------------------------------------------
    # 4/5. Build percentage blocks
    # ---------------------------------------------------------
    pieces = []

    record_count = (
        df.groupby(group_col)
        .size()
        .rename("تعداد رکورد")
    )
    pieces.append(record_count)

    raw_percent = None
    if raw_col is not None:
        raw_percent = percentage_table(df, raw_col)
        raw_percent.columns = [
            f"خام کلاس {cid} (%)" for cid in valid_classes
        ]
        pieces.append(raw_percent)

    calibrated_percent = None
    if calibrated_col is not None:
        calibrated_percent = percentage_table(df, calibrated_col)
        calibrated_percent.columns = [
            f"کالیبره کلاس {cid} (%)" for cid in valid_classes
        ]
        pieces.append(calibrated_percent)

    # ---------------------------------------------------------
    # 6/7. Combine
    # ---------------------------------------------------------
    result = pd.concat(pieces, axis=1)

    # ---------------------------------------------------------
    # 8. TOTAL row
    # ---------------------------------------------------------
    total_row = {"تعداد رکورد": len(df)}

    if raw_col is not None:
        raw_total = (
            df[raw_col]
            .value_counts(normalize=True)
            .reindex(valid_classes, fill_value=0)
            * 100
        )
        for cid in valid_classes:
            total_row[f"خام کلاس {cid} (%)"] = raw_total[cid]

    if calibrated_col is not None:
        cal_total = (
            df[calibrated_col]
            .value_counts(normalize=True)
            .reindex(valid_classes, fill_value=0)
            * 100
        )
        for cid in valid_classes:
            total_row[f"کالیبره کلاس {cid} (%)"] = cal_total[cid]

    result.loc["Total"] = total_row

    # ---------------------------------------------------------
    # 9. Round percentages
    # ---------------------------------------------------------
    percentage_columns = [c for c in result.columns if "(%)" in c]
    if percentage_columns:
        result[percentage_columns] = result[percentage_columns].round(2)

    # ---------------------------------------------------------
    # 10. Restore group column
    # ---------------------------------------------------------
    result = result.reset_index()
    result = result.rename(columns={"index": group_col})

    # ---------------------------------------------------------
    # 11. Save
    # ---------------------------------------------------------
    result.to_excel(output_file, index=False)
    print(f"[info] Result saved to: {output_file}")

    return result


# =============================================================
# Example usage
# =============================================================
if __name__ == "__main__":
    result = calculate_class_percentages(
        input_file="MedicalDocsStatus_2026-09-20_10_09_27.xlsx",
        output_file="class_percentages_3.xlsx",
        sheet_name="Medical Docs Status",
    )
    print(result.to_string(index=False))