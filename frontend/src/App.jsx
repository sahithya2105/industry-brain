import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './pages/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import PredictPage from './pages/PredictPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import ModelInsightsPage from './pages/ModelInsightsPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage isSignup={false} />} />
      <Route path="/signup" element={<AuthPage isSignup={true} />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="predict" element={<PredictPage />} />
        <Route path="monitor" element={<LiveMonitorPage />} />
        <Route path="insights" element={<ModelInsightsPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
