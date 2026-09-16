import pandas as pd


def calculate_class_percentages(
    input_file: str,
    output_file: str = "class_percentages.xlsx",
    sheet_name: str = "Medical Docs Status",
):
    """
    Calculate percentage distribution of classes 0-5 for each
    'پرونده الکترونیک' for:
        - کلاس امتیاز خام
        - کلاس امتیاز کالیبره

    A Total row is added at the bottom.

    Parameters
    ----------
    input_file : str
        Path to input Excel file.

    output_file : str
        Path to output Excel file.

    sheet_name : str
        Name of sheet containing the data.

    Returns
    -------
    pandas.DataFrame
        Final percentage table.
    """

    # ---------------------------------------------------------
    # 1. Read Excel
    # ---------------------------------------------------------
    df = pd.read_excel(
        input_file,
        sheet_name=sheet_name
    )

    # Remove accidental spaces from column names
    df.columns = df.columns.astype(str).str.strip()

    # ---------------------------------------------------------
    # 2. Required columns
    # ---------------------------------------------------------
    group_col = "پرونده الکترونیک"
    raw_col = "کلاس امتیاز خام"
    calibrated_col = "کلاس امتیاز کالیبره"

    required_columns = [
        group_col,
        raw_col,
        calibrated_col,
    ]

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    # ---------------------------------------------------------
    # 3. Clean class columns
    # ---------------------------------------------------------
    # Converts values like:
    # "1"   -> 1
    # 1.0   -> 1
    # invalid/missing -> NaN

    df[raw_col] = pd.to_numeric(
        df[raw_col],
        errors="coerce"
    )

    df[calibrated_col] = pd.to_numeric(
        df[calibrated_col],
        errors="coerce"
    )

    # Only valid classes 0-5 are considered
    valid_classes = [0, 1, 2, 3, 4, 5]

    df.loc[
        ~df[raw_col].isin(valid_classes),
        raw_col
    ] = pd.NA

    df.loc[
        ~df[calibrated_col].isin(valid_classes),
        calibrated_col
    ] = pd.NA

    # ---------------------------------------------------------
    # Helper function
    # ---------------------------------------------------------
    def percentage_table(data, class_column):
        """
        Return percentage of classes 0-5 for each electronic
        record type.
        """

        counts = pd.crosstab(
            data[group_col],
            data[class_column]
        )

        # Make sure columns 0-5 always exist
        counts = counts.reindex(
            columns=valid_classes,
            fill_value=0
        )

        # Convert counts to percentages
        percentages = (
            counts.div(counts.sum(axis=1), axis=0)
            * 100
        )

        return percentages

    # ---------------------------------------------------------
    # 4. Raw score percentages
    # ---------------------------------------------------------
    raw_percent = percentage_table(
        df,
        raw_col
    )

    raw_percent.columns = [
        f"خام کلاس {class_id} (%)"
        for class_id in valid_classes
    ]

    # ---------------------------------------------------------
    # 5. Calibrated score percentages
    # ---------------------------------------------------------
    calibrated_percent = percentage_table(
        df,
        calibrated_col
    )

    calibrated_percent.columns = [
        f"کالیبره کلاس {class_id} (%)"
        for class_id in valid_classes
    ]

    # ---------------------------------------------------------
    # 6. Number of records for each پرونده الکترونیک
    # ---------------------------------------------------------
    record_count = (
        df.groupby(group_col)
        .size()
        .rename("تعداد رکورد")
    )

    # ---------------------------------------------------------
    # 7. Combine everything
    # ---------------------------------------------------------
    result = pd.concat(
        [
            record_count,
            raw_percent,
            calibrated_percent,
        ],
        axis=1
    )

    # ---------------------------------------------------------
    # 8. Calculate TOTAL row
    # ---------------------------------------------------------

    total_row = {
        "تعداد رکورد": len(df)
    }

    # Raw total percentages
    raw_total = (
        df[raw_col]
        .value_counts(normalize=True)
        .reindex(valid_classes, fill_value=0)
        * 100
    )

    for class_id in valid_classes:
        total_row[f"خام کلاس {class_id} (%)"] = (
            raw_total[class_id]
        )

    # Calibrated total percentages
    calibrated_total = (
        df[calibrated_col]
        .value_counts(normalize=True)
        .reindex(valid_classes, fill_value=0)
        * 100
    )

    for class_id in valid_classes:
        total_row[
            f"کالیبره کلاس {class_id} (%)"
        ] = calibrated_total[class_id]

    # Add Total row
    result.loc["Total"] = total_row

    # ---------------------------------------------------------
    # 9. Round percentages
    # ---------------------------------------------------------
    percentage_columns = [
        col
        for col in result.columns
        if "(%)" in col
    ]

    result[percentage_columns] = (
        result[percentage_columns]
        .round(2)
    )

    # ---------------------------------------------------------
    # 10. Restore پرونده الکترونیک as normal column
    # ---------------------------------------------------------
    result = result.reset_index()

    result = result.rename(
        columns={
            "index": group_col
        }
    )

    # ---------------------------------------------------------
    # 11. Save to Excel
    # ---------------------------------------------------------
    result.to_excel(
        output_file,
        index=False
    )

    print(f"Result saved to: {output_file}")

    return result


# =============================================================
# Example
# =============================================================

result = calculate_class_percentages(
    input_file="MedicalDocsStatus_2026-09-16_14_16_08_calibrated.xlsx",
    output_file="class_percentages_2.xlsx"
)

print(result.to_string(index=False))