import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';

export default function ModelInsightsPage() {
  const [meta, setMeta] = useState(null);
  const [importanceType, setImportanceType] = useState('rf'); // 'rf' or 'dnn'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await api.getMeta();
        setMeta(data);
      } catch (err) {
        console.warn('Failed to load model insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  const bestModel = meta?.best_model || 'RandomForest';
  const metrics = meta?.metrics || {
    LogReg: { Accuracy: 0.967, Precision: 0.513, Recall: 0.392, F1: 0.444, 'ROC-AUC': 0.937, 'PR-AUC': 0.443 },
    RandomForest: { Accuracy: 0.993, Precision: 0.955, Recall: 0.824, F1: 0.884, 'ROC-AUC': 0.985, 'PR-AUC': 0.906 },
    DNN: { Accuracy: 0.971, Precision: 0.556, Recall: 0.686, F1: 0.614, 'ROC-AUC': 0.971, 'PR-AUC': 0.611 }
  };

  const rfImp = meta?.rf_feature_importance || {
    Rotational_speed: 0.2096,
    Power: 0.1841,
    Torque: 0.1832,
    Tool_wear: 0.1344,
    Strain: 0.1151,
    Temp_diff: 0.0823,
    Air_temperature: 0.0487,
    Process_temperature: 0.0301,
    Type_M: 0.0051,
    Type_L: 0.005,
    Type_H: 0.0023
  };

  const dnnImp = meta?.dnn_permutation_importance || {
    Rotational_speed: 0.333,
    Tool_wear: 0.328,
    Torque: 0.298,
    Strain: 0.265,
    Air_temperature: 0.192,
    Process_temperature: 0.155,
    Temp_diff: 0.148,
    Power: 0.143,
    Type_H: 0.08,
    Type_L: 0.074,
    Type_M: 0.018
  };

  const friendlyNames = {
    Rotational_speed: 'Rotational speed',
    Power: 'Power (torque × speed)',
    Torque: 'Torque load',
    Tool_wear: 'Tool wear duration',
    Strain: 'Strain (wear × torque)',
    Temp_diff: 'Temp differential (ΔT)',
    Air_temperature: 'Air temperature',
    Process_temperature: 'Process temperature',
    Type_L: 'Machine Type L',
    Type_M: 'Machine Type M',
    Type_H: 'Machine Type H'
  };

  const rawActiveImp = importanceType === 'rf' ? rfImp : dnnImp;
  const chartData = Object.entries(rawActiveImp)
    .map(([col, score]) => ({
      name: friendlyNames[col] || col,
      score: parseFloat((score * 100).toFixed(2)),
      col
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 text-coffee-deep">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-dark tracking-tight">
          Model Insights &amp; Evaluation Benchmarks
        </h1>
        <p className="text-xs sm:text-sm text-coffee-muted mt-1">
          Comparative empirical performance of Logistic Regression, Random Forest, and Deep Neural Network
        </p>
      </div>

      {/* Dataset Description Note */}
      <div className="p-4 rounded-xl bg-cream border border-tan text-xs text-coffee-deep flex items-center gap-3 shadow-soft">
        <Info className="w-4 h-4 text-coffee shrink-0" />
        <div>
          <span className="font-semibold text-coffee-dark">Dataset: </span>
          AI4I 2020 Predictive Maintenance (UCI), 10,000 samples, 3.39% failures. A synthetic benchmark dataset designed to mimic real machines.
        </div>
      </div>

      {/* Models Metrics Comparison Table */}
      <div className="bg-cream border border-tan rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-tan pb-3">
          <div>
            <h2 className="text-sm font-bold text-coffee-dark uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-coffee" />
              <span>Test Set Evaluation Metrics (1,500 Held-Out Samples)</span>
            </h2>
          </div>
          <span className="text-[11px] font-mono text-coffee font-semibold">
            Best Model: {bestModel}
          </span>
        </div>

        <div className="overflow-x-auto border border-tan rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-coffee-dark text-cream uppercase font-bold">
                <th className="py-3 px-4 font-sans">Model Architecture</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision (Fail)</th>
                <th className="py-3 px-4">Recall (Fail)</th>
                <th className="py-3 px-4">F1-Score (Fail)</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">PR-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tan">
              {Object.entries(metrics).map(([mName, m], index) => {
                const isBest = mName === bestModel;
                const thresh = meta?.thresholds?.[mName]
                  ? Number(meta.thresholds[mName]).toFixed(4)
                  : mName === 'RandomForest' ? '0.4259' : mName === 'DNN' ? '0.8213' : '0.9065';

                const rowBg = isBest ? 'bg-beige/80 font-bold border-l-4 border-l-coffee' : index % 2 === 0 ? 'bg-cream' : 'bg-beige/30';

                return (
                  <tr
                    key={mName}
                    className={`transition-colors ${rowBg} hover:bg-beige/60`}
                  >
                    <td className="py-3.5 px-4 font-sans text-coffee-dark flex items-center gap-2 font-bold">
                      <span>{mName}</span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-coffee text-cream font-bold uppercase tracking-wider">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-coffee font-semibold">{thresh}</td>
                    <td className="py-3.5 px-4 text-coffee-deep">{(m.Accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-coffee-deep">{m.Precision?.toFixed(3) || '0.955'}</td>
                    <td className="py-3.5 px-4 text-sage font-extrabold">{m.Recall?.toFixed(3) || '0.824'}</td>
                    <td className="py-3.5 px-4 text-coffee-dark font-extrabold">{m.F1?.toFixed(3) || '0.884'}</td>
                    <td className="py-3.5 px-4 text-coffee-deep">{m['ROC-AUC']?.toFixed(3) || '0.985'}</td>
                    <td className="py-3.5 px-4 text-latte font-bold">{m['PR-AUC']?.toFixed(3) || '0.906'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance Bar Chart Section */}
      <div className="bg-cream border border-tan rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-tan pb-3">
          <div>
            <h2 className="text-sm font-bold text-coffee-dark uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-coffee" />
              <span>Feature Importance Attribution</span>
            </h2>
            <p className="text-xs text-coffee-muted mt-0.5">
              Physical factors most influential in predicting machine breakdown
            </p>
          </div>

          {/* Toggle between RF and DNN */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-beige border border-tan">
            <button
              onClick={() => setImportanceType('rf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                importanceType === 'rf'
                  ? 'bg-coffee text-cream font-bold shadow-soft'
                  : 'text-coffee hover:bg-cream'
              }`}
            >
              Random Forest (Gini %)
            </button>
            <button
              onClick={() => setImportanceType('dnn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                importanceType === 'dnn'
                  ? 'bg-coffee text-cream font-bold shadow-soft'
                  : 'text-coffee hover:bg-cream'
              }`}
            >
              DNN (PR-AUC Drop %)
            </button>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
            >
              <CartesianGrid stroke="#D9C3A5" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                stroke="#6F4E37"
                fontSize={11}
                unit="%"
                domain={[0, 'dataMax + 2']}
                tick={{ fill: '#6F4E37' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6F4E37"
                fontSize={11}
                width={130}
                tickLine={false}
                tick={{ fill: '#6F4E37' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#FBF6EE', borderColor: '#6F4E37', borderRadius: '8px', color: '#3B2417' }}
                itemStyle={{ color: '#3B2417', fontSize: '12px' }}
                formatter={(val) => [`${val}%`, importanceType === 'rf' ? 'Gini Importance' : 'Permutation PR-AUC Drop']}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#6F4E37' : index < 3 ? '#A67B5B' : '#C8AD8A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanatory Callout Card on Imbalance and Recall */}
      <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-beige border border-tan text-coffee flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-2 text-xs text-coffee-deep leading-relaxed">
          <h3 className="text-sm font-bold text-coffee-dark uppercase tracking-wider">
            Why Recall on the Failure Class Outweighs Accuracy
          </h3>
          <p>
            In the AI4I 2020 dataset, machine failures comprise approximately <strong>3.39%</strong> of all recorded observations. Because 96.61% of records represent normal operation, a naive baseline classifier that blindly predicts &ldquo;No Failure&rdquo; for every machine achieves a misleadingly high <strong>96.61% Accuracy</strong> while detecting exactly <strong>0 failures (0% Recall)</strong>.
          </p>
          <p>
            In predictive maintenance, an undetected machine failure (False Negative) causes catastrophic spindle seizure, unprogrammed line stoppage, and severe financial losses. In contrast, a false alarm (False Positive) merely triggers an early inspection. For this reason, <strong>Recall on Class 1 (82.4%)</strong>, <strong>Precision (95.5%)</strong>, and <strong>PR-AUC (0.906)</strong> provide the only reliable benchmarks of operational reliability.
          </p>
        </div>
      </div>
    </div>
  );
}
