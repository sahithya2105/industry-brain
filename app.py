import os
import math
import json
import logging
import numpy as np
import pandas as pd
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("industry_brain")

app = FastAPI(
    title="Industry Brain: AI-Based Predictive Maintenance System",
    description="Course project for Artificial Intelligence & Deep Learning (AIDL) by Koudagani Sahithya (2403A52063).",
    version="1.0.0"
)

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_PATH = os.path.join(BASE_DIR, "results.json")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.joblib")
LOGREG_PATH = os.path.join(BASE_DIR, "logreg.joblib")
RF_PATH = os.path.join(BASE_DIR, "random_forest.joblib")
DNN_PATH = os.path.join(BASE_DIR, "dnn.keras")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Globals for loaded artifacts
results_data = {}
scaler = None
logreg_model = None
rf_model = None
dnn_model = None
dnn_available = False
dnn_load_error = None

def load_artifacts():
    global results_data, scaler, logreg_model, rf_model, dnn_model, dnn_available, dnn_load_error
    # 1. Load results.json
    with open(RESULTS_PATH, "r") as f:
        results_data = json.load(f)
    logger.info("results.json loaded successfully with keys: %s", list(results_data.keys()))

    # 2. Load Scaler
    scaler = joblib.load(SCALER_PATH)
    logger.info("scaler.joblib loaded successfully.")

    # 3. Load Logistic Regression
    logreg_model = joblib.load(LOGREG_PATH)
    logger.info("logreg.joblib loaded successfully.")

    # 4. Load Random Forest
    rf_model = joblib.load(RF_PATH)
    logger.info("random_forest.joblib loaded successfully.")

    # 5. Load DNN (Optional / Graceful fallback)
    try:
        import keras
        dnn_model = keras.models.load_model(DNN_PATH)
        dnn_available = True
        logger.info("dnn.keras loaded successfully via keras.")
    except Exception as e:
        dnn_available = False
        dnn_load_error = str(e)
        logger.warning("dnn.keras could not be loaded: %s. LogReg and RandomForest remain fully functional.", e)

# Load on startup
load_artifacts()

class PredictRequest(BaseModel):
    air_temp_K: float = Field(..., ge=200.0, le=400.0, description="Air temperature in Kelvin")
    process_temp_K: float = Field(..., ge=200.0, le=400.0, description="Process temperature in Kelvin")
    speed_rpm: float = Field(..., ge=500.0, le=5000.0, description="Rotational speed in RPM")
    torque_Nm: float = Field(..., ge=0.0, le=200.0, description="Torque in Nm")
    tool_wear_min: float = Field(..., ge=0.0, le=500.0, description="Tool wear time in minutes")
    machine_type: Literal["L", "M", "H"] = Field(..., description="Machine variant Type (L, M, H)")
    model: Literal["LogReg", "RandomForest", "DNN"] = Field("RandomForest", description="Model selected for inference")

@app.get("/api/results")
def get_results():
    """Return stored metrics and training artifacts from results.json."""
    return {
        "results": results_data,
        "dnn_available": dnn_available,
        "dnn_load_error": dnn_load_error,
        "student": {
            "name": "Koudagani Sahithya",
            "roll_number": "2403A52063",
            "course": "Artificial Intelligence & Deep Learning (AIDL)"
        }
    }

@app.post("/api/predict")
def predict(req: PredictRequest):
    """
    Run live inference replicating notebook feature engineering:
    Temp_diff = process_temp_K - air_temp_K
    Power = torque_Nm * speed_rpm * 2*pi/60
    Strain = tool_wear_min * torque_Nm
    one-hot columns Type_H, Type_L, Type_M
    """
    if req.model == "DNN" and not dnn_available:
        raise HTTPException(
            status_code=400,
            detail=f"DNN model is currently unavailable for live prediction ({dnn_load_error}). Please select LogReg or RandomForest."
        )

    # 1. Feature Engineering
    temp_diff = req.process_temp_K - req.air_temp_K
    power = req.torque_Nm * req.speed_rpm * 2.0 * math.pi / 60.0
    strain = req.tool_wear_min * req.torque_Nm

    type_h = 1.0 if req.machine_type == "H" else 0.0
    type_l = 1.0 if req.machine_type == "L" else 0.0
    type_m = 1.0 if req.machine_type == "M" else 0.0

    # 2. Build row in exact feature_columns order
    feature_cols = results_data.get("feature_columns", [
        "Air_temperature", "Process_temperature", "Rotational_speed",
        "Torque", "Tool_wear", "Temp_diff", "Power", "Strain",
        "Type_H", "Type_L", "Type_M"
    ])

    raw_data = {
        "Air_temperature": req.air_temp_K,
        "Process_temperature": req.process_temp_K,
        "Rotational_speed": req.speed_rpm,
        "Torque": req.torque_Nm,
        "Tool_wear": req.tool_wear_min,
        "Temp_diff": temp_diff,
        "Power": power,
        "Strain": strain,
        "Type_H": type_h,
        "Type_L": type_l,
        "Type_M": type_m
    }

    df = pd.DataFrame([[raw_data[c] for c in feature_cols]], columns=feature_cols)

    # 3. Apply standard scaler
    scaled_features = scaler.transform(df)

    # 4. Predict probability
    if req.model == "LogReg":
        prob = float(logreg_model.predict_proba(scaled_features)[0][1])
    elif req.model == "RandomForest":
        prob = float(rf_model.predict_proba(scaled_features)[0][1])
    elif req.model == "DNN":
        prob = float(dnn_model.predict(scaled_features, verbose=0)[0][0])
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {req.model}")

    # 5. Compare with tuned threshold from results.json
    thresholds = results_data.get("thresholds", {})
    threshold = float(thresholds.get(req.model, 0.5))

    # Alert levels
    if prob >= threshold:
        status = "HIGH RISK"
        recommendation = "High probability of imminent machine failure. Schedule maintenance now to prevent damage."
    elif prob >= 0.6 * threshold:
        status = "WATCH"
        recommendation = "Elevated stress signatures detected. Monitor closely and schedule inspection during the next maintenance window."
    else:
        status = "HEALTHY"
        recommendation = "Operating within normal parameters. No immediate maintenance intervention required."

    return {
        "model": req.model,
        "probability": round(prob, 4),
        "threshold": round(threshold, 4),
        "raw_probability": prob,
        "raw_threshold": threshold,
        "status": status,
        "recommendation": recommendation,
        "engineered_features": {
            "Temp_diff_K": round(temp_diff, 2),
            "Power_W": round(power, 2),
            "Strain_min_Nm": round(strain, 2)
        },
        "disclaimer": "Models trained on a public benchmark dataset, not real plant data. Results may not transfer to real machines."
    }

# Ensure static directory exists
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
