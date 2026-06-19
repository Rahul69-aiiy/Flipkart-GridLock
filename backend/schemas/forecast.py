from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class ForecastItem(BaseModel):
    junction_name: str
    historical_avg_cip: float
    predicted_cip: float
    trend: str
    police_station: str
    rank: int


class ForecastResponse(BaseModel):
    model_used: str
    mae_moving_average: float
    mae_xgboost: float
    total_junctions_forecast: int
    forecasts: List[ForecastItem]
