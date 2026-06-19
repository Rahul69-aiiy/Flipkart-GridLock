# ParkSight AI 🚔

**AI-Driven Parking Intelligence for Congestion-Aware Targeted Enforcement**

ParkSight AI is a data-driven decision support system built on **298,450 Bengaluru Traffic Police parking violation records (Nov 2023 – Apr 2024)**. The platform identifies high-impact parking hotspots, predicts future congestion risk, ranks enforcement opportunities, and optimizes officer deployment using machine learning and operations research.

---

## Key Features

* Congestion Impact Potential (CIP) scoring framework
* Hotspot detection using DBSCAN clustering
* Junction-level congestion forecasting using XGBoost
* Confidence scoring for data reliability
* Opportunity ranking engine for targeted enforcement
* Resource-constrained deployment optimization
* Target-coverage planning optimization
* Station-level performance analytics
* Coverage-efficiency analysis

---

## System Architecture

### M0 — Data Validation

**Endpoint:** `GET /api/summary`

Performs dataset quality checks, filtering statistics, date-range analysis, and validation reporting.

### M1 — Hotspot Intelligence

**Endpoint:** `GET /api/hotspots`

* Junction-level hotspot ranking
* Spatial hotspot discovery using DBSCAN clustering
* Cluster centroid and density analysis

### M2 — Congestion Impact Potential (CIP) Engine

**Endpoint:** `GET /api/cip`

Computes congestion impact scores using weighted violation severity, vehicle type, time-of-day effects, and repeat violation behavior.

### M3 — Forecasting Engine

**Endpoint:** `GET /api/forecast`

Forecasts future junction risk using:

* Moving Average Baseline
* XGBoost Regressor
* Automatic model selection based on MAE

Current implementation selects the model with lower prediction error.

### M4 — Confidence Engine

**Endpoint:** `GET /api/confidence`

Generates confidence scores based on:

* Historical consistency
* Data completeness
* Observation density

### M5 — Opportunity Engine

**Endpoint:** `GET /api/opportunities`

Ranks enforcement opportunities using:

Opportunity Score = Predicted CIP × Confidence Score

Each opportunity also includes:

* Required officer-hours
* Peak enforcement window
* Police station ownership
* Geographic coordinates

### M6 — Resource-Constrained Planning

**Endpoint:** `POST /api/plan/resource`

Uses Google OR-Tools CP-SAT optimization to maximize congestion reduction under a limited officer-hour budget.

### M6b — Target-Coverage Planning

**Endpoint:** `POST /api/plan/target`

Determines the minimum officer-hours required to achieve a desired enforcement coverage target.

### M7 — Value Proof Engine

**Endpoint:** `GET /api/value-proof`

Compares optimized deployment strategies against naïve allocation approaches.

### M8 — Station Efficiency Analytics

**Endpoint:** `GET /api/stations`

Provides station-level productivity and enforcement effectiveness metrics.

### M9 — Coverage Curve Analysis

**Endpoint:** `GET /api/coverage`

Identifies staffing knee-points and diminishing-return regions for enforcement planning.

---

## Congestion Impact Potential (CIP)

CIP is computed using:

CIP = vehicle_weight × violation_weight × time_weight × multi_violation_factor

The score estimates the expected congestion impact of a parking violation.

---

## Data-Driven Officer Hour Estimation

Unlike fixed staffing assumptions, ParkSight AI derives officer-hour requirements from historical enforcement patterns.

For each junction:

1. Aggregate violations by hour
2. Rank hours by violation frequency
3. Identify minimum hours covering 80% of violations
4. Store:

   * `required_officer_hours`
   * `peak_window_start`
   * `peak_window_end`

---

## Machine Learning Pipeline

### Forecasting Features

* Weekly CIP aggregation
* Lag features (1–4 weeks)
* Rolling mean (4 weeks)
* Rolling standard deviation (4 weeks)

### Models

* Moving Average Baseline
* XGBoost Regressor

### Model Selection

The system automatically selects the model with the lower Mean Absolute Error (MAE).

---

## Optimization Pipeline

Dataset
↓
CIP Scoring
↓
Hotspot Detection
↓
Forecasting (XGBoost)
↓
Confidence Scoring
↓
Opportunity Ranking
↓
OR-Tools Optimization
↓
Deployment Plan

---

## Technology Stack

### Backend

* FastAPI
* Pydantic v2

### Machine Learning

* XGBoost
* Scikit-Learn
* DBSCAN

### Optimization

* Google OR-Tools CP-SAT

### Data Processing

* Pandas
* NumPy

### Analytics

* Kneed

---

## Quick Start

```bash
cd backend

pip install -r requirements.txt

uvicorn app:app --reload
```

Open:

http://localhost:8000/docs

for Swagger API documentation.

---

## Tested Endpoints

✅ `/health`

✅ `/api/summary`

✅ `/api/hotspots`

✅ `/api/cip`

✅ `/api/forecast`

✅ `/api/confidence`

✅ `/api/opportunities`

✅ `/api/value-proof`

✅ `/api/stations`

✅ `/api/coverage`

✅ `/api/plan/resource`

✅ `/api/plan/target`

---

## Project Structure

```text
backend/
├── app.py
├── routes/
├── services/
├── schemas/
├── models/
├── utils/
├── data/
└── trained_models/
```

---

## Future Enhancements

* Real-time traffic integration
* Interactive GIS dashboard
* Explainable AI (SHAP)
* Live officer deployment recommendations
* City-wide congestion simulation
* Multi-city scalability

```
```
