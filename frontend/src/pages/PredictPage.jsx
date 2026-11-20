import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sliders,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart2,
  RefreshCw,
  Thermometer,
  Gauge,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import RiskGauge from '../components/RiskGauge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { historyService } from '../services/historyService';

export default function PredictPage() {
  const { getIdToken } = useAuth();
  const { addToast } = useToast();

  // Inputs stored in °C for temperatures, converted to Kelvin for backend
  // Defaults: 298.5 K -> 25.35 °C, 308.7 K -> 35.55 °C
  const [airTempC, setAirTempC] = useState(25.35);
  const [procTempC, setProcTempC] = useState(35.55);
  const [speedRpm, setSpeedRpm] = useState(1450);
  const [torqueNm, setTorqueNm] = useState(45.0);
  const [toolWearMin, setToolWearMin] = useState(60);
  const [machineType, setMachineType] = useState('M');
  const [selectedModel, setSelectedModel] = useState('best');

  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Conversion helpers
  const airTempK = airTempC + 273.15;
  const procTempK = procTempC + 273.15;

  // Real-time engineered feature calculation
  const tempDiffK = procTempK - airTempK;
  const powerW = torqueNm * speedRpm * 2 * Math.PI / 60;
  const strain = toolWearMin * torqueNm;

  // Run initial prediction on mount
  useEffect(() => {
    executePrediction(airTempK, procTempK, speedRpm, torqueNm, toolWearMin, machineType, selectedModel);
  }, []);

  const loadPreset = (type) => {
    if (type === 'normal') {
      // 298.5 K, 308.7 K, 1450 rpm, 45 Nm, 60 min, type M
      setAirTempC(25.35);
      setProcTempC(35.55);
      setSpeedRpm(1450);
      setTorqueNm(45.0);
      setToolWearMin(60);
      setMachineType('M');
      addToast('Loaded preset: Normal Machine Operation', 'info');
      executePrediction(298.5, 308.7, 1450, 45.0, 60, 'M', selectedModel);
    } else if (type === 'risky') {
      // 300 K, 309 K, 1250 rpm, 65 Nm, 230 min, type L
      setAirTempC(26.85);
      setProcTempC(35.85);
      setSpeedRpm(1250);
      setTorqueNm(65.0);
      setToolWearMin(230);
      setMachineType('L');
      addToast('Loaded preset: High Torque + Heavy Tool Wear', 'warning');
      executePrediction(300.0, 309.0, 1250, 65.0, 230, 'L', selectedModel);
    }
  };

  const executePrediction = async (
    airK = airTempK,
    procK = procTempK,
    spd = speedRpm,
    trq = torqueNm,
    wear = toolWearMin,
    mType = machineType,
    mod = selectedModel
  ) => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const payload = {
        air_temp_K: parseFloat(airK.toFixed(2)),
        process_temp_K: parseFloat(procK.toFixed(2)),
        speed_rpm: parseFloat(spd),
        torque_Nm: parseFloat(trq),
        tool_wear_min: parseFloat(wear),
        machine_type: mType,
        model: mod
      };

      const res = await api.predict(payload, token);
      setPrediction(res);

      // Save to prediction history
      historyService.addHistory({
        inputs: payload,
        probability: res.probability,
        threshold: res.threshold,
        status: res.status,
        message: res.message,
        model: res.model,
        engineered_features: res.engineered_features,
        contributing_factors: res.contributing_factors
      });
    } catch (err) {
      console.error('Prediction failed:', err);
      addToast(err.message || 'Prediction failed. Check input parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = (e) => {
    e.preventDefault();
    executePrediction();
  };

  const handleCompareClick = async () => {
    setCompareLoading(true);
    setShowComparison(true);
    try {
      const token = await getIdToken();
      const payload = {
        air_temp_K: parseFloat(airTempK.toFixed(2)),
        process_temp_K: parseFloat(procTempK.toFixed(2)),
        speed_rpm: parseFloat(speedRpm),
        torque_Nm: parseFloat(torqueNm),
        tool_wear_min: parseFloat(toolWearMin),
        machine_type: machineType
      };
      const res = await api.compareModels(payload, token);
      setComparison(res);
      addToast('Evaluated all 3 models in parallel.', 'success');
    } catch (err) {
      console.error('Comparison failed:', err);
      addToast('Could not evaluate multi-model comparison.', 'error');
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-coffee-deep">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-dark tracking-tight">
            Predict Machine Failure Risk
          </h1>
          <p className="text-xs sm:text-sm text-coffee-muted mt-1">
            Replicates notebook standard scaling, domain feature engineering, and tuned decision thresholds
          </p>
        </div>

        {/* Quick Fill Preset Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('normal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-bg hover:bg-sage-bg/80 text-sage-text border border-sage-border text-xs font-semibold shadow-soft transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Normal Preset</span>
          </button>
          <button
            type="button"
            onClick={() => loadPreset('risky')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta-bg hover:bg-terracotta-bg/80 text-terracotta-text border border-terracotta-border text-xs font-semibold shadow-soft transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Risky Preset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-cream border border-tan rounded-2xl p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between border-b border-tan pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-coffee" />
              <h2 className="text-sm font-bold text-coffee-dark uppercase tracking-wider">
                Telemetry Control Panel
              </h2>
            </div>
            <span className="text-[11px] text-coffee-muted font-mono">
              Inputs converted to Kelvin
            </span>
          </div>

          <form onSubmit={handleRunClick} className="space-y-4">
            {/* Model & Type Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-coffee-dark uppercase tracking-wider mb-1.5">
                  ML Model Architecture
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-tan text-coffee-deep text-xs font-medium focus:border-coffee focus:ring-1 focus:ring-coffee outline-none"
                >
                  <option value="best">Best Model (Random Forest - F1: 88.4%)</option>
                  <option value="RandomForest">Random Forest (300 Trees)</option>
                  <option value="DNN">Deep Neural Network (Keras)</option>
                  <option value="LogReg">Logistic Regression (L2 Baseline)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-coffee-dark uppercase tracking-wider mb-1.5">
                  Machine Quality Variant
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['L', 'M', 'H'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMachineType(t)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                        machineType === t
                          ? 'bg-coffee text-cream border-coffee shadow-soft'
                          : 'bg-cream text-coffee border-tan hover:bg-beige'
                      }`}
                    >
                      Type {t} {t === 'L' ? '(60%)' : t === 'M' ? '(30%)' : '(10%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Air Temperature Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-coffee-dark flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-coffee" />
                  Air Temperature
                </span>
                <span className="font-mono text-coffee font-bold">
                  {airTempC.toFixed(1)} &deg;C{' '}
                  <span className="text-coffee-muted font-normal">({airTempK.toFixed(1)} K)</span>
                </span>
              </div>
              <input
                type="range"
                min="21.8"
                max="31.8"
                step="0.1"
                value={airTempC}
                onChange={(e) => setAirTempC(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-tan rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-coffee-muted font-mono">
                <span>21.8 &deg;C (295 K)</span>
                <span>31.8 &deg;C (305 K)</span>
              </div>
            </div>

            {/* Process Temperature Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-coffee-dark flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-latte" />
                  Process Temperature
                </span>
                <span className="font-mono text-latte font-bold">
                  {procTempC.toFixed(1)} &deg;C{' '}
                  <span className="text-coffee-muted font-normal">({procTempK.toFixed(1)} K)</span>
                </span>
              </div>
              <input
                type="range"
                min="31.8"
                max="40.8"
                step="0.1"
                value={procTempC}
                onChange={(e) => setProcTempC(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-tan rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-coffee-muted font-mono">
                <span>31.8 &deg;C (305 K)</span>
                <span>40.8 &deg;C (314 K)</span>
              </div>
            </div>

            {/* Rotational Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-coffee-dark flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-coffee" />
                  Rotational Speed
                </span>
                <span className="font-mono text-coffee font-bold">{Math.round(speedRpm)} RPM</span>
              </div>
              <input
                type="range"
                min="1168"
                max="2886"
                step="5"
                value={speedRpm}
                onChange={(e) => setSpeedRpm(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-tan rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-coffee-muted font-mono">
                <span>1,168 RPM</span>
                <span>2,886 RPM</span>
              </div>
            </div>

            {/* Torque */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-coffee-dark flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber" />
                  Torque Load
                </span>
                <span className="font-mono text-amber font-bold">{torqueNm.toFixed(1)} Nm</span>
              </div>
              <input
                type="range"
                min="3.8"
                max="76.6"
                step="0.2"
                value={torqueNm}
                onChange={(e) => setTorqueNm(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-tan rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-coffee-muted font-mono">
                <span>3.8 Nm</span>
                <span>76.6 Nm</span>
              </div>
            </div>

            {/* Tool Wear */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-coffee-dark flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-terracotta" />
                  Tool Wear Time
                </span>
                <span className="font-mono text-terracotta font-bold">{Math.round(toolWearMin)} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="253"
                step="1"
                value={toolWearMin}
                onChange={(e) => setToolWearMin(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-tan rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-coffee-muted font-mono">
                <span>0 min (Fresh Tool)</span>
                <span>253 min (Critical Wear)</span>
              </div>
            </div>

            {/* Dynamic Engineered Physics Features Bar */}
            <div className="p-3.5 rounded-xl bg-beige border border-tan grid grid-cols-3 gap-2 text-center shadow-soft">
              <div>
                <div className="text-[10px] uppercase font-mono text-coffee-muted">&Delta;T (Diff)</div>
                <div className="text-xs font-mono font-bold text-coffee-dark mt-0.5">{tempDiffK.toFixed(1)} K</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-coffee-muted">Power</div>
                <div className="text-xs font-mono font-bold text-coffee mt-0.5">{Math.round(powerW)} W</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-coffee-muted">Strain</div>
                <div className="text-xs font-mono font-bold text-coffee-dark mt-0.5">{Math.round(strain)} min&middot;Nm</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-coffee hover:bg-coffee-dark text-cream font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Evaluate Failure Probability</span>
              </button>

              <button
                type="button"
                onClick={handleCompareClick}
                disabled={compareLoading}
                className="py-3 px-4 rounded-xl bg-cream hover:bg-beige border border-tan text-coffee font-semibold text-xs transition-all flex items-center gap-2 shadow-soft"
                title="Evaluate Random Forest, DNN, and LogReg side-by-side"
              >
                <BarChart2 className="w-4 h-4 text-coffee" />
                <span className="hidden sm:inline">Compare All</span>
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-cream border border-tan rounded-2xl p-6 shadow-soft flex flex-col justify-between">
            <div className="border-b border-tan pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-coffee-dark uppercase tracking-wider flex items-center gap-2">
                <span>Risk Assessment</span>
              </h2>
              <span className="text-[11px] font-mono text-coffee font-semibold">
                Model: {prediction?.model || 'RandomForest'}
              </span>
            </div>

            {/* Risk Gauge */}
            <div className="my-2">
              <RiskGauge
                probability={prediction?.probability || 0}
                threshold={prediction?.threshold || 0.4259}
                status={prediction?.status || 'HEALTHY'}
              />
            </div>

            {/* Color-coded Status Badge */}
            <div className="space-y-3">
              {prediction?.status === 'HIGH RISK' && (
                <div className="p-4 rounded-xl bg-terracotta-bg border-2 border-terracotta-border text-center shadow-soft">
                  <div className="text-xl font-extrabold text-terracotta-text tracking-wide uppercase flex items-center justify-center gap-2">
                    <XCircle className="w-6 h-6" />
                    <span>HIGH RISK</span>
                  </div>
                  <div className="text-xs font-semibold text-terracotta-text mt-1">
                    {prediction.message}
                  </div>
                </div>
              )}

              {prediction?.status === 'WATCH' && (
                <div className="p-4 rounded-xl bg-amber-bg border-2 border-amber-border text-center shadow-soft">
                  <div className="text-xl font-extrabold text-amber-text tracking-wide uppercase flex items-center justify-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    <span>WATCH</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-text mt-1">
                    {prediction.message}
                  </div>
                </div>
              )}

              {prediction?.status === 'HEALTHY' && (
                <div className="p-4 rounded-xl bg-sage-bg border-2 border-sage-border text-center shadow-soft">
                  <div className="text-xl font-extrabold text-sage-text tracking-wide uppercase flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    <span>HEALTHY</span>
                  </div>
                  <div className="text-xs font-semibold text-sage-text mt-1">
                    {prediction.message}
                  </div>
                </div>
              )}

              {/* Contributing Factors */}
              <div className="p-4 rounded-xl bg-beige border border-tan space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-coffee-dark uppercase">
                    <span>Top Contributing Factors</span>
                    <span className="text-[10px] text-coffee-muted font-mono">Deviation &times; Importance</span>
                  </div>
                  <div className="text-[11px] text-coffee-muted font-normal mt-0.5">
                    Heuristic: deviation from normal x feature importance (not SHAP).
                  </div>
                </div>

                <div className="space-y-2">
                  {prediction?.contributing_factors?.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-cream border border-tan text-xs flex items-center justify-between gap-2 shadow-soft"
                    >
                      <div className="flex-1">
                        <div className="text-coffee-deep font-medium">{factor.explanation}</div>
                        <div className="text-[10px] text-coffee-muted font-mono mt-0.5">
                          Relative importance: {(factor.importance * 100).toFixed(1)}%
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-beige text-coffee border border-tan">
                        {factor.deviation >= 0 ? '+' : ''}{factor.deviation}&sigma;
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Model Comparison Card / Modal */}
          {showComparison && (
            <div className="bg-cream border border-tan rounded-2xl p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-tan pb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-coffee" />
                  <h3 className="text-xs font-bold text-coffee-dark uppercase tracking-wider">
                    Model Comparison (Same Input)
                  </h3>
                </div>
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-xs text-coffee-muted hover:text-coffee-dark"
                >
                  Close
                </button>
              </div>

              {compareLoading ? (
                <div className="py-8 text-center text-xs text-coffee-muted">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-coffee mb-2" />
                  Evaluating Random Forest, DNN, and Logistic Regression...
                </div>
              ) : comparison ? (
                <div className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparison.results.map((r) => ({
                          name: r.model,
                          Probability: parseFloat((r.probability * 100).toFixed(1)),
                          Threshold: parseFloat((r.threshold * 100).toFixed(1)),
                          status: r.status
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="name" stroke="#6F4E37" fontSize={11} />
                        <YAxis stroke="#6F4E37" fontSize={11} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FBF6EE', borderColor: '#6F4E37', borderRadius: '8px', color: '#3B2417' }}
                          formatter={(val) => [`${val}%`, 'Failure Probability']}
                        />
                        <Bar dataKey="Probability" radius={[6, 6, 0, 0]}>
                          {comparison.results.map((entry, index) => {
                            let fill = '#3F6B4A';
                            if (entry.status === 'HIGH RISK') fill = '#A33A36';
                            else if (entry.status === 'WATCH') fill = '#8A6100';
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {comparison.results.map((res) => (
                      <div
                        key={res.model}
                        className="p-2 rounded-lg bg-beige border border-tan"
                      >
                        <div className="text-[10px] text-coffee-muted font-bold">{res.model}</div>
                        <div className="text-sm font-mono font-bold text-coffee-dark mt-0.5">
                          {(res.probability * 100).toFixed(1)}%
                        </div>
                        <div
                          className={`text-[9px] font-bold uppercase mt-1 ${
                            res.status === 'HIGH RISK'
                              ? 'text-terracotta-text'
                              : res.status === 'WATCH'
                              ? 'text-amber-text'
                              : 'text-sage-text'
                          }`}
                        >
                          {res.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
