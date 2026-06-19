"""
Module 4: Confidence Engine
Scores each junction's data reliability using temporal consistency,
data density, and historical depth.
"""

import logging
import numpy as np

from services.data_loader import DataStore

logger = logging.getLogger(__name__)


def get_confidence_scores() -> dict:
    """
    Compute a confidence score for each junction based on:
        - temporal_consistency (40%): stability of weekly CIP
        - data_density (30%): records/week vs median across junctions
        - historical_depth (30%): proportion of weeks with data

    Returns
    -------
    dict
        Method description, component weights, and scored junction list.
    """
    store = DataStore.get_instance()
    jcip = store.junction_cip

    if jcip.empty:
        return {
            "method": "",
            "components": [],
            "total_junctions": 0,
            "scores": [],
        }

    # Determine the total number of possible weeks in the dataset
    df = store.df
    dt_col = df["created_datetime_ist"].dropna()
    if dt_col.empty:
        total_possible_weeks = 1
    else:
        span_days = (dt_col.max() - dt_col.min()).days
        total_possible_weeks = max(1, span_days // 7)

    # Compute per-junction metrics
    records = []
    global_avg_per_week = []  # to find median

    for _, row in jcip.iterrows():
        series = row.get("weekly_cip_series", {})
        if not isinstance(series, dict) or not series:
            records.append({
                "junction_name": row["junction_name"],
                "temporal_consistency": 0.0,
                "data_density_raw": 0.0,
                "historical_depth": 0.0,
            })
            continue

        values = list(series.values())
        weeks_with_data = len(values)
        mean_cip = float(np.mean(values))
        std_cip = float(np.std(values))

        # Temporal consistency
        tc = max(0.0, 1.0 - (std_cip / (mean_cip + 1e-6)))
        tc = min(tc, 1.0)

        # Data density: avg violations per week at this junction
        avg_records_per_week = row["total_violations"] / max(weeks_with_data, 1)
        global_avg_per_week.append(avg_records_per_week)

        # Historical depth
        hd = min(1.0, weeks_with_data / total_possible_weeks)

        records.append({
            "junction_name": row["junction_name"],
            "temporal_consistency": round(tc, 4),
            "data_density_raw": avg_records_per_week,
            "historical_depth": round(hd, 4),
        })

    # Normalise data_density against median
    median_rpw = float(np.median(global_avg_per_week)) if global_avg_per_week else 1.0
    median_rpw = max(median_rpw, 1.0)

    scores = []
    for r in records:
        dd = min(1.0, r["data_density_raw"] / median_rpw)
        conf = (
            0.4 * r["temporal_consistency"]
            + 0.3 * dd
            + 0.3 * r["historical_depth"]
        )
        scores.append({
            "junction_name": r["junction_name"],
            "temporal_consistency": r["temporal_consistency"],
            "data_density": round(dd, 4),
            "historical_depth": r["historical_depth"],
            "confidence_score": round(conf, 4),
        })

    # Sort and rank
    scores.sort(key=lambda s: s["confidence_score"], reverse=True)
    for rank, s in enumerate(scores, start=1):
        s["rank"] = rank

    return {
        "method": (
            "confidence_score = 0.4 × temporal_consistency + "
            "0.3 × data_density + 0.3 × historical_depth"
        ),
        "components": [
            "temporal_consistency (40%)",
            "data_density (30%)",
            "historical_depth (30%)",
        ],
        "total_junctions": len(scores),
        "scores": scores,
    }
