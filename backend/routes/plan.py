from fastapi import APIRouter, HTTPException
from schemas.plan import (
    ResourcePlanRequest,
    ResourcePlanResponse,
    TargetPlanRequest,
    TargetPlanResponse,
)
from services import plan_service

router = APIRouter(prefix="/api", tags=["Enforcement Planning"])


@router.post(
    "/plan/resource",
    response_model=ResourcePlanResponse,
    summary="Plan by resource constraint",
)
def plan_resource(request: ResourcePlanRequest):
    """Maximize opportunity coverage given an officer-hours budget."""
    try:
        return plan_service.plan_by_resource(request.officer_hours)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/plan/target",
    response_model=TargetPlanResponse,
    summary="Plan by target coverage",
)
def plan_target(request: TargetPlanRequest):
    """Minimize officer-hours to achieve target coverage percentage."""
    try:
        return plan_service.plan_by_target(request.target_coverage)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
