from pydantic import BaseModel
from typing import List, Optional


class CurvePoint(BaseModel):
    officer_hours: int
    coverage_pct: float
    junction_added: str
    junction_hours: int = 1


class RecommendedStaffing(BaseModel):
    officer_hours: int
    coverage_pct: float


class CoverageResponse(BaseModel):
    total_junctions: int
    curve: List[CurvePoint]
    recommended_staffing: RecommendedStaffing
    knee_point: int
    full_coverage_hours: int
    marginal_gain_at_knee: float
