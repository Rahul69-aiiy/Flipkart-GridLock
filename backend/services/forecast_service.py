"""
Module 3: Future Risk Prediction (Forecasting Engine)
Compares a moving-average baseline with XGBoost and selects the model
with lower MAE.  Trains on weekly CIP time-series per junction.
"""

import logging
import os

import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder

from services.data_loader import DataStore
from utils.config import settings

logger = logging.getLogger(__name__)


def _build_weekly_df(junction_cip: pd.DataFrame) -> pd.DataFrame:
    """Expand weekly_cip_series dicts into a flat DataFrame."""
    rows = []
    for _, jrow in junction_cip.iterrows():
        series = jrow.get("weekly_cip_series", {})
        if not isinstance(series, dict):
            continue
        for wk, cip in series.items():
            parts = wk.split("-W")
            if len(parts) == 2:
                rows.append({
                    "junction_name": jrow["junction_name"],
                    "year": int(float(parts[0])),
                    "week": int(float(parts[1])),
                    "weekly_cip": float(cip),
                })
    return pd.DataFrame(rows)


def _add_lag_features(wdf: pd.DataFrame) -> pd.DataFrame:
    """Add lag-1…4, rolling mean/std columns per junction."""
    wdf = wdf.sort_values(["junction_name", "year", "week"]).reset_index(drop=True)

    for lag in range(1, 5):
        wdf[f"lag_{lag}"] = wdf.groupby("junction_name")["weekly_cip"].shift(lag)

    wdf["rolling_mean_4w"] = (
        wdf.groupby("junction_name")["weekly_cip"]
        .transform(lambda s: s.shift(1).rolling(4, min_periods=1).mean())
    )
    wdf["rolling_std_4w"] = (
        wdf.groupby("junction_name")["weekly_cip"]
        .transform(lambda s: s.shift(1).rolling(4, min_periods=1).std())
    )
    wdf["rolling_std_4w"] = wdf["rolling_std_4w"].fillna(0)
    return wdf


def get_forecasts(top_n: int = 30) -> dict:
    """
    Produce next-period CIP forecasts per junction.

    Steps:
        1. Build weekly CIP time series from DataStore
        2. Moving-average baseline (last-4-week mean)
        3. XGBoost with lag features
        4. Compare MAE → pick the winner
        5. Return ranked forecasts
    """
    store = DataStore.get_instance()
    jcip = store.junction_cip

    if jcip.empty:
        return {
            "model_used": "none",
            "mae_moving_average": 0.0,
            "mae_xgboost": 0.0,
            "total_junctions_forecast": 0,
            "forecasts": [],
        }

    wdf = _build_weekly_df(jcip)
    if wdf.empty or len(wdf) < 20:
        return {
            "model_used": "none",
            "mae_moving_average": 0.0,
            "mae_xgboost": 0.0,
            "total_junctions_forecast": 0,
            "forecasts": [],
        }

    # Sort chronologically
    wdf = wdf.sort_values(["year", "week"]).reset_index(drop=True)
    all_weeks = wdf[["year", "week"]].drop_duplicates().sort_values(["year", "week"])
    if len(all_weeks) < 6:
        # Not enough temporal depth for meaningful forecast
        return {
            "model_used": "none",
            "mae_moving_average": 0.0,
            "mae_xgboost": 0.0,
            "total_junctions_forecast": 0,
            "forecasts": [],
        }

    # Test set: last 2 weeks
    test_weeks = all_weeks.tail(2)
    test_keys = set(zip(test_weeks["year"], test_weeks["week"]))

    # ---------------------------------------------------------------
    # 1. Moving-average baseline
    # ---------------------------------------------------------------
    ma_errors = []
    for jname, jg in wdf.groupby("junction_name"):
        jg = jg.sort_values(["year", "week"]).reset_index(drop=True)
        for idx, row in jg.iterrows():
            if (row["year"], row["week"]) in test_keys:
                # Mean of up to 4 preceding values
                preceding = jg.iloc[max(0, idx - 4): idx]["weekly_cip"]
                if len(preceding) > 0:
                    pred = preceding.mean()
                    ma_errors.append(abs(pred - row["weekly_cip"]))

    mae_ma = float(np.mean(ma_errors)) if ma_errors else 999.0

    # ---------------------------------------------------------------
    # 2. XGBoost
    # ---------------------------------------------------------------
    le = LabelEncoder()
    wdf["junction_id"] = le.fit_transform(wdf["junction_name"])
    wdf = _add_lag_features(wdf)
    feature_cols = [
        "junction_id", "week", "year",
        "lag_1", "lag_2", "lag_3", "lag_4",
        "rolling_mean_4w", "rolling_std_4w",
    ]
    wdf_clean = wdf.dropna(subset=feature_cols).copy()

    wdf_clean["is_test"] = wdf_clean.apply(
        lambda r: (r["year"], r["week"]) in test_keys, axis=1
    )
    train = wdf_clean[~wdf_clean["is_test"]]
    test = wdf_clean[wdf_clean["is_test"]]

    mae_xgb = 999.0
    model = None
    model_path = os.path.join(settings.model_dir, "xgb_forecast.joblib")
    encoder_path = os.path.join(settings.model_dir, "label_encoder.joblib")

    if len(train) >= 10 and len(test) > 0:
        try:
            loaded_saved = False
            # Try loading saved model first
            if os.path.exists(model_path) and os.path.exists(encoder_path):
                saved_model = joblib.load(model_path)
                saved_le = joblib.load(encoder_path)
                # Check if all current junction names are known to the saved encoder
                current_junctions = set(wdf_clean["junction_name"].unique())
                known_junctions = set(saved_le.classes_)
                unseen = current_junctions - known_junctions
                if unseen:
                    logger.warning(
                        "Saved LabelEncoder missing %d junction(s): %s. "
                        "Re-fitting encoder and retraining model.",
                        len(unseen),
                        list(unseen)[:5],  # log at most 5 names
                    )
                else:
                    # All junctions are known — safe to use saved encoder
                    le = saved_le
                    model = saved_model
                    wdf_clean["junction_id"] = le.transform(wdf_clean["junction_name"])
                    test = wdf_clean[wdf_clean["is_test"]]
                    train = wdf_clean[~wdf_clean["is_test"]]
                    loaded_saved = True
                    logger.info("Loaded saved XGBoost model from %s", model_path)

            if not loaded_saved:
                # (Re-)fit encoder on current data and train a fresh model
                le = LabelEncoder()
                wdf_clean["junction_id"] = le.fit_transform(wdf_clean["junction_name"])
                test = wdf_clean[wdf_clean["is_test"]]
                train = wdf_clean[~wdf_clean["is_test"]]

                model = XGBRegressor(
                    n_estimators=100,
                    max_depth=5,
                    learning_rate=0.1,
                    random_state=42,
                    verbosity=0,
                )
                model.fit(
                    train[feature_cols].values,
                    train["weekly_cip"].values,
                )
                # Save updated model and encoder
                os.makedirs(settings.model_dir, exist_ok=True)
                joblib.dump(model, model_path)
                joblib.dump(le, encoder_path)
                logger.info("Trained and saved XGBoost model to %s", model_path)

            preds = model.predict(test[feature_cols].values)
            mae_xgb = float(np.mean(np.abs(preds - test["weekly_cip"].values)))
        except Exception as exc:
            logger.warning("XGBoost training/prediction failed: %s", exc)

    # ---------------------------------------------------------------
    # 3. Choose winner & produce forecasts
    # ---------------------------------------------------------------
    use_xgb = mae_xgb < mae_ma and model is not None
    model_used = "xgboost" if use_xgb else "moving_average"

    # Generate next-period predictions per junction
    forecasts = []
    jcip_ps = dict(zip(jcip["junction_name"], jcip["police_station"]))

    for jname, jg in wdf.groupby("junction_name"):
        jg = jg.sort_values(["year", "week"]).reset_index(drop=True)
        hist_avg = float(jg["weekly_cip"].mean())

        if use_xgb and model is not None:
            feats = _add_lag_features(jg)
            last_feats = feats.iloc[-1:]
            # Encode junction_id for prediction — safe because le was
            # fit on all current junctions (re-fitted above if needed)
            try:
                last_feats = last_feats.copy()
                last_feats["junction_id"] = le.transform(last_feats["junction_name"])
                pred = float(model.predict(last_feats[feature_cols].values)[0])
            except Exception:
                pred = float(jg["weekly_cip"].tail(4).mean())
        else:
            pred = float(jg["weekly_cip"].tail(4).mean())

        # Trend
        if pred > hist_avg * 1.1:
            trend = "increasing"
        elif pred < hist_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"

        forecasts.append({
            "junction_name": jname,
            "historical_avg_cip": round(hist_avg, 2),
            "predicted_cip": round(max(pred, 0), 2),
            "trend": trend,
            "police_station": str(jcip_ps.get(jname, "Unknown")),
        })

    # Sort and rank
    forecasts.sort(key=lambda f: f["predicted_cip"], reverse=True)
    for rank, f in enumerate(forecasts[:top_n], start=1):
        f["rank"] = rank
    forecasts = forecasts[:top_n]

    return {
        "model_used": model_used,
        "mae_moving_average": round(mae_ma, 4),
        "mae_xgboost": round(mae_xgb, 4),
        "total_junctions_forecast": len(forecasts),
        "forecasts": forecasts,
    }
