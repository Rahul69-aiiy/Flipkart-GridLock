"""
ParkSight AI - Preprocessing Utilities
Helper functions used by DataStore and other services for data transformation,
JSON parsing, timezone conversion, and normalisation.
"""

import json
import logging
from datetime import timedelta

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def parse_violation_types(val) -> list[str]:
    """Parse a JSON array string from the violation_type column into a Python list.

    Handles edge cases:
    - NaN / None / empty string  -> []
    - Valid JSON array           -> list of strings
    - Single-quoted JSON         -> replace with double quotes and retry
    - Bare string (no brackets)  -> [string]

    Args:
        val: Raw cell value from the violation_type column.

    Returns:
        A list of violation type strings.
    """
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return []
    if pd.isna(val):
        return []

    val_str = str(val).strip()
    if not val_str:
        return []

    # Attempt 1: direct JSON parse
    try:
        parsed = json.loads(val_str)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
        return [str(parsed).strip()] if str(parsed).strip() else []
    except (json.JSONDecodeError, TypeError):
        pass

    # Attempt 2: replace single quotes with double quotes
    try:
        cleaned = val_str.replace("'", '"')
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
        return [str(parsed).strip()] if str(parsed).strip() else []
    except (json.JSONDecodeError, TypeError):
        pass

    # Attempt 3: treat as a bare string or comma-separated values
    logger.warning("Could not JSON-parse violation_type value: %s — treating as bare string", val_str[:100])
    if "," in val_str:
        # Strip brackets if present
        stripped = val_str.strip("[]")
        parts = [p.strip().strip("'\"") for p in stripped.split(",")]
        return [p for p in parts if p]
    return [val_str.strip("'\"[]")]


def compute_ist_hour(dt_utc) -> int:
    """Convert a UTC datetime to IST (UTC+05:30) and return the hour component.

    Args:
        dt_utc: A datetime object in UTC.

    Returns:
        The hour of day in IST (0-23). Returns 0 if input is None or NaT.
    """
    if dt_utc is None or pd.isna(dt_utc):
        return 0
    try:
        ist_dt = dt_utc + timedelta(hours=5, minutes=30)
        return ist_dt.hour
    except Exception:
        return 0


def normalize_range(series: pd.Series, min_val: float, max_val: float) -> pd.Series:
    """Min-max normalize a pandas Series to the range [min_val, max_val].

    Args:
        series: The input numeric pandas Series.
        min_val: The desired minimum of the output range.
        max_val: The desired maximum of the output range.

    Returns:
        A new Series with values scaled to [min_val, max_val].
    """
    s_min = series.min()
    s_max = series.max()

    if s_min == s_max:
        # All values identical — return midpoint of target range
        midpoint = (min_val + max_val) / 2.0
        return pd.Series(midpoint, index=series.index)

    normalized = (series - s_min) / (s_max - s_min)
    return min_val + normalized * (max_val - min_val)
