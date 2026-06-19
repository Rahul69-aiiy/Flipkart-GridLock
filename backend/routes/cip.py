from fastapi import APIRouter, HTTPException, Query
from schemas.cip import CIPResponse
from services import cip_service

router = APIRouter(prefix="/api", tags=["CIP Engine"])


@router.get(
    "/cip",
    response_model=CIPResponse,
    summary="Get Congestion Impact Potential scores",
)
def get_cip(top_n: int = Query(50, ge=1, le=200)):
    """Return junction-level CIP scores with full weight transparency."""
    try:
        return cip_service.get_cip_scores(top_n)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
