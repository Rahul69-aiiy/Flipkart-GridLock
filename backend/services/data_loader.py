"""
ParkSight AI – Data Loader (Singleton)
Loads the CSV once, preprocesses it, computes junction-level CIP aggregates,
and derives data-driven officer-hours per junction from hourly violation
concentration patterns.
"""

import json
import logging
from datetime import timedelta
from typing import Optional

import numpy as np
import pandas as pd

from utils.config import settings
from utils.weights import (
    PEAK_HOURS_IST,
    get_multi_violation_factor,
    get_time_weight,
    get_vehicle_weight,
    get_violation_weight,
)
from services.preprocessing import parse_violation_types, normalize_range

logger = logging.getLogger(__name__)


class DataStore:
    """Singleton that holds the preprocessed DataFrame and junction aggregates."""

    _instance: Optional["DataStore"] = None
    _df: Optional[pd.DataFrame] = None
    _junction_cip: Optional[pd.DataFrame] = None
    _junction_hours: Optional[pd.DataFrame] = None
    _raw_count: int = 0

    # ------------------------------------------------------------------
    # Singleton access
    # ------------------------------------------------------------------
    @classmethod
    def get_instance(cls) -> "DataStore":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load()
        return cls._instance

    # ------------------------------------------------------------------
    # Public properties
    # ------------------------------------------------------------------
    @property
    def df(self) -> pd.DataFrame:
        return self._df

    @property
    def junction_cip(self) -> pd.DataFrame:
        return self._junction_cip

    @property
    def junction_hours(self) -> pd.DataFrame:
        """Per-junction required officer-hours derived from violation data."""
        return self._junction_hours

    @property
    def raw_count(self) -> int:
        return self._raw_count

    # ------------------------------------------------------------------
    # Loading & preprocessing
    # ------------------------------------------------------------------
    def _load(self):
        logger.info("Loading dataset from %s ...", settings.csv_path)
        try:
            raw = pd.read_csv(settings.csv_path, low_memory=False)
        except FileNotFoundError:
            logger.error("CSV not found at %s", settings.csv_path)
            self._df = pd.DataFrame()
            self._junction_cip = pd.DataFrame()
            self._junction_hours = pd.DataFrame()
            return

        self._raw_count = len(raw)
        logger.info("Raw records loaded: %d", self._raw_count)

        # 1. Drop 100%-null columns
        for col in ("description", "closed_datetime", "action_taken_timestamp"):
            if col in raw.columns:
                raw.drop(columns=[col], inplace=True)

        # 2. Filter out rejected / duplicate
        if "validation_status" in raw.columns:
            raw = raw[~raw["validation_status"].isin(["rejected", "duplicate"])].copy()
        logger.info("Records after validation filter: %d", len(raw))

        # 3. Parse violation_type JSON arrays
        raw["violation_types"] = raw["violation_type"].apply(parse_violation_types)
        raw["violation_count"] = raw["violation_types"].apply(len)

        # 4. Datetime & IST conversion
        raw["created_datetime"] = pd.to_datetime(
            raw["created_datetime"], errors="coerce", utc=True
        )
        raw["created_datetime_ist"] = raw["created_datetime"] + timedelta(
            hours=5, minutes=30
        )
        raw["hour_ist"] = raw["created_datetime_ist"].dt.hour
        raw["day_of_week"] = raw["created_datetime_ist"].dt.dayofweek
        raw["day_name"] = raw["created_datetime_ist"].dt.day_name()
        raw["month"] = raw["created_datetime_ist"].dt.month
        raw["year"] = raw["created_datetime_ist"].dt.year
        raw["week_number"] = (
            raw["created_datetime_ist"]
            .dt.isocalendar()
            .week.fillna(0)
            .astype(int)
        )
        raw["is_peak_hour"] = raw["hour_ist"].isin(PEAK_HOURS_IST)

        # 5. Weight columns
        raw["vehicle_weight"] = raw["vehicle_type"].apply(get_vehicle_weight)
        raw["primary_violation"] = raw["violation_types"].apply(
            lambda lst: lst[0] if lst else "UNKNOWN"
        )
        raw["violation_weight"] = raw["violation_types"].apply(
            lambda lst: max((get_violation_weight(v) for v in lst), default=1.0)
        )
        raw["time_weight"] = raw["hour_ist"].apply(get_time_weight)
        raw["multi_violation_factor"] = raw["violation_count"].apply(
            get_multi_violation_factor
        )

        # 6. Record-level CIP
        raw["record_cip"] = (
            raw["vehicle_weight"]
            * raw["violation_weight"]
            * raw["time_weight"]
            * raw["multi_violation_factor"]
        )

        self._df = raw
        logger.info("Preprocessing complete. Final shape: %s", raw.shape)

        # 7. Junction-level aggregation
        self._build_junction_cip()

        # 8. Data-driven officer-hours per junction
        self._compute_junction_officer_hours()

    # ------------------------------------------------------------------
    def _build_junction_cip(self):
        df = self._df
        named = df[df["junction_name"] != "No Junction"].copy()

        if named.empty:
            self._junction_cip = pd.DataFrame()
            return

        grp = named.groupby("junction_name", as_index=False)

        jcip = grp.agg(
            total_violations=("record_cip", "size"),
            total_cip=("record_cip", "sum"),
            avg_cip=("record_cip", "mean"),
            latitude=("latitude", "mean"),
            longitude=("longitude", "mean"),
            unique_vehicles=("vehicle_number", "nunique"),
        )

        # Mode for police_station
        mode_ps = (
            named.groupby("junction_name")["police_station"]
            .agg(lambda s: s.mode().iloc[0] if not s.mode().empty else "Unknown")
            .reset_index()
        )
        jcip = jcip.merge(mode_ps, on="junction_name", how="left")

        # Mode for top_violation
        mode_viol = (
            named.groupby("junction_name")["primary_violation"]
            .agg(lambda s: s.mode().iloc[0] if not s.mode().empty else "UNKNOWN")
            .reset_index()
            .rename(columns={"primary_violation": "top_violation"})
        )
        jcip = jcip.merge(mode_viol, on="junction_name", how="left")

        # Junction weight: normalise total_violations to 0.5–3.0
        jcip["junction_weight"] = normalize_range(
            jcip["total_violations"], 0.5, 3.0
        )

        # Weekly CIP series (stored as dict per junction)
        named["week_key"] = (
            named["year"].astype(str) + "-W" + named["week_number"].astype(str).str.zfill(2)
        )
        weekly = (
            named.groupby(["junction_name", "week_key"])["record_cip"]
            .sum()
            .reset_index()
            .rename(columns={"record_cip": "weekly_cip"})
        )
        weekly_dict = (
            weekly.groupby("junction_name")
            .apply(lambda g: dict(zip(g["week_key"], g["weekly_cip"])), include_groups=False)
            .reset_index()
            .rename(columns={0: "weekly_cip_series"})
        )
        jcip = jcip.merge(weekly_dict, on="junction_name", how="left")

        jcip["total_cip"] = jcip["total_cip"].round(2)
        jcip["avg_cip"] = jcip["avg_cip"].round(4)

        self._junction_cip = jcip
        logger.info("Junction CIP built: %d junctions", len(jcip))

    # ------------------------------------------------------------------
    def _compute_junction_officer_hours(self):
        """
        For each named junction, compute the minimum number of contiguous/
        ranked hours needed to cover ≥ 80 % of historical violations.

        Produces a DataFrame with:
            junction_name, required_officer_hours,
            peak_window_start, peak_window_end, coverage_percent,
            hourly_profile (dict hour → count)
        """
        df = self._df
        named = df[df["junction_name"] != "No Junction"].copy()

        if named.empty:
            self._junction_hours = pd.DataFrame()
            return

        COVERAGE_TARGET = 0.80

        results = []
        for jname, jdf in named.groupby("junction_name"):
            hourly = jdf.groupby("hour_ist").size().reset_index(name="count")
            hourly = hourly.sort_values("count", ascending=False).reset_index(drop=True)
            total = hourly["count"].sum()

            if total == 0:
                results.append({
                    "junction_name": jname,
                    "required_officer_hours": 1,
                    "peak_window_start": 0,
                    "peak_window_end": 1,
                    "coverage_percent": 0.0,
                    "hourly_profile": {},
                })
                continue

            cumulative = 0
            selected_hours = []
            for _, row in hourly.iterrows():
                cumulative += row["count"]
                selected_hours.append(int(row["hour_ist"]))
                if cumulative / total >= COVERAGE_TARGET:
                    break

            required = len(selected_hours)
            coverage = round(cumulative / total * 100, 2)

            # Peak enforcement window: contiguous block from sorted selected hours
            sorted_hrs = sorted(selected_hours)
            window_start = sorted_hrs[0]
            window_end = (sorted_hrs[-1] + 1) % 24  # exclusive end

            # Build full hourly profile dict
            full_profile = dict(
                zip(
                    jdf.groupby("hour_ist").size().index.astype(int),
                    jdf.groupby("hour_ist").size().values.astype(int),
                )
            )

            results.append({
                "junction_name": jname,
                "required_officer_hours": required,
                "peak_window_start": window_start,
                "peak_window_end": window_end,
                "coverage_percent": coverage,
                "hourly_profile": full_profile,
            })

        self._junction_hours = pd.DataFrame(results)
        logger.info(
            "Officer-hours computed for %d junctions. Mean=%.1f hrs",
            len(self._junction_hours),
            self._junction_hours["required_officer_hours"].mean(),
        )
