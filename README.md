# Industry Brain: AI-Based Predictive Maintenance System

> **AIDL Course Project** | **Koudagani Sahithya (2403A52063)** | **SR University**  
> **Live demo:** [https://industry-brain.onrender.com](https://industry-brain.onrender.com) *(or insert your Render deployment URL here)*

---

## 1. Project Overview

**Industry Brain** is an AI-based predictive maintenance assistant built for an Artificial Intelligence & Deep Learning (AIDL) course project. It predicts the probability of machine failure from real-time operational sensor telemetry: air temperature, process temperature, rotational speed, torque load, tool wear duration, and machine quality variant.

The project evaluates and compares three machine learning architectures trained on the benchmark dataset:
1. **Logistic Regression** (L2-regularized linear baseline)
2. **Random Forest Classifier** (300 estimators, depth 12 - Selected best model)
3. **Deep Neural Network** (7-layer sequential Keras model with Batch Normalization and Dropout)

---

## 2. Dataset: UCI AI4I 2020 Benchmark

- **Source:** [UCI Machine Learning Repository: AI4I 2020 Predictive Maintenance Dataset](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset)
- **Size:** 10,000 records
- **Class Imbalance:** 3.39% machine failures (339 failure events, 9,661 normal operating records)
- **Nature of Data:** Per the official UCI documentation, this is a **synthetic benchmark dataset** designed to simulate real machine telemetry and failure modes (Tool Wear Failure, Heat Dissipation Failure, Power Failure, and Overstrain Failure). Results reflect theoretical failure mechanics and require calibration before application to physical plant equipment.

---

## 3. Empirical Model Evaluation Results

Evaluated on 1,500 held-out test samples with tuned decision alert thresholds:

| Model Architecture | Threshold | Accuracy | Precision (Fail) | Recall (Fail) | F1-Score (Fail) | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (L2 Baseline) | 0.9065 | 96.7% | 0.513 | 0.392 | 0.444 | 0.937 | 0.443 |
| **Random Forest** (Best Model) | **0.4259** | **99.3%** | **0.955** | **0.824** | **0.884** | **0.985** | **0.906** |
| **Deep Neural Network** (Keras) | 0.8213 | 97.1% | 0.556 | 0.686 | 0.614 | 0.971 | 0.611 |

*Note on Evaluation:* Because the failure rate is 3.39%, naive accuracy is misleading (a dummy model predicting "no failure" achieves 96.61% accuracy but 0% recall). Models are tuned to maximize **F1-Score, Recall on the failure class, and PR-AUC**.

---

## 4. Honest Project Disclaimers

1. **Synthetic Benchmark:** The AI4I 2020 dataset is a simulated academic benchmark dataset from UCI, not real factory telemetry.
2. **Simulated Live Monitor:** The Live Monitor page is a simulated replay stream of AI4I 2020 test rows, not a live industrial IoT sensor stream.
3. **Demo Mode Authentication:** Sign-in operates in Demo Mode for presentation and evaluation purposes (no real credentials, corporate accounts, or OAuth verification).
4. **Heuristic Contributing Factors:** The top contributing factors breakdown calculates feature deviation from dataset normal multiplied by model feature importance. It is a heuristic explanation, not SHAP or TreeSHAP.

---

## 5. Running the Project Locally

### Option A: Using Docker (Recommended for Production Parity)

```bash
# Build the multi-stage Docker image
docker build -t industry-brain .

# Run the container
docker run -p 8000:8000 -e PORT=8000 industry-brain
```
Open **http://localhost:8000** in your browser.

---

### Option B: Running Manually

#### 1. Backend (FastAPI)
```bash
# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server from project root
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser. API requests are automatically proxied to the backend at `http://localhost:8000`.

To build the production frontend for FastAPI to serve directly:
```bash
cd frontend
npm run build
```

---

## 6. Project Architecture

```
industry-brain/
├── artifacts/                     # Trained models and notebook outputs
│   ├── scaler.joblib              # StandardScaler fitted on training features
│   ├── logreg.joblib              # Logistic Regression model
│   ├── random_forest.joblib       # Random Forest model (best)
│   ├── dnn.keras                  # Keras Deep Neural Network
│   ├── model_meta.json            # Thresholds, metrics, and feature importances
│   ├── results.json               # Full test metrics and training curves
│   └── sample_readings.csv        # 300 test-set samples for simulated monitor
├── backend/                       # FastAPI application
│   ├── main.py                    # API routes, static file serving & SPA fallback
│   ├── model_service.py           # Feature engineering & multi-model inference
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── auth.py                    # Demo authentication handler
│   └── requirements.txt           # Pinned backend dependencies
├── frontend/                      # React 18 + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, RiskGauge, Banner
│   │   ├── pages/                 # Overview, Predict, Live Monitor, Insights, History
│   │   └── services/              # API client (relative /api routes)
│   └── package.json
├── Dockerfile                     # Multi-stage production Dockerfile
├── render.yaml                    # Render Blueprint deployment definition
└── requirements.txt               # Root Python dependencies
```
