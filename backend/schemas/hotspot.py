from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class HotspotItem(BaseModel):
    junction_name: str
    latitude: float
    longitude: float
    total_violations: int
    total_cip: float
    avg_cip: float
    rank: int
    police_station: str
    top_violation: str
    unique_vehicles: int


class DBSCANCluster(BaseModel):
    cluster_id: int
    centroid_lat: float
    centroid_lon: float
    size: int
    avg_cip: float


class DBSCANInfo(BaseModel):
    n_clusters: int
    noise_points: int
    top_clusters: List[DBSCANCluster]


class HotspotResponse(BaseModel):
    total_hotspots: int
    method: str
    hotspots: List[HotspotItem]
    dbscan_clusters: DBSCANInfo
