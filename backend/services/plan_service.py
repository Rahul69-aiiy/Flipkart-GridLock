"""
Module 6: Enforcement Planning Engine (Updated Architecture)
Uses OR-Tools CP-SAT Solver with DATA-DRIVEN officer-hours per junction.

Cost per junction = required_officer_hours (derived from hourly violation
concentration — minimum hours to cover ≥ 80% of historical violations).

Value per junction = opportunity_score.

Mode A: Maximize opportunity_score subject to Σ(hours) ≤ budget
Mode B: Minimize Σ(hours) subject to coverage ≥ target %
"""

import logging
from ortools.sat.python import cp_model

from services.opportunity_service import get_opportunities

logger = logging.getLogger(__name__)


def _get_solver_status_name(status: int) -> str:
    """Map CP-SAT solver status code to human-readable string."""
    status_map = {
        cp_model.UNKNOWN: "UNKNOWN",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.OPTIMAL: "OPTIMAL",
    }
    return status_map.get(status, f"STATUS_{status}")


def _format_window(start: int, end: int) -> str:
    """Format hour ints into a readable window string like '08:00-12:00'."""
    return f"{start:02d}:00-{end:02d}:00"


def _greedy_select_resource(opportunities: list, budget: int) -> list:
    """Greedy fallback for resource-constrained mode: pick by score/cost efficiency."""
    for o in opportunities:
        cost = o.get("required_officer_hours", 1)
        o["_efficiency"] = o["opportunity_score"] / max(cost, 1)

    sorted_opps = sorted(opportunities, key=lambda o: o["_efficiency"], reverse=True)
    selected = []
    remaining = budget
    for opp in sorted_opps:
        cost = opp.get("required_officer_hours", 1)
        if cost <= remaining:
            selected.append(opp)
            remaining -= cost
    return selected


def _greedy_select_target(opportunities: list, target_score: float) -> list:
    """Greedy fallback for target-constrained mode."""
    sorted_opps = sorted(opportunities, key=lambda o: o["opportunity_score"], reverse=True)
    selected = []
    cumulative = 0.0
    for opp in sorted_opps:
        selected.append(opp)
        cumulative += opp["opportunity_score"]
        if cumulative >= target_score:
            break
    return selected


def plan_by_resource(officer_hours: int) -> dict:
    """
    MODE A — Resource-constrained planning.

    Maximize total opportunity_score coverage given an officer-hours budget.
    Cost per junction = required_officer_hours (data-driven).

    Parameters
    ----------
    officer_hours : int
        Maximum available officer-hours for deployment.

    Returns
    -------
    dict
        Deployment plan with selected junctions, hours, windows, and coverage.
    """
    result = get_opportunities(top_n=200)
    opportunities = result.get("opportunities", [])

    if not opportunities:
        return {
            "mode": "resource_constrained",
            "officer_hours_budget": officer_hours,
            "solver_status": "NO_DATA",
            "hours_used": 0,
            "coverage_percentage": 0.0,
            "total_opportunity_available": 0.0,
            "deployment": [],
        }

    total_opportunity = sum(o["opportunity_score"] for o in opportunities)
    n = len(opportunities)

    # Per-junction cost in officer-hours (data-driven)
    costs = [o.get("required_officer_hours", 1) for o in opportunities]

    # Scale scores to integers for CP-SAT (× 1000)
    int_scores = [int(o["opportunity_score"] * 1000) for o in opportunities]

    # --- Build CP-SAT model ---
    model = cp_model.CpModel()
    x = [model.NewBoolVar(f"junction_{i}") for i in range(n)]

    # Constraint: total hours ≤ budget
    model.Add(sum(x[i] * costs[i] for i in range(n)) <= officer_hours)

    # Objective: maximize total opportunity score
    model.Maximize(sum(x[i] * int_scores[i] for i in range(n)))

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    solver_status = _get_solver_status_name(status)
    logger.info("plan_by_resource solver status: %s", solver_status)

    # --- Extract solution or fall back to greedy ---
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        selected = [opportunities[i] for i in range(n) if solver.Value(x[i])]
    else:
        logger.warning("CP-SAT failed (status=%s), falling back to greedy.", solver_status)
        solver_status = f"{solver_status}_GREEDY_FALLBACK"
        selected = _greedy_select_resource(opportunities, officer_hours)

    # Build deployment output
    deployment = []
    hours_used = 0
    for opp in selected:
        h = opp.get("required_officer_hours", 1)
        hours_used += h
        ws = opp.get("peak_window_start", 0)
        we = opp.get("peak_window_end", 0)
        deployment.append({
            "junction_name": opp["junction_name"],
            "opportunity_score": round(opp["opportunity_score"], 4),
            "police_station": opp["police_station"],
            "hours": h,
            "window": _format_window(ws, we),
            "latitude": opp.get("latitude", 0.0),
            "longitude": opp.get("longitude", 0.0),
        })

    total_covered = sum(d["opportunity_score"] for d in deployment)
    coverage_pct = (total_covered / total_opportunity * 100) if total_opportunity > 0 else 0.0

    return {
        "mode": "resource_constrained",
        "officer_hours_budget": officer_hours,
        "solver_status": solver_status,
        "hours_used": hours_used,
        "coverage_percentage": round(coverage_pct, 2),
        "total_opportunity_available": round(total_opportunity, 4),
        "deployment": deployment,
    }


def plan_by_target(target_coverage: float) -> dict:
    """
    MODE B — Target-constrained planning.

    Minimize total officer-hours required to achieve ≥ target_coverage %
    of total opportunity score.

    Parameters
    ----------
    target_coverage : float
        Desired coverage percentage (0-100).

    Returns
    -------
    dict
        Deployment plan with required hours and selected junctions.
    """
    result = get_opportunities(top_n=200)
    opportunities = result.get("opportunities", [])

    if not opportunities:
        return {
            "mode": "target_constrained",
            "target_coverage_pct": target_coverage,
            "solver_status": "NO_DATA",
            "required_officer_hours": 0,
            "achieved_coverage_pct": 0.0,
            "total_opportunity_available": 0.0,
            "deployment": [],
        }

    total_opportunity = sum(o["opportunity_score"] for o in opportunities)
    target_opportunity = (target_coverage / 100.0) * total_opportunity
    n = len(opportunities)

    costs = [o.get("required_officer_hours", 1) for o in opportunities]
    int_scores = [int(o["opportunity_score"] * 1000) for o in opportunities]
    int_target = int(target_opportunity * 1000)

    # --- Build CP-SAT model ---
    model = cp_model.CpModel()
    x = [model.NewBoolVar(f"junction_{i}") for i in range(n)]

    # Constraint: total opportunity ≥ target
    model.Add(sum(x[i] * int_scores[i] for i in range(n)) >= int_target)

    # Objective: minimize total officer-hours
    model.Minimize(sum(x[i] * costs[i] for i in range(n)))

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    solver_status = _get_solver_status_name(status)
    logger.info("plan_by_target solver status: %s", solver_status)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        selected = [opportunities[i] for i in range(n) if solver.Value(x[i])]
    else:
        logger.warning("CP-SAT failed (status=%s), falling back to greedy.", solver_status)
        solver_status = f"{solver_status}_GREEDY_FALLBACK"
        selected = _greedy_select_target(opportunities, target_opportunity)

    deployment = []
    required_hours = 0
    for opp in selected:
        h = opp.get("required_officer_hours", 1)
        required_hours += h
        ws = opp.get("peak_window_start", 0)
        we = opp.get("peak_window_end", 0)
        deployment.append({
            "junction_name": opp["junction_name"],
            "opportunity_score": round(opp["opportunity_score"], 4),
            "police_station": opp["police_station"],
            "hours": h,
            "window": _format_window(ws, we),
            "latitude": opp.get("latitude", 0.0),
            "longitude": opp.get("longitude", 0.0),
        })

    total_covered = sum(d["opportunity_score"] for d in deployment)
    achieved_pct = (total_covered / total_opportunity * 100) if total_opportunity > 0 else 0.0

    return {
        "mode": "target_constrained",
        "target_coverage_pct": target_coverage,
        "solver_status": solver_status,
        "required_officer_hours": required_hours,
        "achieved_coverage_pct": round(achieved_pct, 2),
        "total_opportunity_available": round(total_opportunity, 4),
        "deployment": deployment,
    }
