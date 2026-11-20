import os
import json
import math
import logging
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger("industry_brain.model_service")

# Resolve artifact directory (handle runs from project root or backend/)
POSSIBLE_ARTIFACT_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts")),
    os.path.abspath(os.path.dirname(__file__)),
    os.path.abspath(".")
]

ARTIFACT_DIR = None
for d in POSSIBLE_ARTIFACT_DIRS:
    if os.path.exists(os.path.join(d, "model_meta.json")):
        ARTIFACT_DIR = d
        break

if ARTIFACT_DIR is None:
    raise RuntimeError(f"Could not find model_meta.json in any expected path: {POSSIBLE_ARTIFACT_DIRS}")

logger.info("Found artifacts directory at: %s", ARTIFACT_DIR)

# Set KERAS_HOME locally to avoid sandbox permission errors with ~/.keras
keras_cache = os.path.join(ARTIFACT_DIR, ".keras")
os.makedirs(keras_cache, exist_ok=True)
os.environ["KERAS_HOME"] = keras_cache

# Artifact file paths
SCALER_PATH = os.path.join(ARTIFACT_DIR, "scaler.joblib")
LOGREG_PATH = os.path.join(ARTIFACT_DIR, "logreg.joblib")
RF_PATH = os.path.join(ARTIFACT_DIR, "random_forest.joblib")
DNN_PATH = os.path.join(ARTIFACT_DIR, "dnn.keras")
META_PATH = os.path.join(ARTIFACT_DIR, "model_meta.json")
SAMPLE_CSV_PATH = os.path.join(ARTIFACT_DIR, "sample_readings.csv")

class ModelService:
    def __init__(self):
        self.meta: Dict[str, Any] = {}
        self.scaler = None
        self.logreg = None
        self.random_forest = None
        self.dnn = None
        self.dnn_available = False
        self.dnn_error = None
        self.sample_df: pd.DataFrame = pd.DataFrame()
        self.feature_columns: List[str] = []
        self.friendly_names = {
            "Tool_wear": "Tool wear",
            "Torque": "Torque load",
            "Rotational_speed": "Rotational speed",
            "Strain": "Mechanical strain",
            "Power": "Power consumption",
            "Temp_diff": "Temperature difference",
            "Air_temperature": "Air temperature",
            "Process_temperature": "Process temperature",
            "Type_L": "Low variant (Type L)",
            "Type_M": "Medium variant (Type M)",
            "Type_H": "High variant (Type H)"
        }
        self.load_artifacts()

    def load_artifacts(self):
        # 1. Load Metadata
        with open(META_PATH, "r") as f:
            self.meta = json.load(f)
        self.feature_columns = self.meta["feature_columns"]
        logger.info("Loaded model metadata. Best model: %s", self.meta.get("best_model"))

        # 2. Load Scaler
        self.scaler = joblib.load(SCALER_PATH)
        logger.info("Loaded StandardScaler successfully.")

        # 3. Load Scikit-Learn Models
        self.logreg = joblib.load(LOGREG_PATH)
        self.random_forest = joblib.load(RF_PATH)
        logger.info("Loaded Logistic Regression and Random Forest models.")

        # 4. Load Keras DNN
        try:
            import keras
            self.dnn = keras.models.load_model(DNN_PATH)
            self.dnn_available = True
            logger.info("Loaded Keras DNN model successfully.")
        except Exception as e:
            self.dnn_available = False
            self.dnn_error = str(e)
            logger.warning("Could not load Keras DNN model: %s", e)

        # 5. Load Sample Readings
        if os.path.exists(SAMPLE_CSV_PATH):
            self.sample_df = pd.read_csv(SAMPLE_CSV_PATH)
            logger.info("Loaded %d sample test readings.", len(self.sample_df))
        else:
            logger.warning("sample_readings.csv not found at %s", SAMPLE_CSV_PATH)

    def engineer_features(
        self,
        air_temp_K: float,
        process_temp_K: float,
        speed_rpm: float,
        torque_Nm: float,
        tool_wear_min: float,
        machine_type: str
    ) -> Tuple[pd.DataFrame, Dict[str, float]]:
        """Replicates notebook feature engineering and builds row in exact feature_columns order."""
        temp_diff = float(process_temp_K - air_temp_K)
        power = float(torque_Nm * speed_rpm * 2.0 * math.pi / 60.0)
        strain = float(tool_wear_min * torque_Nm)

        type_h = 1.0 if machine_type == "H" else 0.0
        type_l = 1.0 if machine_type == "L" else 0.0
        type_m = 1.0 if machine_type == "M" else 0.0

        raw_map = {
            "Air_temperature": float(air_temp_K),
            "Process_temperature": float(process_temp_K),
            "Rotational_speed": float(speed_rpm),
            "Torque": float(torque_Nm),
            "Tool_wear": float(tool_wear_min),
            "Temp_diff": temp_diff,
            "Power": power,
            "Strain": strain,
            "Type_H": type_h,
            "Type_L": type_l,
            "Type_M": type_m
        }

        row_values = [raw_map[c] for c in self.feature_columns]
        df = pd.DataFrame([row_values], columns=self.feature_columns)

        engineered_dict = {
            "Temp_diff": round(temp_diff, 2),
            "Power": round(power, 2),
            "Strain": round(strain, 2),
            "Type_H": type_h,
            "Type_L": type_l,
            "Type_M": type_m
        }

        return df, engineered_dict

    def compute_contributing_factors(self, df_raw: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Uses per-feature deviation from the training mean (from scaler's mean_ and scale_)
        weighted by the Random Forest feature importance, providing plain-English explanations.
        """
        means = self.scaler.mean_
        scales = self.scaler.scale_
        rf_imp = self.meta.get("rf_feature_importance", {})

        factors = []
        for i, col in enumerate(self.feature_columns):
            val = float(df_raw.iloc[0, i])
            mean_val = float(means[i])
            scale_val = float(scales[i]) if scales[i] > 1e-8 else 1.0

            z_score = (val - mean_val) / scale_val
            importance = float(rf_imp.get(col, 0.0))
            impact_score = abs(z_score) * importance

            friendly = self.friendly_names.get(col, col)
            direction = "above" if z_score >= 0 else "below"
            sign_str = "+" if z_score >= 0 else "-"

            explanation = (
                f"{friendly} is {abs(z_score):.1f} standard deviations {direction} normal "
                f"({sign_str}{abs(z_score):.1f}σ)"
            )

            factors.append({
                "feature": col,
                "label": friendly,
                "deviation": round(z_score, 2),
                "importance": round(importance, 4),
                "impact_score": round(impact_score, 4),
                "direction": direction,
                "explanation": explanation
            })

        # Sort descending by impact_score and return top 3
        factors.sort(key=lambda x: x["impact_score"], reverse=True)
        return factors[:3]

    def predict_one(self, model_name: str, scaled_x: np.ndarray) -> Tuple[float, float, str, str]:
        """Runs prediction for a single model and evaluates risk status against tuned threshold."""
        resolved = self.meta["best_model"] if model_name == "best" else model_name

        if resolved == "LogReg":
            prob = float(self.logreg.predict_proba(scaled_x)[:, 1][0])
        elif resolved == "RandomForest":
            prob = float(self.random_forest.predict_proba(scaled_x)[:, 1][0])
        elif resolved == "DNN":
            if not self.dnn_available:
                raise ValueError(f"DNN model is unavailable: {self.dnn_error}")
            prob = float(self.dnn.predict(scaled_x, verbose=0).ravel()[0])
        else:
            raise ValueError(f"Unknown model name: {model_name}")

        th = float(self.meta["thresholds"].get(resolved, 0.5))
        watch_factor = float(self.meta.get("watch_factor", 0.6))

        if prob >= th:
            status = "HIGH RISK"
            msg = "Schedule maintenance now"
        elif prob >= th * watch_factor:
            status = "WATCH"
            msg = "Monitor closely"
        else:
            status = "HEALTHY"
            msg = "Operating normally"

        return round(prob, 4), round(th, 4), status, msg

    def predict(
        self,
        air_temp_K: float,
        process_temp_K: float,
        speed_rpm: float,
        torque_Nm: float,
        tool_wear_min: float,
        machine_type: str,
        model_name: str = "best"
    ) -> Dict[str, Any]:
        df_raw, eng_features = self.engineer_features(
            air_temp_K, process_temp_K, speed_rpm, torque_Nm, tool_wear_min, machine_type
        )
        scaled_x = self.scaler.transform(df_raw)
        resolved_model = self.meta["best_model"] if model_name == "best" else model_name
        prob, th, status, msg = self.predict_one(resolved_model, scaled_x)
        factors = self.compute_contributing_factors(df_raw)

        return {
            "probability": prob,
            "threshold": th,
            "status": status,
            "message": msg,
            "model": resolved_model,
            "engineered_features": eng_features,
            "contributing_factors": factors
        }

    def compare_all(
        self,
        air_temp_K: float,
        process_temp_K: float,
        speed_rpm: float,
        torque_Nm: float,
        tool_wear_min: float,
        machine_type: str
    ) -> Dict[str, Any]:
        df_raw, eng_features = self.engineer_features(
            air_temp_K, process_temp_K, speed_rpm, torque_Nm, tool_wear_min, machine_type
        )
        scaled_x = self.scaler.transform(df_raw)

        results = []
        for m in ["RandomForest", "LogReg", "DNN"]:
            try:
                prob, th, status, msg = self.predict_one(m, scaled_x)
                results.append({
                    "model": m,
                    "probability": prob,
                    "threshold": th,
                    "status": status,
                    "message": msg
                })
            except Exception as e:
                logger.warning("Error predicting with %s: %s", m, e)

        return {
            "results": results,
            "best_model": self.meta["best_model"],
            "engineered_features": eng_features
        }

    def get_sample_readings(self, limit: int = 300) -> List[Dict[str, Any]]:
        if self.sample_df.empty:
            return []
        records = self.sample_df.head(limit).to_dict(orient="records")
        return records

# Singleton instance
model_service = ModelService()
