from fastapi import APIRouter, HTTPException, Query
from schemas.opportunity import OpportunityResponse
from services import opportunity_service

router = APIRouter(prefix="/api", tags=["Opportunity Engine"])


@router.get(
    "/opportunities",
    response_model=OpportunityResponse,
    summary="Get ranked enforcement opportunities",
)
def get_opportunities(top_n: int = Query(30, ge=1, le=200)):
    """Return ranked enforcement opportunities with officer-hours and peak windows."""
    try:
        return opportunity_service.get_opportunities(top_n)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
