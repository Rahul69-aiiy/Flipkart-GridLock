"""
ParkSight AI — FastAPI Application Entry Point
AI-Driven Parking Intelligence for Congestion-Aware Targeted Enforcement
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from utils.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# Path to the built React frontend
STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload dataset and prewarm caches on startup."""
    logger.info("ParkSight AI starting — preloading dataset...")
    from services.data_loader import DataStore
    store = DataStore.get_instance()
    logger.info(
        "Dataset loaded: %d records, %d junctions",
        len(store.df),
        len(store.junction_cip),
    )
    # Prewarm the most expensive endpoints so first request is instant
    try:
        logger.info("Prewarming caches...")
        from services import summary_service, hotspot_service
        summary_service.get_summary()
        hotspot_service.get_hotspots(100)  # pre-cache top-100 used by Overview map
        hotspot_service.get_hotspots(50)   # pre-cache default top-50
        logger.info("Caches primed — all endpoints ready")
    except Exception as exc:
        logger.warning("Cache prewarm failed (non-fatal): %s", exc)
    yield
    logger.info("🛑 ParkSight AI shutting down.")


app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
    # Keep /docs available for API inspection
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins in dev; in prod the frontend is same-origin so this is a no-op
def _get_allowed_origins() -> list[str]:
    """Read comma-separated CORS origins while keeping local dev usable."""
    raw_origins = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers ──────────────────────────────────────────────────────────────
from routes.summary     import router as summary_router
from routes.hotspots    import router as hotspots_router
from routes.cip         import router as cip_router
from routes.forecast    import router as forecast_router
from routes.confidence  import router as confidence_router
from routes.opportunities import router as opportunities_router
from routes.plan        import router as plan_router
from routes.value_proof import router as value_proof_router
from routes.stations    import router as stations_router
from routes.coverage    import router as coverage_router

app.include_router(summary_router)
app.include_router(hotspots_router)
app.include_router(cip_router)
app.include_router(forecast_router)
app.include_router(confidence_router)
app.include_router(opportunities_router)
app.include_router(plan_router)
app.include_router(value_proof_router)
app.include_router(stations_router)
app.include_router(coverage_router)


@app.get("/health", tags=["Health"])
def health():
    """Health-check endpoint."""
    from services.data_loader import DataStore
    store = DataStore.get_instance()
    records_loaded = len(store.df)
    return {
        "status": "healthy" if records_loaded > 0 else "degraded",
        "records_loaded": records_loaded,
        "junctions": len(store.junction_cip),
    }


# Serve JS/CSS/assets
if STATIC_DIR.exists() and (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        """
        Catch-all route: serve index.html for every non-API path so that
        React Router can handle client-side navigation.
        API routes registered above take priority over this catch-all.
        """
        index = STATIC_DIR / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"error": "Frontend not built. Run: cd frontend && npm run build"}

else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "service": "ParkSight AI",
            "version": settings.app_version,
            "description": settings.app_description,
            "docs": "/docs",
            "note": "Frontend not built yet. Run: cd frontend && npm run build",
        }
