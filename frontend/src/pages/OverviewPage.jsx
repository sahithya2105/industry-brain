import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Cpu,
  ArrowRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../services/api';
import { historyService } from '../services/historyService';

export default function OverviewPage() {
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const m = await api.getMeta();
        setMeta(m);
      } catch (err) {
        console.warn('Overview meta load failed:', err);
      }
      const h = historyService.getHistory();
      setHistory(h);
      setLoading(false);
    };
    load();
  }, []);

  const totalPreds = history.length;
  const highRiskCount = history.filter((h) => h.status === 'HIGH RISK').length;
  const watchCount = history.filter((h) => h.status === 'WATCH').length;
  const healthyCount = history.filter((h) => h.status === 'HEALTHY').length;

  const bestModelName = meta?.best_model || 'RandomForest';
  const bestMetrics = meta?.metrics?.[bestModelName] || {
    F1: 0.884,
    'ROC-AUC': 0.985,
    Accuracy: 0.993
  };

  const chartData = [
    { name: 'Healthy', value: healthyCount || (totalPreds === 0 ? 1 : 0), color: '#3F6B4A' },
    { name: 'Watch', value: watchCount, color: '#8A6100' },
    { name: 'High Risk', value: highRiskCount, color: '#A33A36' }
  ];

  const recentList = history.slice(0, 5);

  return (
    <div className="space-y-6 text-coffee-deep">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-dark tracking-tight">
            Operations Intelligence Overview
          </h1>
          <p className="text-xs sm:text-sm text-coffee-muted mt-1">
            Real-time machine risk monitoring and predictive failure telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/predict"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee hover:bg-coffee-dark text-cream font-bold text-xs uppercase tracking-wider shadow-soft transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>New Prediction</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Predictions */}
        <div className="p-5 rounded-2xl bg-cream border border-tan shadow-soft">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Predictions Made</span>
            <Activity className="w-4 h-4 text-coffee" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-coffee-dark">{totalPreds}</div>
          <div className="text-xs text-coffee-muted mt-1">Stored in session history</div>
        </div>

        {/* High Risk Alerts */}
        <div className="p-5 rounded-2xl bg-cream border border-tan shadow-soft">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk Alerts</span>
            <AlertTriangle className="w-4 h-4 text-terracotta" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-terracotta">{highRiskCount}</div>
          <div className="text-xs text-terracotta mt-1">Required immediate maintenance</div>
        </div>

        {/* Best Performing Model */}
        <div className="p-5 rounded-2xl bg-cream border border-tan shadow-soft">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Core Model</span>
            <Cpu className="w-4 h-4 text-coffee" />
          </div>
          <div className="text-xl font-extrabold text-coffee-dark truncate">{bestModelName}</div>
          <div className="text-xs text-latte font-medium mt-1">Highest F1 on failure class</div>
        </div>

        {/* Best Model F1 Score */}
        <div className="p-5 rounded-2xl bg-cream border border-tan shadow-soft">
          <div className="flex items-center justify-between text-coffee-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">F1-Score / ROC-AUC</span>
            <TrendingUp className="w-4 h-4 text-sage" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-sage">
            {bestMetrics.F1 ? (bestMetrics.F1 * 100).toFixed(1) + '%' : '88.4%'}
          </div>
          <div className="text-xs text-coffee-muted mt-1 font-mono">ROC-AUC: {bestMetrics['ROC-AUC'] || '0.985'}</div>
        </div>
      </div>

      {/* Main Grid: Status Breakdown Donut & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Donut */}
        <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-coffee-dark mb-1">Status Breakdown</h3>
            <p className="text-xs text-coffee-muted mb-4">Historical prediction distribution</p>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FBF6EE', borderColor: '#6F4E37', borderRadius: '8px', color: '#3B2417' }}
                  itemStyle={{ color: '#3B2417', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-coffee-dark">{totalPreds}</span>
              <span className="text-[10px] uppercase font-mono text-coffee-muted">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-tan text-center">
            <div className="p-2 rounded-lg bg-sage-bg border border-sage-border">
              <div className="text-[10px] text-sage-text uppercase font-semibold">Healthy</div>
              <div className="text-base font-bold font-mono text-sage-text">{healthyCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-bg border border-amber-border">
              <div className="text-[10px] text-amber-text uppercase font-semibold">Watch</div>
              <div className="text-base font-bold font-mono text-amber-text">{watchCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-terracotta-bg border border-terracotta-border">
              <div className="text-[10px] text-terracotta-text uppercase font-semibold">High Risk</div>
              <div className="text-base font-bold font-mono text-terracotta-text">{highRiskCount}</div>
            </div>
          </div>
        </div>

        {/* Quick Launchpad Cards */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <Link
            to="/dashboard/predict"
            className="p-6 rounded-2xl bg-cream border border-tan hover:border-coffee transition-all group flex flex-col justify-between shadow-soft"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-beige border border-tan text-coffee flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-coffee-dark mb-1.5 flex items-center gap-1.5">
                <span>Interactive Risk Evaluator</span>
                <ArrowRight className="w-4 h-4 text-coffee opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-coffee-deep leading-relaxed">
                Test custom sensor parameters, simulate torque spikes, and evaluate multi-model probabilities with instant physical factor attribution.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-tan text-xs font-mono text-coffee font-semibold flex items-center justify-between">
              <span>Quick Presets: Normal &amp; Risky</span>
              <span>Launch &rarr;</span>
            </div>
          </Link>

          <Link
            to="/dashboard/monitor"
            className="p-6 rounded-2xl bg-cream border border-tan hover:border-coffee transition-all group flex flex-col justify-between shadow-soft"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-beige border border-tan text-coffee flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-coffee-dark mb-1.5 flex items-center gap-1.5">
                <span>Factory Floor Live Monitor</span>
                <ArrowRight className="w-4 h-4 text-coffee opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-coffee-deep leading-relaxed">
                Simulate 6 operational machine cells with real-time test stream playback, risk sparklines, and automated incident alarms feed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-tan text-xs font-mono text-coffee font-semibold flex items-center justify-between">
              <span>6 Simulated Workstations</span>
              <span>Launch &rarr;</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-coffee-dark">Recent Machine Predictions</h3>
            <p className="text-xs text-coffee-muted">Latest inferences evaluated by Industry Brain</p>
          </div>
          <Link to="/dashboard/history" className="text-xs font-semibold text-coffee hover:underline">
            View All ({totalPreds}) &rarr;
          </Link>
        </div>

        {recentList.length === 0 ? (
          <div className="py-12 text-center text-coffee-muted text-xs">
            No predictions made yet in this session. Go to{' '}
            <Link to="/dashboard/predict" className="text-coffee underline font-semibold">
              Predict Risk
            </Link>{' '}
            to run your first machine inspection!
          </div>
        ) : (
          <div className="overflow-x-auto border border-tan rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-coffee-dark text-cream uppercase font-mono">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Failure Prob</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Key Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tan font-mono">
                {recentList.map((item, index) => {
                  let badge = 'bg-sage-bg text-sage-text border-sage-border';
                  if (item.status === 'HIGH RISK') {
                    badge = 'bg-terracotta-bg text-terracotta-text border-terracotta-border';
                  } else if (item.status === 'WATCH') {
                    badge = 'bg-amber-bg text-amber-text border-amber-border';
                  }

                  const topFactor = item.contributing_factors?.[0]?.label || 'Standard load';
                  const rowBg = index % 2 === 0 ? 'bg-cream' : 'bg-beige/40';

                  return (
                    <tr key={item.id} className={`${rowBg} hover:bg-beige/70 transition-colors`}>
                      <td className="py-2.5 px-3 text-coffee-muted font-sans">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-coffee-dark font-bold">{item.inputs?.machine_type || 'M'}</td>
                      <td className="py-2.5 px-3 text-coffee font-sans">{item.model || 'RandomForest'}</td>
                      <td className="py-2.5 px-3 font-bold text-coffee-dark">
                        {(item.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-coffee-deep font-sans">{topFactor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
