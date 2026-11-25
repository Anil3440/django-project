import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Eye, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login({ onSuccess }) {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(username, email, password);
      } else {
        await login(username, password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u, p) => {
    setError('');
    setLoading(true);
    setUsername(u);
    setPassword(p);
    try {
      await login(u, p);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-fadeIn">
      {/* Left Visual & Info Column */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl mb-6 shadow-inner">
            🌾
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">BhoomiTrack Portal</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Government of India official decision support platform for national infrastructure acquisitions and cadastre parcel administration.
          </p>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <div className="text-xs font-semibold text-slate-300">Preset Demo Accounts:</div>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-emerald-300">
                  Admin (Superuser)
                </span>
                <span className="text-[10px] text-slate-400">admin / admin123</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                All Access
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('officer1', 'officer123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-emerald-300">
                  Land Officer
                </span>
                <span className="text-[10px] text-slate-400">officer1 / officer123</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                Officer Role
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('viewer1', 'viewer123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold block text-white group-hover:text-emerald-300">
                  Citizen / Viewer
                </span>
                <span className="text-[10px] text-slate-400">viewer1 / viewer123</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold">
                Read-Only
              </span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-6">
          Powered by Django 5.x & React SPA
        </div>
      </div>

      {/* Right Form Column */}
      <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSignup ? 'Create an Account' : 'Sign in to BhoomiTrack'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isSignup
                ? 'Join as citizen/viewer for public cadastre tracking.'
                : 'Enter your credentials to manage acquisition workflow.'}
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="officer@nic.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                'Processing...'
              ) : isSignup ? (
                <>
                  Register Account <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {isSignup ? 'Already have an account? Sign in here' : "Don't have an account? Sign up here"}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={onSuccess}
                className="text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                Continue as Public Citizen (Read-Only Guest) &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

