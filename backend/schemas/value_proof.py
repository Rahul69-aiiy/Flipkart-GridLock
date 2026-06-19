from pydantic import BaseModel
from typing import List


class ComparisonItem(BaseModel):
    deployment_size: int
    naive_coverage_pct: float
    optimized_coverage_pct: float
    improvement_pct: float


class ValueProofSummary(BaseModel):
    avg_improvement_pct: float
    max_improvement_pct: float
    best_deployment_size: int


class ValueProofResponse(BaseModel):
    comparison: List[ComparisonItem]
    summary: ValueProofSummary
    methodology: str
