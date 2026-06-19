from fastapi import APIRouter, HTTPException
from schemas.summary import DataSummaryResponse
from services import summary_service

router = APIRouter(prefix="/api", tags=["Data Validation"])


@router.get(
    "/summary",
    response_model=DataSummaryResponse,
    summary="Get dataset summary and validation",
)
def get_summary():
    """Return comprehensive dataset summary and data-quality report."""
    try:
        return summary_service.get_summary()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
