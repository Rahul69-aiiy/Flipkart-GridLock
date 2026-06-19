from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class TimeWeights(BaseModel):
    peak: float = 2.0
    shoulder: float = 1.5
    off_peak: float = 1.0


class WeightsUsed(BaseModel):
    vehicle_weights: Dict[str, float]
    violation_weights: Dict[str, float]
    time_weights: TimeWeights


class CIPJunction(BaseModel):
    junction_name: str
    total_cip: float
    avg_cip: float
    total_violations: int
    junction_weight: float
    latitude: float
    longitude: float
    police_station: str
    top_violation: str
    rank: int


class CIPDistribution(BaseModel):
    mean: float
    median: float
    std: float
    min: float
    max: float


class CIPResponse(BaseModel):
    total_junctions: int
    formula: str
    weights_used: WeightsUsed
    junctions: List[CIPJunction]
    cip_distribution: CIPDistribution
