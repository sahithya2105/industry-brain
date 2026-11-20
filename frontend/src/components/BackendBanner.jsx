import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BackendBanner() {
  const [backendOffline, setBackendOffline] = useState(false);
  const { isDemoMode } = useAuth();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await api.getHealth();
      if (mounted) {
        setBackendOffline(res.status !== 'ok');
      }
    };
    check();
    const timer = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {backendOffline && (
        <div className="bg-terracotta-bg border-b border-terracotta-border text-terracotta-text px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 backdrop-blur z-50">
          <AlertCircle className="w-4 h-4 text-terracotta-text shrink-0" />
          <span>
            <strong>Backend Unreachable:</strong> FastAPI server is not responding at{' '}
            <code className="bg-cream/60 border border-terracotta-border px-1.5 py-0.5 rounded font-mono text-xs text-terracotta-text">http://127.0.0.1:8000</code>.
            Please ensure <code className="bg-cream/60 border border-terracotta-border px-1.5 py-0.5 rounded font-mono text-xs text-terracotta-text">uvicorn main:app --reload</code> is running.
          </span>
        </div>
      )}
      {isDemoMode && !backendOffline && (
        <div className="bg-cream border-b border-tan text-coffee-deep px-4 py-1.5 text-xs font-medium flex items-center justify-between gap-2 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-latte opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coffee"></span>
            </span>
            <span className="text-coffee font-semibold tracking-wide uppercase text-[10px]">Demo Mode Active</span>
            <span className="text-coffee-muted hidden sm:inline">&bull; Demo mode: no real accounts or authentication.</span>
          </div>
          <span className="text-[11px] text-coffee-muted">AIDL Course Project | Koudagani Sahithya (2403A52063) | SR University</span>
        </div>
      )}
    </>
  );
}
