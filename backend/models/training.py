"""
XGBoost Training Pipeline
Provides reusable functions for building, training, saving, and loading
the CIP forecasting model.
"""

import os
import logging

import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder

from utils.config import settings

logger = logging.getLogger(__name__)


def build_training_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build a junction × week level dataset with lag features for XGBoost.

    Parameters
    ----------
    df : pd.DataFrame
        The preprocessed violation DataFrame (must contain junction_name,
        year, week_number, record_cip columns).

    Returns
    -------
    pd.DataFrame
        Feature matrix with columns:
        junction_name, junction_id, year, week, weekly_cip,
        lag_1..lag_4, rolling_mean_4w, rolling_std_4w
    """
    named = df[df["junction_name"] != "No Junction"].copy()
    weekly = (
        named.groupby(["junction_name", "year", "week_number"])["record_cip"]
        .sum()
        .reset_index()
        .rename(columns={"week_number": "week", "record_cip": "weekly_cip"})
    )
    weekly = weekly.sort_values(["junction_name", "year", "week"]).reset_index(drop=True)

    # Lag features
    for lag in range(1, 5):
        weekly[f"lag_{lag}"] = weekly.groupby("junction_name")["weekly_cip"].shift(lag)

    weekly["rolling_mean_4w"] = (
        weekly.groupby("junction_name")["weekly_cip"]
        .transform(lambda s: s.shift(1).rolling(4, min_periods=1).mean())
    )
    weekly["rolling_std_4w"] = (
        weekly.groupby("junction_name")["weekly_cip"]
        .transform(lambda s: s.shift(1).rolling(4, min_periods=1).std())
    )
    weekly["rolling_std_4w"] = weekly["rolling_std_4w"].fillna(0)

    # Label-encode junction_name
    le = LabelEncoder()
    weekly["junction_id"] = le.fit_transform(weekly["junction_name"])

    return weekly, le


def train_forecast_model(
    df: pd.DataFrame,
) -> tuple:
    """
    Train an XGBRegressor on junction-week CIP data.

    Parameters
    ----------
    df : pd.DataFrame
        Preprocessed violation DataFrame.

    Returns
    -------
    tuple
        (model, label_encoder, mae_score)
    """
    weekly, le = build_training_dataset(df)

    feature_cols = [
        "junction_id", "week", "year",
        "lag_1", "lag_2", "lag_3", "lag_4",
        "rolling_mean_4w", "rolling_std_4w",
    ]

    clean = weekly.dropna(subset=feature_cols).copy()
    if len(clean) < 20:
        logger.warning("Not enough data to train: %d rows", len(clean))
        return None, le, 999.0

    # Test set: last 2 unique weeks
    all_weeks = clean[["year", "week"]].drop_duplicates().sort_values(["year", "week"])
    test_weeks = all_weeks.tail(2)
    test_keys = set(zip(test_weeks["year"], test_weeks["week"]))

    clean["is_test"] = clean.apply(lambda r: (r["year"], r["week"]) in test_keys, axis=1)
    train = clean[~clean["is_test"]]
    test = clean[clean["is_test"]]

    if len(train) < 10 or len(test) == 0:
        logger.warning("Train=%d / Test=%d — skipping.", len(train), len(test))
        return None, le, 999.0

    model = XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        verbosity=0,
    )
    model.fit(train[feature_cols].values, train["weekly_cip"].values)

    preds = model.predict(test[feature_cols].values)
    mae = float(np.mean(np.abs(preds - test["weekly_cip"].values)))
    logger.info("XGBoost MAE on test set: %.4f", mae)

    return model, le, mae


def save_model(model, encoder, path: str | None = None):
    """Persist model and encoder to disk."""
    base = path or settings.model_dir
    os.makedirs(base, exist_ok=True)
    joblib.dump(model, os.path.join(base, "xgb_forecast.joblib"))
    joblib.dump(encoder, os.path.join(base, "label_encoder.joblib"))
    logger.info("Model saved to %s", base)


def load_model(path: str | None = None):
    """Load model and encoder from disk. Returns (model, encoder) or (None, None)."""
    base = path or settings.model_dir
    model_path = os.path.join(base, "xgb_forecast.joblib")
    encoder_path = os.path.join(base, "label_encoder.joblib")
    if os.path.exists(model_path) and os.path.exists(encoder_path):
        model = joblib.load(model_path)
        encoder = joblib.load(encoder_path)
        logger.info("Model loaded from %s", base)
        return model, encoder
    return None, None
