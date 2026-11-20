import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-coffee/40 bg-coffee-dark text-cream sticky top-0 z-40 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-mocha text-cream flex items-center justify-center shadow-soft border border-tan/30 group-hover:bg-coffee transition-all">
            <Cpu className="w-5 h-5 text-cream" />
          </div>
          <div>
            <div className="font-bold text-lg text-cream tracking-tight flex items-center gap-2">
              Industry Brain
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-coffee text-cream border border-tan/40 font-semibold">
                AI4I 2020
              </span>
            </div>
            <div className="text-[11px] text-tan font-medium">Predictive Maintenance Assistant</div>
          </div>
        </Link>

        {/* Right side Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-coffee hover:bg-mocha text-cream font-semibold text-sm transition-all shadow-soft border border-tan/30"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-coffee/40">
                <div className="text-right">
                  <div className="text-xs font-semibold text-cream">{user.displayName}</div>
                  <div className="text-[10px] text-tan">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-tan hover:text-terracotta-bg p-1.5 rounded hover:bg-mocha/40 transition-colors"
                  title="Sign out"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream border border-tan text-coffee hover:bg-beige text-sm font-semibold transition-all shadow-soft"
              >
                <LogIn className="w-4 h-4 text-coffee" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-coffee hover:bg-mocha text-cream font-semibold text-sm shadow-soft border border-tan/30 transition-all"
              >
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
