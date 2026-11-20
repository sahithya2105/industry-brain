import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  BarChart3,
  History,
  LogOut,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isDemoMode, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/predict', label: 'Predict Risk', icon: Zap },
    { to: '/dashboard/monitor', label: 'Live Monitor', icon: Activity },
    { to: '/dashboard/insights', label: 'Model Insights', icon: BarChart3 },
    { to: '/dashboard/history', label: 'History & Logs', icon: History },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-coffee-dark/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-coffee-dark border-r border-coffee/40 flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 text-cream ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-coffee/40 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mocha text-cream border border-tan/30 flex items-center justify-center shadow-soft">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-cream flex items-center gap-1.5">
                Industry Brain
              </div>
              <div className="text-[10px] text-tan font-mono">v2.0 &bull; Colab Trained</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-tan/80 px-3 mb-2">
            Operations &amp; Intelligence
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-mocha text-cream border border-tan/30 shadow-soft font-semibold'
                      : 'text-cream/80 hover:text-cream hover:bg-mocha/40 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-coffee/40 bg-coffee-dark/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-coffee/30 border border-coffee/60 mb-2">
            <div className="w-8 h-8 rounded-lg bg-mocha border border-tan/40 text-cream flex items-center justify-center font-bold text-xs uppercase">
              DU
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-cream truncate">
                Demo User
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-tan">
              <ShieldCheck className="w-3.5 h-3.5 text-tan" />
              Demo Mode
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[11px] text-tan hover:text-terracotta-bg transition-colors p-1"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
