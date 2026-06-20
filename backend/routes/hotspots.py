import logging

from fastapi import APIRouter, HTTPException, Query
from schemas.hotspot import HotspotResponse
from services import hotspot_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Hotspot Intelligence"])


@router.get(
    "/hotspots",
    response_model=HotspotResponse,
    summary="Get parking violation hotspots",
)
def get_hotspots(top_n: int = Query(50, ge=1, le=200)):
    """Return top-N violation hotspots with DBSCAN clustering."""
    try:
        return hotspot_service.get_hotspots(top_n)
    except Exception as exc:
        logger.exception("Failed to get hotspots")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
