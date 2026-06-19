from fastapi import APIRouter, HTTPException
from schemas.confidence import ConfidenceResponse
from services import confidence_service

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
        raise HTTPException(status_code=500, detail=str(exc))
