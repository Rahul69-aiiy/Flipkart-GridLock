import logging

from fastapi import APIRouter, HTTPException
from schemas.confidence import ConfidenceResponse
from services import confidence_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Confidence Engine"])


@router.get(
    "/confidence",
    response_model=ConfidenceResponse,
    summary="Get confidence scores",
)
def get_confidence():
    """Return data-reliability confidence scores per junction."""
    try:
        return confidence_service.get_confidence_scores()
    except Exception as exc:
        logger.exception("Failed to get confidence scores")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
