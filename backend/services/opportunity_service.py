"""
Module 5: Opportunity Engine
Combines forecast predicted_cip with confidence_score to produce a
ranked list of enforcement opportunities.  Enriches each junction
with its data-derived required_officer_hours and peak_window.
"""

import logging
from functools import lru_cache

from services.data_loader import DataStore
from services.forecast_service import get_forecasts
from services.confidence_service import get_confidence_scores

logger = logging.getLogger(__name__)


@lru_cache(maxsize=4)
def get_opportunities(top_n: int = 30) -> dict:
    """
    Compute opportunity_score = predicted_cip × confidence_score for
    each junction and return the top-N ranked opportunities.

    Each opportunity record also carries:
        - required_officer_hours: data-derived patrol hours
        - peak_window_start / peak_window_end

    Parameters
    ----------
    top_n : int
        Number of top opportunities to return.

    Returns
    -------
    dict
        Formula description, count, and ranked opportunity list.
    """
    store = DataStore.get_instance()
    total_junctions = len(store.junction_cip) if not store.junction_cip.empty else 0
    forecast_limit = max(total_junctions, top_n)

    forecasts_result = get_forecasts(top_n=forecast_limit)
    confidence_result = get_confidence_scores()

    forecasts = forecasts_result.get("forecasts", [])
    scores = confidence_result.get("scores", [])

    if not forecasts or not scores:
        return {
            "formula": "opportunity_score = predicted_cip × confidence_score",
            "total_junctions": 0,
            "opportunities": [],
        }

    # Build lookups
    forecast_map = {f["junction_name"]: f for f in forecasts}
    confidence_map = {s["junction_name"]: s for s in scores}

    # Officer-hours lookup from DataStore
    jcip = store.junction_cip
    jhours = store.junction_hours

    lat_lon = {}
    ps_map = {}
    if not jcip.empty:
        lat_lon = dict(
            zip(jcip["junction_name"], zip(jcip["latitude"], jcip["longitude"]))
        )
        ps_map = dict(zip(jcip["junction_name"], jcip["police_station"]))

    hours_map = {}
    window_map = {}
    if jhours is not None and not jhours.empty:
        for _, hr in jhours.iterrows():
            hours_map[hr["junction_name"]] = int(hr["required_officer_hours"])
            window_map[hr["junction_name"]] = (
                int(hr["peak_window_start"]),
                int(hr["peak_window_end"]),
            )

    # Compute opportunities
    opportunities = []
    common = set(forecast_map.keys()) & set(confidence_map.keys())

    for jname in common:
        predicted_cip = forecast_map[jname]["predicted_cip"]
        conf_score = confidence_map[jname]["confidence_score"]
        opp_score = predicted_cip * conf_score

        ll = lat_lon.get(jname, (0.0, 0.0))
        ws, we = window_map.get(jname, (0, 0))

        opportunities.append({
            "junction_name": jname,
            "predicted_cip": round(predicted_cip, 2),
            "confidence_score": round(conf_score, 4),
            "opportunity_score": round(opp_score, 4),
            "latitude": round(float(ll[0]), 6),
            "longitude": round(float(ll[1]), 6),
            "police_station": str(ps_map.get(jname, "Unknown")),
            "required_officer_hours": hours_map.get(jname, 1),
            "peak_window_start": ws,
            "peak_window_end": we,
        })

    # Sort and rank
    # Sort and rank
    opportunities.sort(
        key=lambda o: o["opportunity_score"],
        reverse=True
    )

    total_opportunities = len(opportunities)

    for rank, o in enumerate(opportunities[:top_n], start=1):
        o["rank"] = rank

    opportunities = opportunities[:top_n]

    return {
    "formula": "opportunity_score = predicted_cip × confidence_score",
    "total_junctions": total_opportunities,
    "opportunities": opportunities,
    }