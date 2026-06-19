"""
Module 7: Value Proof Engine
Compares naive (violation-count-based) vs optimized (opportunity-score-based)
deployment strategies across multiple deployment sizes to quantify the
improvement from ParkSight AI's intelligent ranking.
"""

import logging

from services.data_loader import DataStore
from services.opportunity_service import get_opportunities

logger = logging.getLogger(__name__)

DEPLOYMENT_SIZES = [5, 10, 15, 20, 25, 30, 40, 50]


def get_value_proof() -> dict:
    """
    Compare naive vs optimized deployment strategies.

    Naive: rank junctions by total violation count (descending).
    Optimized: rank junctions by ParkSight opportunity_score (descending).

    For each deployment size K, compute the % of total CIP captured
    by each strategy and the improvement.

    Returns
    -------
    dict
        comparison: list of per-K results
        summary: aggregate improvement statistics
        methodology: explanation string
    """
    store = DataStore.get_instance()
    junction_cip = store.junction_cip.copy()
    opp_result = get_opportunities()
    opportunities = opp_result.get("opportunities", [])

    if junction_cip.empty or not opportunities:
        return {
            "comparison": [],
            "summary": {
                "avg_improvement_pct": 0.0,
                "max_improvement_pct": 0.0,
                "best_deployment_size": 0,
            },
            "methodology": "Insufficient data for comparison.",
        }

    # Total CIP across all junctions
    total_cip_all = junction_cip["total_cip"].sum()

    if total_cip_all == 0:
        return {
            "comparison": [],
            "summary": {
                "avg_improvement_pct": 0.0,
                "max_improvement_pct": 0.0,
                "best_deployment_size": 0,
            },
            "methodology": "Total CIP is zero; cannot compute coverage.",
        }

    # Naive ranking: sort by total_violations descending
    naive_ranked = junction_cip.sort_values("total_violations", ascending=False).reset_index(drop=True)

    # Optimized ranking: sort by opportunity_score descending
    optimized_ranked = sorted(opportunities, key=lambda o: o["opportunity_score"], reverse=True)

    # Build a lookup: junction_name -> total_cip from junction_cip
    cip_lookup = dict(zip(junction_cip["junction_name"], junction_cip["total_cip"]))

    comparison = []
    improvements = []

    for k in DEPLOYMENT_SIZES:
        # --- Naive: top-K by violation count ---
        naive_top = naive_ranked.head(k)
        naive_cip = naive_top["total_cip"].sum()
        naive_coverage_pct = round(naive_cip / total_cip_all * 100, 2)
        naive_junction_names = naive_top["junction_name"].tolist()

        # --- Optimized: top-K by opportunity_score ---
        opt_top = optimized_ranked[:k]
        opt_cip = sum(cip_lookup.get(o["junction_name"], 0) for o in opt_top)
        opt_coverage_pct = round(opt_cip / total_cip_all * 100, 2)
        opt_junction_names = [o["junction_name"] for o in opt_top]

        improvement_pct = round(opt_coverage_pct - naive_coverage_pct, 2)
        improvements.append(improvement_pct)

        comparison.append({
            "deployment_size": k,
            "naive_coverage_pct": naive_coverage_pct,
            "optimized_coverage_pct": opt_coverage_pct,
            "improvement_pct": improvement_pct,
            "naive_junctions": naive_junction_names,
            "optimized_junctions": opt_junction_names,
        })

    # Summary statistics
    avg_improvement = round(sum(improvements) / len(improvements), 2) if improvements else 0.0
    max_improvement = round(max(improvements), 2) if improvements else 0.0
    best_idx = improvements.index(max(improvements)) if improvements else 0
    best_deployment_size = DEPLOYMENT_SIZES[best_idx] if improvements else 0

    methodology = (
        "This comparison evaluates two deployment strategies across multiple "
        "deployment sizes (K = number of junctions staffed). "
        "The NAIVE strategy ranks junctions by raw violation count (total_violations), "
        "representing how a department might deploy without analytics. "
        "The OPTIMIZED strategy ranks junctions by ParkSight AI's opportunity_score, "
        "which blends CIP forecasts, confidence scores, and junction weights. "
        "For each deployment size K, we measure the percentage of total CIP captured "
        "by deploying officers to the top-K junctions under each strategy. "
        "The improvement_pct shows how many additional percentage points of CIP "
        "the optimized strategy captures compared to naive."
    )

    return {
        "comparison": comparison,
        "summary": {
            "avg_improvement_pct": avg_improvement,
            "max_improvement_pct": max_improvement,
            "best_deployment_size": best_deployment_size,
        },
        "methodology": methodology,
    }
