from pydantic import BaseModel, Field
from typing import List, Optional


class OpportunityItem(BaseModel):
    junction_name: str
    predicted_cip: float
    confidence_score: float
    opportunity_score: float
    rank: int
    latitude: float
    longitude: float
    police_station: str
    required_officer_hours: int
    peak_window_start: int
    peak_window_end: int


class OpportunityResponse(BaseModel):
    formula: str
    total_junctions: int
    opportunities: List[OpportunityItem]
