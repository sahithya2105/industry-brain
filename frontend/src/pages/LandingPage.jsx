import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Zap,
  Activity,
  CheckCircle,
  ArrowRight,
  Database,
  BarChart,
  Layers,
  Thermometer,
  Gauge,
  Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import BackendBanner from '../components/BackendBanner';
import { api } from '../services/api';

export default function LandingPage() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await api.getMeta();
        setMeta(data);
      } catch (err) {
        console.warn('Could not load metadata on landing page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  const bestModelName = meta?.best_model || 'RandomForest';
  const bestMetrics = meta?.metrics?.[bestModelName] || {
    Accuracy: 0.993,
    Precision: 0.955,
    Recall: 0.824,
    F1: 0.884,
    'ROC-AUC': 0.985,
    'PR-AUC': 0.906
  };

  return (
    <div className="min-h-screen bg-beige flex flex-col text-coffee-deep">
      <BackendBanner />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-tan">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream border border-tan text-coffee text-xs font-semibold mb-6 shadow-soft">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-latte opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coffee"></span>
            </span>
            AIDL Course Project &bull; Machine-Failure Prediction Study
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-coffee-dark mb-6 leading-tight">
            Industry Brain: AI that predicts{' '}
            <span className="text-latte underline decoration-tan decoration-wavy underline-offset-4">
              machine failure
            </span>{' '}
            before it happens.
          </h1>

          <p className="text-lg md:text-xl text-coffee-deep max-w-3xl mx-auto mb-10 leading-relaxed">
            Transition your factory floor from costly reactive downtime to condition-based intelligence.
            Continuous sensor telemetry evaluated by machine learning and deep learning models trained on the UCI AI4I 2020 benchmark.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-coffee hover:bg-coffee-dark text-cream font-bold text-base shadow-soft transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-cream hover:bg-beige border border-tan text-coffee font-semibold text-base shadow-soft transition-all"
            >
              <span>Sign in / Demo Mode</span>
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-cream border border-tan text-left shadow-soft">
              <div className="text-xs uppercase font-mono text-coffee-muted font-semibold">Best Model</div>
              <div className="text-xl font-bold text-coffee-dark mt-1">{bestModelName}</div>
              <div className="text-xs text-latte font-medium mt-0.5">Ensemble Classifier</div>
            </div>
            <div className="p-4 rounded-xl bg-cream border border-tan text-left shadow-soft">
              <div className="text-xs uppercase font-mono text-coffee-muted font-semibold">Failure Class F1</div>
              <div className="text-xl font-bold font-mono text-coffee-dark mt-1">
                {bestMetrics.F1 ? (bestMetrics.F1 * 100).toFixed(1) + '%' : '88.4%'}
              </div>
              <div className="text-xs text-sage font-medium mt-0.5">Imbalance-calibrated</div>
            </div>
            <div className="p-4 rounded-xl bg-cream border border-tan text-left shadow-soft">
              <div className="text-xs uppercase font-mono text-coffee-muted font-semibold">PR-AUC</div>
              <div className="text-xl font-bold font-mono text-coffee-dark mt-1">
                {bestMetrics['PR-AUC'] ? bestMetrics['PR-AUC'].toFixed(3) : '0.906'}
              </div>
              <div className="text-xs text-coffee font-medium mt-0.5">Precision vs Recall</div>
            </div>
            <div className="p-4 rounded-xl bg-cream border border-tan text-left shadow-soft">
              <div className="text-xs uppercase font-mono text-coffee-muted font-semibold">Benchmark Dataset</div>
              <div className="text-xl font-bold text-coffee-dark mt-1">10,000 Rows</div>
              <div className="text-xs text-coffee-muted mt-0.5">UCI AI4I 2020 Study</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-tan bg-beige/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-coffee-muted font-bold mb-2">Workflow Architecture</h2>
            <p className="text-3xl font-bold text-coffee-dark tracking-tight">How Industry Brain Operates</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-beige border border-tan flex items-center justify-center text-coffee font-bold text-lg mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-coffee-dark mb-2 flex items-center gap-2">
                <span>Enter Sensor Data</span>
              </h3>
              <p className="text-sm text-coffee-deep leading-relaxed mb-4">
                Telemetry streams in: air &amp; process temperatures, rotational speed (rpm), torque load (Nm), tool wear duration, and machine quality variant (Type L/M/H).
              </p>
              <div className="text-xs font-mono text-coffee bg-beige p-2.5 rounded-lg border border-tan">
                &Delta;T, Power (&tau;&middot;&omega;), Strain (wear&middot;&tau;)
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-beige border border-tan flex items-center justify-center text-coffee font-bold text-lg mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-coffee-dark mb-2 flex items-center gap-2">
                <span>AI Analyses Patterns</span>
              </h3>
              <p className="text-sm text-coffee-deep leading-relaxed mb-4">
                Pre-trained models (Random Forest, Keras Deep Neural Network, Logistic Regression) evaluate the standardized feature vector using domain-tuned alert thresholds.
              </p>
              <div className="text-xs font-mono text-coffee bg-beige p-2.5 rounded-lg border border-tan">
                Inference against tuned decision threshold
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-cream border border-tan shadow-soft hover:shadow-soft-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-beige border border-tan flex items-center justify-center text-coffee font-bold text-lg mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-coffee-dark mb-2 flex items-center gap-2">
                <span>Get Maintenance Alert</span>
              </h3>
              <p className="text-sm text-coffee-deep leading-relaxed mb-4">
                Instant classification into{' '}
                <span className="bg-sage-bg text-sage-text px-1.5 py-0.5 rounded font-semibold border border-sage-border">HEALTHY</span>,{' '}
                <span className="bg-amber-bg text-amber-text px-1.5 py-0.5 rounded font-semibold border border-amber-border">WATCH</span>, or{' '}
                <span className="bg-terracotta-bg text-terracotta-text px-1.5 py-0.5 rounded font-semibold border border-terracotta-border">HIGH RISK</span> with contributing factor attribution.
              </p>
              <div className="text-xs font-mono text-coffee bg-beige p-2.5 rounded-lg border border-tan">
                Action recommendation + factor deviation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset & Model Overview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-tan bg-beige">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream border border-tan text-xs text-coffee font-medium mb-4 shadow-soft">
                <Database className="w-3.5 h-3.5 text-coffee" />
                UCI Machine Learning Repository
              </div>
              <h2 className="text-3xl font-extrabold text-coffee-dark mb-4">
                AI4I 2020 Predictive Maintenance Dataset
              </h2>
              <p className="text-coffee-deep text-sm leading-relaxed mb-4">
                AI4I 2020 Predictive Maintenance (UCI), 10,000 samples, 3.39% failures. A synthetic benchmark dataset designed to mimic real machines.
              </p>
              <ul className="space-y-2 text-sm text-coffee-deep mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-coffee shrink-0" />
                  <span><strong>TWF:</strong> Tool Wear Failure caused by gradual cutting edge wear.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-coffee shrink-0" />
                  <span><strong>HDF:</strong> Heat Dissipation Failure triggered by cooling collapse.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-coffee shrink-0" />
                  <span><strong>PWF:</strong> Power Failure when product &tau;&middot;&omega; leaves normal limits.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-coffee shrink-0" />
                  <span><strong>OSF:</strong> Overstrain Failure from excessive tool strain products.</span>
                </li>
              </ul>

              <div className="p-4 rounded-xl bg-amber-bg border border-amber-border text-amber-text text-xs shadow-soft">
                <strong>Academic Benchmark Notice:</strong> As documented on the official UCI page, this is a simulated benchmark dataset. Results reflect theoretical failure mechanics and must be calibrated before application to physical plant machinery.
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-cream border border-tan shadow-soft">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs uppercase font-mono text-coffee-muted font-bold">Top Model</span>
                    <h4 className="text-lg font-bold text-coffee-dark">Random Forest Classifier</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sage-bg text-sage-text border border-sage-border">
                    F1: 0.884
                  </span>
                </div>
                <p className="text-xs text-coffee-deep">
                  Ensemble of 300 decision trees (depth 12). Achieves 95.5% precision and 82.4% recall on the minority failure class.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-cream border border-tan shadow-soft">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs uppercase font-mono text-coffee-muted font-bold">Deep Learning</span>
                    <h4 className="text-lg font-bold text-coffee-dark">Keras Deep Neural Network</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-beige text-coffee border border-tan">
                    ROC-AUC: 0.971
                  </span>
                </div>
                <p className="text-xs text-coffee-deep">
                  7-layer sequential network with L2 regularization, Batch Normalization, and Dropout layers for robustness against overfitting.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-cream border border-tan shadow-soft">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs uppercase font-mono text-coffee-muted font-bold">Linear Baseline</span>
                    <h4 className="text-lg font-bold text-coffee-dark">Logistic Regression</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-beige text-coffee border border-tan">
                    ROC-AUC: 0.937
                  </span>
                </div>
                <p className="text-xs text-coffee-deep">
                  L2 regularized baseline model trained with balanced class weights for comparative interpretability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-coffee-dark text-center text-xs text-cream border-t border-tan">
        <p className="font-semibold text-cream">
          AIDL Course Project | Koudagani Sahithya (2403A52063) | SR University
        </p>
        <p className="mt-1 text-tan">
          Industry Brain &bull; AI-Based Predictive Maintenance System
        </p>
      </footer>
    </div>
  );
}
