"""
Module 8: Station Efficiency Engine
Computes per-police-station performance metrics including violation counts,
CIP totals, officer productivity, device utilization, and efficiency rankings.
"""

import logging
import pandas as pd

from services.data_loader import DataStore

logger = logging.getLogger(__name__)


def get_station_stats() -> dict:
    """
    Compute comprehensive statistics for each police station.

    Metrics per station:
      - total_violations: number of records
      - total_cip: sum of record_cip
      - avg_cip: mean of record_cip
      - unique_officers: number of distinct created_by_id
      - unique_devices: number of distinct device_id
      - junctions_covered: number of distinct junction_name (excluding 'No Junction')
      - unique_vehicles: number of distinct vehicle identifiers
      - cip_per_officer: total_cip / unique_officers
      - violations_per_officer: total_violations / unique_officers
      - violations_per_device: total_violations / unique_devices
      - efficiency_rank: rank by cip_per_officer (descending)

    Returns
    -------
    dict
        total_stations and ranked list of station records.
    """
    store = DataStore.get_instance()
    df = store.df

    if df.empty:
        return {
            "total_stations": 0,
            "stations": [],
        }

    # Determine the vehicle column name
    vehicle_col = None
    for candidate in ("vehicle_number", "id"):
        if candidate in df.columns:
            vehicle_col = candidate
            break

    # --- Aggregate by police_station ---
    grouped = df.groupby("police_station", as_index=False)

    stats = grouped.agg(
        total_violations=("police_station", "size"),
        total_cip=("record_cip", "sum"),
        avg_cip=("record_cip", "mean"),
        unique_officers=("created_by_id", "nunique"),
        unique_devices=("device_id", "nunique"),
    )

    # Junctions covered: nunique of junction_name excluding 'No Junction'
    junctions_per_station = (
        df[df["junction_name"] != "No Junction"]
        .groupby("police_station", as_index=False)["junction_name"]
        .nunique()
        .rename(columns={"junction_name": "junctions_covered"})
    )
    stats = stats.merge(junctions_per_station, on="police_station", how="left")
    stats["junctions_covered"] = stats["junctions_covered"].fillna(0).astype(int)

    # Unique vehicles
    if vehicle_col:
        vehicles_per_station = (
            df.groupby("police_station", as_index=False)[vehicle_col]
            .nunique()
            .rename(columns={vehicle_col: "unique_vehicles"})
        )
        stats = stats.merge(vehicles_per_station, on="police_station", how="left")
        stats["unique_vehicles"] = stats["unique_vehicles"].fillna(0).astype(int)
    else:
        stats["unique_vehicles"] = 0

    # --- Derived metrics ---
    stats["cip_per_officer"] = (
        stats["total_cip"] / stats["unique_officers"].replace(0, 1)
    ).round(2)

    stats["violations_per_officer"] = (
        stats["total_violations"] / stats["unique_officers"].replace(0, 1)
    ).round(2)

    stats["violations_per_device"] = (
        stats["total_violations"] / stats["unique_devices"].replace(0, 1)
    ).round(2)

    # --- Efficiency rank (1 = best) ---
    stats["efficiency_rank"] = (
        stats["cip_per_officer"]
        .rank(ascending=False, method="min")
        .astype(int)
    )

    # Round float columns
    stats["total_cip"] = stats["total_cip"].round(2)
    stats["avg_cip"] = stats["avg_cip"].round(4)

    # Sort by efficiency_rank
    stats = stats.sort_values("efficiency_rank").reset_index(drop=True)

    # Convert to list of dicts
    stations_list = stats.to_dict(orient="records")

    return {
        "total_stations": len(stations_list),
        "stations": stations_list,
    }
