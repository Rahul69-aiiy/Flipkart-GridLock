from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class ConfidenceItem(BaseModel):
    junction_name: str
    temporal_consistency: float
    data_density: float
    historical_depth: float
    confidence_score: float
    rank: int


class ConfidenceResponse(BaseModel):
    method: str
    components: List[str]
    total_junctions: int
    scores: List[ConfidenceItem]
