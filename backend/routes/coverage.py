import logging

from fastapi import APIRouter, HTTPException
from schemas.coverage import CoverageResponse
from services import coverage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Coverage Curve"])


@router.get(
    "/coverage",
    response_model=CoverageResponse,
    summary="Get coverage curve and optimal staffing",
)
def get_coverage():
    """Return coverage curve with knee-point-based optimal staffing recommendation."""
    try:
        return coverage_service.get_coverage_curve()
    except Exception as exc:
        logger.exception("Failed to get coverage curve")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
