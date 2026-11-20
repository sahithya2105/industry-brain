import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          let bg = 'bg-cream border border-tan text-coffee-deep';
          let icon = <Info className="w-5 h-5 text-latte shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-sage-bg border border-sage-border text-sage-text';
            icon = <CheckCircle2 className="w-5 h-5 text-sage-text shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-terracotta-bg border border-terracotta-border text-terracotta-text';
            icon = <XCircle className="w-5 h-5 text-terracotta-text shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-bg border border-amber-border text-amber-text';
            icon = <AlertTriangle className="w-5 h-5 text-amber-text shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-soft-lg transition-all duration-300 ${bg}`}
            >
              {icon}
              <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-coffee-muted hover:text-coffee-dark transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
