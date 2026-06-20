"""
Module 1: Hotspot Intelligence
Identifies parking-violation hotspots via junction CIP aggregation and
DBSCAN spatial clustering on raw lat/lon coordinates.
"""

import logging
import numpy as np
from sklearn.cluster import DBSCAN

from services.data_loader import DataStore

logger = logging.getLogger(__name__)

_CACHE: dict = {}


def get_hotspots(top_n: int = 50) -> dict:
    """
    Return the top-N violation hotspots by total CIP, plus DBSCAN clusters.

    Parameters
    ----------
    top_n : int
        Number of hotspots to return (sorted by total_cip desc).

    Returns
    -------
    dict
        Hotspot list and DBSCAN cluster information.
    """
    if top_n in _CACHE:
        return _CACHE[top_n]

    store = DataStore.get_instance()
    jcip = store.junction_cip
    df = store.df

    if jcip.empty:
        return {
            "total_hotspots": 0,
            "method": "junction_aggregation + dbscan",
            "hotspots": [],
            "dbscan_clusters": {"n_clusters": 0, "noise_points": 0, "top_clusters": []},
        }

    # --- Junction-based hotspots ---
    sorted_jcip = jcip.sort_values("total_cip", ascending=False).head(top_n).reset_index(drop=True)

    hotspots = []
    for rank, (_, row) in enumerate(sorted_jcip.iterrows(), start=1):
        hotspots.append({
            "junction_name": row["junction_name"],
            "latitude": round(float(row["latitude"]), 6),
            "longitude": round(float(row["longitude"]), 6),
            "total_violations": int(row["total_violations"]),
            "total_cip": round(float(row["total_cip"]), 2),
            "avg_cip": round(float(row["avg_cip"]), 4),
            "rank": rank,
            "police_station": str(row.get("police_station", "Unknown")),
            "top_violation": str(row.get("top_violation", "UNKNOWN")),
            "unique_vehicles": int(row.get("unique_vehicles", 0)),
        })

    # DBSCAN clustering on junctions
    dbscan_result = {"n_clusters": 0, "noise_points": 0, "top_clusters": []}

    try:
        coords = jcip[["latitude", "longitude"]].dropna()

        if len(coords) >= 5:

            clustering = DBSCAN(
                eps=0.01,
                min_samples=3
            ).fit(coords)

            clustered = jcip.copy()
            clustered["cluster"] = clustering.labels_

            n_clusters = len(set(clustering.labels_)) - (
                1 if -1 in clustering.labels_ else 0
            )

            noise_points = int((clustered["cluster"] == -1).sum())

            cluster_stats = (
                clustered[clustered["cluster"] != -1]
                .groupby("cluster")
                .agg(
                    centroid_lat=("latitude", "mean"),
                    centroid_lon=("longitude", "mean"),
                    total_cip=("total_cip", "sum"),
                    size=("cluster", "size"),
                )
                .reset_index()
                .sort_values("total_cip", ascending=False)
            )

            top_clusters = []

            for _, row in cluster_stats.iterrows():
                top_clusters.append({
                    "cluster_id": int(row["cluster"]),
                    "centroid_lat": round(float(row["centroid_lat"]), 6),
                    "centroid_lon": round(float(row["centroid_lon"]), 6),
                    "size": int(row["size"]),
                    "total_cip": round(float(row["total_cip"]), 2),
                })

            dbscan_result = {
                "n_clusters": int(n_clusters),
                "noise_points": noise_points,
                "top_clusters": top_clusters,
            }

    except Exception as exc:
        logger.warning("DBSCAN clustering failed: %s", exc)

    _CACHE[top_n] = {
        "total_hotspots": len(hotspots),
        "method": "junction_aggregation + dbscan",
        "hotspots": hotspots,
        "dbscan_clusters": dbscan_result,
    }
    return _CACHE[top_n]