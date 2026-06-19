"""
Module 2: CIP (Congestion Impact Potential) Engine
Returns junction-level CIP scores with full weight transparency.
"""

import logging
import numpy as np

from services.data_loader import DataStore
from utils.weights import VEHICLE_WEIGHTS, VIOLATION_WEIGHTS

logger = logging.getLogger(__name__)


def get_cip_scores(top_n: int = 50) -> dict:
    """
    Return the top-N junctions ranked by total CIP, along with weight
    metadata and distributional statistics.
    """
    store = DataStore.get_instance()
    jcip = store.junction_cip

    if jcip.empty:
        return {
            "total_junctions": 0,
            "formula": "",
            "weights_used": {
                "vehicle_weights": VEHICLE_WEIGHTS,
                "violation_weights": VIOLATION_WEIGHTS,
                "time_weights": {"peak": 2.0, "shoulder": 1.5, "off_peak": 1.0},
            },
            "junctions": [],
            "cip_distribution": {"mean": 0, "median": 0, "std": 0, "min": 0, "max": 0},
        }

    sorted_jcip = jcip.sort_values("total_cip", ascending=False).head(top_n).reset_index(drop=True)

    junctions = []
    for rank, (_, row) in enumerate(sorted_jcip.iterrows(), start=1):
        junctions.append({
            "junction_name": row["junction_name"],
            "total_cip": round(float(row["total_cip"]), 2),
            "avg_cip": round(float(row["avg_cip"]), 4),
            "total_violations": int(row["total_violations"]),
            "junction_weight": round(float(row["junction_weight"]), 4),
            "latitude": round(float(row["latitude"]), 6),
            "longitude": round(float(row["longitude"]), 6),
            "police_station": str(row.get("police_station", "Unknown")),
            "top_violation": str(row.get("top_violation", "UNKNOWN")),
            "rank": rank,
        })

    # Distribution across ALL junctions
    cip_vals = jcip["total_cip"]
    distribution = {
        "mean": round(float(cip_vals.mean()), 2),
        "median": round(float(cip_vals.median()), 2),
        "std": round(float(cip_vals.std()), 2),
        "min": round(float(cip_vals.min()), 2),
        "max": round(float(cip_vals.max()), 2),
    }

    formula = (
        "CIP = vehicle_weight × violation_weight × time_weight × multi_violation_factor. "
        "Junction total_cip = Σ record_cip for all records at that junction."
    )

    return {
        "total_junctions": len(jcip),
        "formula": formula,
        "weights_used": {
            "vehicle_weights": VEHICLE_WEIGHTS,
            "violation_weights": VIOLATION_WEIGHTS,
            "time_weights": {"peak": 2.0, "shoulder": 1.5, "off_peak": 1.0},
        },
        "junctions": junctions,
        "cip_distribution": distribution,
    }
