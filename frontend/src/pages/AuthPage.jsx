import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, Mail, Lock, LogIn, UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BackendBanner from '../components/BackendBanner';

export default function AuthPage({ isSignup = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithEmail, signupWithEmail, loginAsDemo } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid corporate or university email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(email, password);
        addToast('Account created successfully. Welcome to Industry Brain!', 'success');
      } else {
        await loginWithEmail(email, password);
        addToast('Signed in successfully.', 'success');
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists.';
      }
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemo('', 'Demo User');
    addToast('Signed in as Demo User (no real authentication).', 'success');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-beige flex flex-col text-coffee-deep justify-between">
      <BackendBanner />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-cream border border-tan rounded-2xl p-8 shadow-soft-lg relative overflow-hidden">
          {/* Subtle top coffee line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-coffee"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
              <div className="w-10 h-10 rounded-xl bg-mocha text-cream flex items-center justify-center border border-tan/30 shadow-soft group-hover:bg-coffee transition-all">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-coffee-dark">Industry Brain</span>
            </Link>
            <h2 className="text-2xl font-bold text-coffee-dark tracking-tight">
              {isSignup ? 'Create Engineer Account' : 'Welcome to Industry Brain'}
            </h2>
            <p className="text-xs text-coffee-muted mt-1">
              Sign in to monitor machines and predict mechanical failure risk
            </p>
          </div>

          {/* Demo Sign In (No Real Auth) */}
          <div className="mb-6 p-4 rounded-xl bg-beige border border-tan text-left shadow-soft">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-coffee flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Access
              </span>
              <span className="text-[10px] font-mono uppercase bg-cream text-coffee border border-tan px-1.5 py-0.5 rounded font-semibold">
                No Real Auth
              </span>
            </div>
            <p className="text-xs text-coffee-deep leading-relaxed mb-3">
              Explore the entire predictive maintenance dashboard immediately using a local demo session.
            </p>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2.5 px-3 rounded-lg bg-coffee hover:bg-coffee-dark text-cream font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-soft"
            >
              <span>Demo sign-in (no real authentication)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-tan"></div>
            </div>
            <span className="relative bg-cream px-3 text-xs text-coffee-muted uppercase font-mono">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-terracotta-bg border border-terracotta-border text-terracotta-text text-xs">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-coffee-dark uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@plant.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-tan focus:border-coffee focus:ring-1 focus:ring-coffee text-coffee-deep placeholder-coffee-muted/60 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-coffee-dark uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-tan focus:border-coffee focus:ring-1 focus:ring-coffee text-coffee-deep placeholder-coffee-muted/60 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-coffee hover:bg-coffee-dark text-cream font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-soft"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
              ) : isSignup ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-cream" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Switch signup/login */}
          <div className="mt-6 text-center text-xs text-coffee-muted">
            {isSignup ? (
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-coffee hover:underline font-semibold">
                  Sign in
                </Link>
              </span>
            ) : (
              <span>
                Need an account?{' '}
                <Link to="/signup" className="text-coffee hover:underline font-semibold">
                  Create one now
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-xs text-coffee-muted border-t border-tan bg-beige">
        AIDL Course Project | Koudagani Sahithya (2403A52063) | SR University
      </div>
    </div>
  );
}
