import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    try {
      setLoading(true);
      setError('');
      await login(demoEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-slate-200 shadow-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/20">
            <Wallet className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Equally Split</h1>
          <p className="text-xs text-slate-500">Sign in to manage your trip expenses & group settlements</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="yash@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full saas-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full saas-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider text-center mb-2 flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick Demo Accounts</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('yash@example.com')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-xl text-xs font-semibold truncate transition-colors"
            >
              Yash (Payer)
            </button>
            <button
              onClick={() => handleDemoLogin('madhav@example.com')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-xl text-xs font-semibold truncate transition-colors"
            >
              Madhav (Debtor)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
