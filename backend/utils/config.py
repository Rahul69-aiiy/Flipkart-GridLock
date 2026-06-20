"""
ParkSight AI - Application Configuration
Uses Pydantic BaseSettings for environment-aware configuration.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    csv_path: str = os.getenv(
    "CSV_PATH",
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "jan to may police violation_anonymized791b166.csv",
    ),
)
    model_dir: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "trained_models",
    )
    app_title: str = "ParkSight AI"
    app_description: str = (
        "AI-Driven Parking Intelligence for Congestion-Aware Targeted Enforcement"
    )
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"


settings = Settings()
