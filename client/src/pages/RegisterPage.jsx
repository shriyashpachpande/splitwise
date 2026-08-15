import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, User, Mail, Lock, ArrowRight, KeyRound, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Input details & send OTP, 2: Enter & verify OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields (name, email, password)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-register-otp', {
        name: name.trim(),
        email: email.trim()
      });

      setSuccessMsg(res.data.message || `6-digit OTP code dispatched to ${email.trim()}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Account Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, otp.trim());
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 6-digit OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-slate-200 shadow-xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/20">
            <Wallet className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 ? 'Create Account' : 'Verify Email OTP'}
          </h1>
          <p className="text-xs text-slate-500">
            {step === 1 ? 'Join Equally Split with 6-digit email OTP verification' : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center font-medium leading-relaxed">
            {error}
          </div>
        )}

        {successMsg && step === 2 && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>OTP Sent Successfully!</span>
            </div>
            <p className="text-emerald-700">Check your inbox for the 6-digit verification code.</p>
          </div>
        )}

        {/* STEP 1: Enter Name, Email & Password */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full saas-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="rahul@example.com"
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
              {loading ? (
                <span>Sending Verification OTP...</span>
              ) : (
                <>
                  <span>Send 6-Digit Verification OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1 text-center">
                6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 898703"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full saas-input pl-10 pr-4 py-2.5 rounded-xl text-base font-mono tracking-widest text-center font-extrabold"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Verifying & Creating Account...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Complete Registration</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-indigo-600 font-bold hover:underline"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="text-slate-500 font-medium hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
