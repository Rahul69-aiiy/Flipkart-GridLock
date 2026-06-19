"""
ParkSight AI — FastAPI Application Entry Point
AI-Driven Parking Intelligence for Congestion-Aware Targeted Enforcement
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload dataset on startup."""
    logger.info("🚀 ParkSight AI starting — preloading dataset...")
    from services.data_loader import DataStore
    store = DataStore.get_instance()
    logger.info(
        "✅ Dataset loaded: %d records, %d junctions",
        len(store.df),
        len(store.junction_cip),
    )
    yield
    logger.info("🛑 ParkSight AI shutting down.")


app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS middleware (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register all routers ---
from routes.summary import router as summary_router
from routes.hotspots import router as hotspots_router
from routes.cip import router as cip_router
from routes.forecast import router as forecast_router
from routes.confidence import router as confidence_router
from routes.opportunities import router as opportunities_router
from routes.plan import router as plan_router
from routes.value_proof import router as value_proof_router
from routes.stations import router as stations_router
from routes.coverage import router as coverage_router

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


@app.get("/", tags=["Root"])
def root():
    """Welcome endpoint."""
    return {
        "service": "ParkSight AI",
        "version": settings.app_version,
        "description": settings.app_description,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """Health-check endpoint."""
    from services.data_loader import DataStore
    store = DataStore.get_instance()
    return {
        "status": "healthy",
        "records_loaded": len(store.df),
        "junctions": len(store.junction_cip),
    }
