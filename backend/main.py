import os
import sys
import logging
import sqlite3
import tempfile
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path for both 'uvicorn backend.main:app' and 'uvicorn main:app'
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from backend.schemas import (
        PredictRequest,
        PredictResponse,
        CompareResponse,
        MetaResponse
    )
    from backend.model_service import model_service
    from backend.auth import get_current_user, is_demo_mode
except (ImportError, ModuleNotFoundError):
    from schemas import (
        PredictRequest,
        PredictResponse,
        CompareResponse,
        MetaResponse
    )
    from model_service import model_service
    from auth import get_current_user, is_demo_mode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("industry_brain.api")

# SQLite database initialization with read-only / reset resilience (Requirement 6)
def init_sqlite_db():
    configured_path = os.getenv("SQLITE_DB_PATH", os.path.join(current_dir, "industry_brain.db"))
    candidates = [
        configured_path,
        os.path.join(tempfile.gettempdir(), "industry_brain.db")
    ]
    for db_path in candidates:
        try:
            db_dir = os.path.dirname(os.path.abspath(db_path))
            os.makedirs(db_dir, exist_ok=True)
            conn = sqlite3.connect(db_path)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    inputs TEXT,
                    probability REAL,
                    status TEXT,
                    model TEXT
                )
            """)
            conn.commit()
            conn.close()
            logger.info("SQLite database verified/initialized at: %s", db_path)
            return db_path
        except Exception as e:
            logger.warning("Could not initialize SQLite at %s: %s", db_path, e)
    return None

init_sqlite_db()

app = FastAPI(
    title="Industry Brain: AI-Based Predictive Maintenance API",
    description="Predictive maintenance assistant evaluating machine failure probabilities on the UCI AI4I 2020 dataset.",
    version="2.0.0"
)

# Enable CORS for Vite dev server and production clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    custom_messages = []
    for err in errors:
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg")
        custom_messages.append(f"Field '{loc}': {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation error. Please check your sensor reading ranges.",
            "errors": custom_messages
        }
    )

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "best_model": model_service.meta.get("best_model", "RandomForest"),
        "dnn_available": model_service.dnn_available,
        "auth_mode": "demo" if is_demo_mode() else "firebase"
    }

@app.get("/api/meta", response_model=MetaResponse)
def get_metadata():
    meta = model_service.meta
    return MetaResponse(
        best_model=meta.get("best_model", "RandomForest"),
        thresholds=meta.get("thresholds", {}),
        watch_factor=float(meta.get("watch_factor", 0.6)),
        metrics=meta.get("metrics", {}),
        rf_feature_importance=meta.get("rf_feature_importance", {}),
        dnn_permutation_importance=meta.get("dnn_permutation_importance", {}),
        input_ranges=meta.get("input_ranges", {}),
        failure_rate=float(meta.get("failure_rate", 0.0339)),
        versions=meta.get("versions", {}),
        auth_mode="demo" if is_demo_mode() else "firebase"
    )

@app.post("/api/predict", response_model=PredictResponse)
def predict(
    req: PredictRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        result = model_service.predict(
            air_temp_K=req.air_temp_K,
            process_temp_K=req.process_temp_K,
            speed_rpm=req.speed_rpm,
            torque_Nm=req.torque_Nm,
            tool_wear_min=req.tool_wear_min,
            machine_type=req.machine_type,
            model_name=req.model or "best"
        )
        return result
    except Exception as e:
        logger.error("Prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/compare", response_model=CompareResponse)
def predict_compare(
    req: PredictRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        result = model_service.compare_all(
            air_temp_K=req.air_temp_K,
            process_temp_K=req.process_temp_K,
            speed_rpm=req.speed_rpm,
            torque_Nm=req.torque_Nm,
            tool_wear_min=req.tool_wear_min,
            machine_type=req.machine_type
        )
        return result
    except Exception as e:
        logger.error("Compare prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sample-readings")
def get_sample_readings(limit: int = 300):
    readings = model_service.get_sample_readings(limit=limit)
    return {
        "count": len(readings),
        "readings": readings
    }

# Serve Frontend React Application directly from FastAPI (SPA Fallback)
def find_dist_dir():
    candidates = [
        os.path.abspath(os.path.join(current_dir, "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
        os.path.abspath(os.path.join(current_dir, "dist")),
    ]
    for d in candidates:
        if os.path.exists(d) and os.path.isdir(d):
            return d
    return candidates[0]

DIST_DIR = find_dist_dir()

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(content={"status": "ok", "message": "Industry Brain API is running. Frontend build not found."})

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept API or documentation routes
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend build not found. Run 'npm run build' inside frontend."})
