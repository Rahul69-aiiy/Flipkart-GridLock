from fastapi import APIRouter, HTTPException
from schemas.station import StationResponse
from services import station_service

router = APIRouter(prefix="/api", tags=["Station Efficiency"])


@router.get(
    "/stations",
    response_model=StationResponse,
    summary="Get police station efficiency metrics",
)
def get_stations():
    """Return per-station performance metrics and efficiency rankings."""
    try:
        return station_service.get_station_stats()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
