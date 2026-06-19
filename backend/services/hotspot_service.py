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

    # --- DBSCAN clustering on ALL records ---
    dbscan_result = {"n_clusters": 0, "noise_points": 0, "top_clusters": []}
    try:
        coords = df[["latitude", "longitude"]].dropna()
        if len(coords) >= 100:
            clustering = DBSCAN(eps=0.002, min_samples=50, n_jobs=-1).fit(
                coords.values
            )
            labels = clustering.labels_
            n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
            noise_points = int((labels == -1).sum())

            coords_with_labels = coords.copy()
            coords_with_labels["cluster"] = labels
            coords_with_labels = coords_with_labels.merge(
                df[["latitude", "longitude", "record_cip"]],
                on=["latitude", "longitude"],
                how="left",
            )

            cluster_stats = (
                coords_with_labels[coords_with_labels["cluster"] != -1]
                .groupby("cluster")
                .agg(
                    centroid_lat=("latitude", "mean"),
                    centroid_lon=("longitude", "mean"),
                    size=("cluster", "size"),
                    avg_cip=("record_cip", "mean"),
                )
                .reset_index()
                .sort_values("size", ascending=False)
                .head(10)
            )

            top_clusters = []
            for _, cr in cluster_stats.iterrows():
                top_clusters.append({
                    "cluster_id": int(cr["cluster"]),
                    "centroid_lat": round(float(cr["centroid_lat"]), 6),
                    "centroid_lon": round(float(cr["centroid_lon"]), 6),
                    "size": int(cr["size"]),
                    "avg_cip": round(float(cr["avg_cip"]), 4),
                })

            dbscan_result = {
                "n_clusters": n_clusters,
                "noise_points": noise_points,
                "top_clusters": top_clusters,
            }
    except Exception as exc:
        logger.warning("DBSCAN clustering failed: %s", exc)

    return {
        "total_hotspots": len(hotspots),
        "method": "junction_aggregation + dbscan",
        "hotspots": hotspots,
        "dbscan_clusters": dbscan_result,
    }
