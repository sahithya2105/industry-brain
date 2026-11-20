# Stage 1: Build the React + Vite Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Environment
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models/artifacts, and compiled frontend assets
COPY backend/ ./backend/
COPY artifacts/ ./artifacts/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV KERAS_HOME=/app/artifacts/.keras

EXPOSE 8000

# Start FastAPI application
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
