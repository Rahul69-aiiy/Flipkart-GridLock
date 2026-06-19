"""
Module 9: Coverage Curve Engine (Updated Architecture)
Builds a cumulative coverage curve using data-driven officer-hours per
junction rather than 1-junction = 1-hour.
"""

import logging
from kneed import KneeLocator

from services.opportunity_service import get_opportunities

logger = logging.getLogger(__name__)


def get_coverage_curve() -> dict:
    """
    Build a cumulative coverage curve where the x-axis is cumulative
    officer-hours (not junction count) and each junction contributes
    its data-derived required_officer_hours to the cost axis.

    Uses kneed KneeLocator to find the optimal staffing point.
    Falls back to the first point achieving ≥ 80% coverage if knee
    detection fails.

    Returns
    -------
    dict
        Coverage curve data, knee point, and recommended staffing.
    """
    result = get_opportunities(top_n=200)
    opportunities = result.get("opportunities", [])

    if not opportunities:
        return {
            "total_junctions": 0,
            "curve": [],
            "recommended_staffing": {"officer_hours": 0, "coverage_pct": 0.0},
            "knee_point": 0,
            "full_coverage_hours": 0,
            "marginal_gain_at_knee": 0.0,
        }

    # Sort by opportunity_score desc (greedy ordering)
    sorted_opps = sorted(
        opportunities, key=lambda o: o["opportunity_score"], reverse=True
    )

    total_opportunity = sum(o["opportunity_score"] for o in sorted_opps)
    if total_opportunity == 0:
        return {
            "total_junctions": len(sorted_opps),
            "curve": [],
            "recommended_staffing": {"officer_hours": 0, "coverage_pct": 0.0},
            "knee_point": 0,
            "full_coverage_hours": 0,
            "marginal_gain_at_knee": 0.0,
        }

    # Build curve: x = cumulative officer-hours, y = coverage %
    curve = []
    cumulative_score = 0.0
    cumulative_hours = 0
    x_values = []
    y_values = []

    for opp in sorted_opps:
        hours = opp.get("required_officer_hours", 1)
        cumulative_hours += hours
        cumulative_score += opp["opportunity_score"]
        coverage_pct = round(cumulative_score / total_opportunity * 100, 4)

        curve.append({
            "officer_hours": cumulative_hours,
            "coverage_pct": coverage_pct,
            "junction_added": opp["junction_name"],
            "junction_hours": hours,
        })

        x_values.append(cumulative_hours)
        y_values.append(coverage_pct)

    full_coverage_hours = cumulative_hours

    # --- Knee point detection ---
    knee_point = None
    try:
        if len(x_values) >= 3:
            locator = KneeLocator(
                x_values, y_values, curve="concave", direction="increasing"
            )
            knee_point = locator.knee
            if knee_point is not None:
                logger.info("Knee point detected at officer_hours=%d", knee_point)
    except Exception as exc:
        logger.warning("KneeLocator failed: %s", exc)

    # Fallback: first point where coverage ≥ 80%
    if knee_point is None:
        logger.info("Knee detection failed; falling back to 80%% threshold.")
        for point in curve:
            if point["coverage_pct"] >= 80.0:
                knee_point = point["officer_hours"]
                break
        if knee_point is None:
            knee_point = full_coverage_hours

    # Find coverage at knee
    knee_coverage = 0.0
    knee_idx = 0
    for i, xv in enumerate(x_values):
        if xv >= knee_point:
            knee_coverage = y_values[i]
            knee_idx = i
            break

    # Marginal gain at knee
    if knee_idx + 1 < len(y_values):
        marginal_gain = round(y_values[knee_idx + 1] - y_values[knee_idx], 4)
    elif knee_idx > 0:
        marginal_gain = round(y_values[knee_idx] - y_values[knee_idx - 1], 4)
    else:
        marginal_gain = round(y_values[0], 4) if y_values else 0.0

    return {
        "total_junctions": len(sorted_opps),
        "curve": curve,
        "recommended_staffing": {
            "officer_hours": knee_point,
            "coverage_pct": round(knee_coverage, 2),
        },
        "knee_point": knee_point,
        "full_coverage_hours": full_coverage_hours,
        "marginal_gain_at_knee": marginal_gain,
    }
