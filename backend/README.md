# ParkSight AI 🚔

**AI-Driven Parking Intelligence for Congestion-Aware Targeted Enforcement**

Built on 298,450 Bengaluru Traffic Police parking violation records (Nov 2023 – Apr 2024).

---

## Architecture — 10 Analytical Modules

| Module | Name | Endpoint | Description |
|--------|------|----------|-------------|
| M0 | Data Validation | `GET /api/summary` | Dataset stats & quality audit |
| M1 | Hotspot Intelligence | `GET /api/hotspots` | Junction CIP ranking + DBSCAN clusters |
| M2 | CIP Engine | `GET /api/cip` | Congestion Impact Potential scores |
| M3 | Forecasting | `GET /api/forecast` | XGBoost vs moving-average predictions |
| M4 | Confidence Engine | `GET /api/confidence` | Data-reliability scores per junction |
| M5 | Opportunity Engine | `GET /api/opportunities` | Ranked enforcement opportunities |
| M6 | Enforcement Planning | `POST /api/plan/resource` | OR-Tools CP-SAT optimisation |
| M6b | Target Planning | `POST /api/plan/target` | Minimise hours for target coverage |
| M7 | Value Proof | `GET /api/value-proof` | Naive vs optimised comparison |
| M8 | Station Efficiency | `GET /api/stations` | Per-station performance metrics |
| M9 | Coverage Curve | `GET /api/coverage` | Optimal staffing knee-point analysis |

---

## CIP Formula

```
CIP = vehicle_weight × violation_weight × time_weight × multi_violation_factor
```

### Officer-Hours (Data-Driven)

For each junction, officer-hours are computed from historical violation
concentration patterns — **not** a fixed 1:1 assumption:

1. Aggregate violations by hour of day
2. Rank hours by violation count (descending)
3. Find minimum hours to cover ≥ 80% of violations
4. Store `required_officer_hours` and `peak_enforcement_window`

---

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000/docs** for interactive Swagger UI.

## Docker

```bash
docker build -t parksight-ai .
docker run -p 8000:8000 -v $(pwd)/../jan\ to\ may\ police\ violation_anonymized791b166.csv:/app/../jan\ to\ may\ police\ violation_anonymized791b166.csv parksight-ai
```

---

## Tech Stack

- **Framework**: FastAPI 0.115
- **ML**: XGBoost, scikit-learn (DBSCAN)
- **Optimisation**: Google OR-Tools CP-SAT
- **Data**: pandas, NumPy
- **Validation**: Pydantic v2
- **Curve Analysis**: kneed

---

## Project Structure

```
backend/
├── app.py                    # FastAPI entry point
├── requirements.txt
├── Dockerfile
├── .env.example
├── utils/
│   ├── config.py             # Pydantic BaseSettings
│   └── weights.py            # Vehicle/violation/time weights
├── services/
│   ├── data_loader.py        # Singleton DataStore + officer-hours
│   ├── preprocessing.py      # JSON parsing, IST conversion
│   ├── summary_service.py    # M0: Data validation
│   ├── hotspot_service.py    # M1: Hotspot detection
│   ├── cip_service.py        # M2: CIP scoring
│   ├── forecast_service.py   # M3: XGBoost forecasting
│   ├── confidence_service.py # M4: Confidence scoring
│   ├── opportunity_service.py# M5: Opportunity ranking
│   ├── plan_service.py       # M6: OR-Tools enforcement planning
│   ├── value_proof_service.py# M7: Strategy comparison
│   ├── station_service.py    # M8: Station efficiency
│   └── coverage_service.py   # M9: Coverage curve
├── schemas/                  # Pydantic response models
├── routes/                   # FastAPI routers
├── models/
│   └── training.py           # XGBoost pipeline
├── data/
└── trained_models/
```

---

## Example API Calls

### Get Summary
```bash
curl http://localhost:8000/api/summary
```

### Get Top-20 Hotspots
```bash
curl "http://localhost:8000/api/hotspots?top_n=20"
```

### Resource-Constrained Planning
```bash
curl -X POST http://localhost:8000/api/plan/resource \
  -H "Content-Type: application/json" \
  -d '{"officer_hours": 15}'
```

### Target Coverage Planning
```bash
curl -X POST http://localhost:8000/api/plan/target \
  -H "Content-Type: application/json" \
  -d '{"target_coverage": 80}'
```
