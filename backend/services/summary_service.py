"""
Module 0: Data Validation / Summary Engine
Returns a comprehensive dataset summary including record counts,
column metadata, violation distributions, and data-quality issues.
"""

import logging
from collections import Counter

from services.data_loader import DataStore

logger = logging.getLogger(__name__)

_CACHE: dict | None = None


def get_summary() -> dict:
    """Return a full dataset summary and data-quality report (cached after first call)."""
    global _CACHE
    if _CACHE is not None:
        return _CACHE

    store = DataStore.get_instance()
    df = store.df

    if df.empty:
        return {
            "total_records": 0,
            "original_records": store.raw_count,
            "filtered_records": store.raw_count,
            "date_range": {"start": "", "end": ""},
            "total_columns": 0,
            "columns": [],
            "missing_values": {},
            "vehicle_types": {},
            "violation_types": {},
            "police_stations": {},
            "total_police_stations": 0,
            "total_junctions": 0,
            "total_junction_records": 0,
            "data_quality": {"issues": ["Dataset is empty after filtering."]},
            "duplicate_records": 0,
            "temporal_distribution": {},
        }

    total_records = len(df)
    filtered_records = store.raw_count - total_records

    # Date range
    dt_col = df["created_datetime_ist"].dropna()
    date_start = str(dt_col.min())[:19] if not dt_col.empty else ""
    date_end = str(dt_col.max())[:19] if not dt_col.empty else ""

    # Missing values
    missing = {}
    for col in df.columns:
        n_miss = int(df[col].isna().sum())
        if n_miss > 0:
            missing[col] = {
                "count": n_miss,
                "percentage": round(n_miss / total_records * 100, 2),
            }

    # Vehicle types
    vehicle_counts = (
        df["vehicle_type"]
        .value_counts()
        .to_dict()
    )
    vehicle_counts = {str(k): int(v) for k, v in vehicle_counts.items()}

    # Violation types (flatten lists)
    all_violations: list[str] = []
    for vlist in df["violation_types"]:
        if isinstance(vlist, list):
            all_violations.extend(vlist)
    violation_counter = dict(Counter(all_violations).most_common())

    # Police stations
    station_counts = (
        df["police_station"]
        .value_counts()
        .to_dict()
    )
    station_counts = {str(k): int(v) for k, v in station_counts.items()}

    # Junctions
    named_junctions = df[df["junction_name"] != "No Junction"]
    total_junctions = named_junctions["junction_name"].nunique()
    total_junction_records = len(named_junctions)

    # Data quality issues
    issues: list[str] = []
    no_junction_pct = round(
        (len(df) - len(named_junctions)) / total_records * 100, 1
    )
    if no_junction_pct > 30:
        issues.append(
            f"{no_junction_pct}% of records have 'No Junction' — "
            "consider DBSCAN geo-clustering for these."
        )
    if missing:
        high_missing = [
            c for c, v in missing.items() if v["percentage"] > 50
        ]
        if high_missing:
            issues.append(
                f"Columns with >50% missing: {', '.join(high_missing)}"
            )
    null_dt = int(df["created_datetime"].isna().sum())
    if null_dt > 0:
        issues.append(f"{null_dt} records have null created_datetime.")

    # Temporal distribution
    temporal = (
        df.groupby("month")
        .size()
        .to_dict()
    )
    temporal = {str(k): int(v) for k, v in temporal.items()}

    _CACHE = {
        "total_records": total_records,
        "original_records": store.raw_count,
        "filtered_records": filtered_records,
        "date_range": {"start": date_start, "end": date_end},
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "missing_values": missing,
        "vehicle_types": vehicle_counts,
        "violation_types": violation_counter,
        "police_stations": station_counts,
        "total_police_stations": df["police_station"].nunique(),
        "total_junctions": total_junctions,
        "total_junction_records": total_junction_records,
        "data_quality": {"issues": issues if issues else ["No critical issues found."]},
        "duplicate_records": 0,
        "temporal_distribution": temporal,
    }
    return _CACHE
