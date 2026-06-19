from fastapi import APIRouter, HTTPException
from schemas.value_proof import ValueProofResponse
from services import value_proof_service

router = APIRouter(prefix="/api", tags=["Value Proof"])


@router.get(
    "/value-proof",
    response_model=ValueProofResponse,
    summary="Compare naive vs optimized strategy",
)
def get_value_proof():
    """Compare naive vs AI-optimized deployment strategies across deployment sizes."""
    try:
        return value_proof_service.get_value_proof()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
