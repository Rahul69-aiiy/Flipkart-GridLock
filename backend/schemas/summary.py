from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class MissingValueInfo(BaseModel):
    count: int
    percentage: float


class DataQuality(BaseModel):
    issues: List[str]


class DateRange(BaseModel):
    start: str
    end: str


class DataSummaryResponse(BaseModel):
    total_records: int
    original_records: int
    filtered_records: int
    date_range: DateRange
    total_columns: int
    columns: List[str]
    missing_values: Dict[str, MissingValueInfo]
    vehicle_types: Dict[str, int]
    violation_types: Dict[str, int]
    police_stations: Dict[str, int]
    total_police_stations: int
    total_junctions: int
    total_junction_records: int
    data_quality: DataQuality
    duplicate_records: int
    temporal_distribution: Dict[str, int]
