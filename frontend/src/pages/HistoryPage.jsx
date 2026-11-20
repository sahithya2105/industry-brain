import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Trash2,
  Filter
} from 'lucide-react';
import { historyService } from '../services/historyService';
import { useToast } from '../context/ToastContext';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const list = historyService.getHistory();
    setHistory(list);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local prediction history?')) {
      historyService.clearHistory();
      setHistory([]);
      addToast('Prediction history cleared.', 'info');
    }
  };

  const handleExport = () => {
    if (history.length === 0) {
      addToast('No prediction records available to export.', 'warning');
      return;
    }
    historyService.exportToCSV(history);
    addToast('Exported prediction history to CSV successfully.', 'success');
  };

  const filtered = history.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-coffee-deep">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-dark tracking-tight">
            Prediction History &amp; Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-coffee-muted mt-1">
            Historical machine inspection logs saved per-operator
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-coffee hover:bg-coffee-dark text-cream font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-soft"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream hover:bg-terracotta-bg text-coffee hover:text-terracotta-text border border-tan text-xs font-semibold transition-all disabled:opacity-40 shadow-soft"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-cream border border-tan rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-coffee-muted font-semibold uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter by Risk:
          </span>
          <div className="flex items-center gap-1">
            {['ALL', 'HEALTHY', 'WATCH', 'HIGH RISK'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-coffee text-cream shadow-soft'
                    : 'bg-cream text-coffee hover:bg-beige border border-tan'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-coffee-muted font-mono">
          Showing {filtered.length} of {history.length} records
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-cream border border-tan rounded-2xl p-6 shadow-soft">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-coffee-muted text-xs">
            <History className="w-10 h-10 mx-auto text-coffee-muted mb-2 opacity-50" />
            <div className="font-semibold text-coffee-dark">No prediction records found</div>
            <div className="text-[11px] text-coffee-muted mt-1">
              {history.length === 0
                ? 'Run machine evaluations in Predict Risk to build your inspection log.'
                : 'Try clearing your risk filter to view other records.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-tan rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-coffee-dark text-cream uppercase font-bold">
                  <th className="py-3 px-3 font-sans">Timestamp</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Speed (RPM)</th>
                  <th className="py-3 px-3">Torque (Nm)</th>
                  <th className="py-3 px-3">Wear (min)</th>
                  <th className="py-3 px-3">&Delta;T (K)</th>
                  <th className="py-3 px-3 font-sans">Model</th>
                  <th className="py-3 px-3">Probability</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tan">
                {filtered.map((r, index) => {
                  let badge = 'bg-sage-bg text-sage-text border-sage-border';
                  if (r.status === 'HIGH RISK') {
                    badge = 'bg-terracotta-bg text-terracotta-text border-terracotta-border';
                  } else if (r.status === 'WATCH') {
                    badge = 'bg-amber-bg text-amber-text border-amber-border';
                  }

                  const dt = new Date(r.timestamp);
                  const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const rowBg = index % 2 === 0 ? 'bg-cream' : 'bg-beige/40';

                  return (
                    <tr key={r.id} className={`${rowBg} hover:bg-beige/70 transition-colors`}>
                      <td className="py-3 px-3 font-sans text-coffee-muted">
                        <span className="text-coffee-dark font-medium">{dateStr}</span>{' '}
                        <span className="text-coffee-muted">{timeStr}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-coffee">{r.inputs?.machine_type || 'M'}</td>
                      <td className="py-3 px-3 text-coffee-deep">{r.inputs?.speed_rpm || '-'}</td>
                      <td className="py-3 px-3 text-coffee-deep">{r.inputs?.torque_Nm || '-'}</td>
                      <td className="py-3 px-3 text-coffee-deep">{r.inputs?.tool_wear_min || '-'}</td>
                      <td className="py-3 px-3 text-coffee-deep">
                        {r.inputs?.process_temp_K && r.inputs?.air_temp_K
                          ? (r.inputs.process_temp_K - r.inputs.air_temp_K).toFixed(1)
                          : '-'}
                      </td>
                      <td className="py-3 px-3 font-sans text-coffee">{r.model || 'RandomForest'}</td>
                      <td className="py-3 px-3 font-bold text-coffee-dark">
                        {(r.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge}`}>
                          {r.status}
                        </span>
                      </td>
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
