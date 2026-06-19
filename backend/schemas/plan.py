from pydantic import BaseModel, Field
from typing import List, Optional


class DeploymentItem(BaseModel):
    junction_name: str
    opportunity_score: float
    police_station: str
    hours: int
    window: str
    latitude: float = 0.0
    longitude: float = 0.0


class ResourcePlanRequest(BaseModel):
    officer_hours: int = Field(..., gt=0, description="Available officer-hours")


class ResourcePlanResponse(BaseModel):
    mode: str
    officer_hours_budget: int
    solver_status: str
    hours_used: int
    coverage_percentage: float
    total_opportunity_available: float
    deployment: List[DeploymentItem]


class TargetPlanRequest(BaseModel):
    target_coverage: float = Field(..., gt=0, le=100, description="Target coverage percentage")


class TargetPlanResponse(BaseModel):
    mode: str
    target_coverage_pct: float
    solver_status: str
    required_officer_hours: int
    achieved_coverage_pct: float
    total_opportunity_available: float
    deployment: List[DeploymentItem]
