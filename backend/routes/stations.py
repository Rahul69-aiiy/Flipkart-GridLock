import logging

from fastapi import APIRouter, HTTPException
from schemas.station import StationResponse
from services import station_service

logger = logging.getLogger(__name__)

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
        logger.exception("Failed to get station stats")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
