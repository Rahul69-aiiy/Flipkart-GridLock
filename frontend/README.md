# ParkSight AI Dashboard

Enterprise AI intelligence dashboard for Smart Traffic & Parking Analytics.

## Tech Stack

- React (JavaScript)
- Vite
- Tailwind CSS
- React Router
- React Leaflet + Marker Cluster + Heatmap
- Recharts
- Zustand
- Framer Motion
- Axios

## Prerequisites

1. Python backend running on port 8000
2. CSV dataset at repo root (see backend README)

## Quick Start

### 1. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## Demo Flow

Overview → Hotspots → Forecast → Opportunities → Resource Planner → Target Planner → Value Proof

## Pages

| Route | API |
|-------|-----|
| `/` | GET /api/summary |
| `/hotspots` | GET /api/hotspots |
| `/cip` | GET /api/cip |
| `/forecast` | GET /api/forecast |
| `/confidence` | GET /api/confidence |
| `/opportunities` | GET /api/opportunities |
| `/resource-planner` | POST /api/plan/resource |
| `/target-planner` | POST /api/plan/target |
| `/value-proof` | GET /api/value-proof |
| `/stations` | GET /api/stations |
| `/coverage` | GET /api/coverage |
