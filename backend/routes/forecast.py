import logging

from fastapi import APIRouter, HTTPException, Query
from schemas.forecast import ForecastResponse
from services import forecast_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Forecasting"])


@router.get(
    "/forecast",
    response_model=ForecastResponse,
    summary="Get future risk predictions",
)
def get_forecast(top_n: int = Query(30, ge=1, le=200)):
    """Return next-period CIP forecasts per junction."""
    try:
        return forecast_service.get_forecasts(top_n)
    except Exception as exc:
        logger.exception("Failed to get forecasts")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
