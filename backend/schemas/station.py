from pydantic import BaseModel
from typing import List


class StationItem(BaseModel):
    police_station: str
    total_violations: int
    total_cip: float
    avg_cip: float
    unique_officers: int
    unique_devices: int
    junctions_covered: int
    unique_vehicles: int
    cip_per_officer: float
    violations_per_officer: float
    violations_per_device: float
    efficiency_rank: int


class StationResponse(BaseModel):
    total_stations: int
    stations: List[StationItem]
