# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_OUT_DIR=/app/static
RUN npm run build

# ── Stage 2: Python + FastAPI backend ────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /app/static ./static

# CSV is volume-mounted at runtime
ENV CSV_PATH=/app/data/dataset.csv
ENV MODEL_DIR=/app/trained_models

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
