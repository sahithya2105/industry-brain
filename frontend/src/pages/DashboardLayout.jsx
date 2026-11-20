import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackendBanner from '../components/BackendBanner';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-beige text-coffee-deep flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-tan border-t-coffee rounded-full animate-spin"></div>
        <div className="text-coffee-muted text-sm font-medium">Loading Industry Brain...</div>
      </div>
    );
  }

  // Protected route check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-beige text-coffee-deep flex flex-col">
      <BackendBanner />

      {/* Mobile Top bar */}
      <div className="lg:hidden h-14 border-b border-coffee/40 bg-coffee-dark px-4 flex items-center justify-between sticky top-0 z-30 shadow-soft text-cream">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-mocha text-cream border border-tan/30 flex items-center justify-center font-bold text-xs">
            IB
          </div>
          <span className="font-bold text-sm text-cream">Industry Brain</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-mocha text-cream hover:bg-coffee transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 flex flex-col">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>

          <footer className="border-t border-tan py-4 px-6 text-center text-xs text-coffee-muted bg-beige">
            AIDL Course Project | Koudagani Sahithya (2403A52063) | SR University
          </footer>
        </main>
      </div>
    </div>
  );
}
