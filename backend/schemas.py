from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

MachineType = Literal["L", "M", "H"]
ModelName = Literal["best", "LogReg", "RandomForest", "DNN"]

class PredictRequest(BaseModel):
    air_temp_K: float = Field(
        ...,
        ge=280.0,
        le=320.0,
        description="Air temperature in Kelvin (valid range ~295-305 K)"
    )
    process_temp_K: float = Field(
        ...,
        ge=290.0,
        le=330.0,
        description="Process temperature in Kelvin (valid range ~305-314 K)"
    )
    speed_rpm: float = Field(
        ...,
        ge=800.0,
        le=3500.0,
        description="Rotational speed in RPM (valid range ~1168-2886 rpm)"
    )
    torque_Nm: float = Field(
        ...,
        ge=1.0,
        le=100.0,
        description="Torque in Nm (valid range ~3.8-76.6 Nm)"
    )
    tool_wear_min: float = Field(
        ...,
        ge=0.0,
        le=350.0,
        description="Tool wear time in minutes (valid range ~0-253 min)"
    )
    machine_type: MachineType = Field(
        "M",
        description="Machine product type: L (Low 60%), M (Medium 30%), H (High 10%)"
    )
    model: Optional[ModelName] = Field(
        "best",
        description="Model to use for prediction: best (default), LogReg, RandomForest, or DNN"
    )

class ContributingFactor(BaseModel):
    feature: str
    label: str
    deviation: float
    importance: float
    impact_score: float
    direction: str
    explanation: str

class EngineeredFeatures(BaseModel):
    Temp_diff: float
    Power: float
    Strain: float
    Type_H: float
    Type_L: float
    Type_M: float

class PredictResponse(BaseModel):
    probability: float
    threshold: float
    status: Literal["HEALTHY", "WATCH", "HIGH RISK"]
    message: str
    model: str
    engineered_features: EngineeredFeatures
    contributing_factors: List[ContributingFactor]

class ModelComparisonResult(BaseModel):
    model: str
    probability: float
    threshold: float
    status: Literal["HEALTHY", "WATCH", "HIGH RISK"]
    message: str

class CompareResponse(BaseModel):
    results: List[ModelComparisonResult]
    best_model: str
    engineered_features: EngineeredFeatures

class MetaResponse(BaseModel):
    best_model: str
    thresholds: Dict[str, float]
    watch_factor: float
    metrics: Dict[str, Dict[str, float]]
    rf_feature_importance: Dict[str, float]
    dnn_permutation_importance: Dict[str, float]
    input_ranges: Dict[str, Any]
    failure_rate: float
    versions: Dict[str, str]
    auth_mode: str
