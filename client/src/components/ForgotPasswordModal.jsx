import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Mail, KeyRound, Lock, X, CheckCircle, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, onSuccessEmail }) => {
  // Step 1: Send OTP to Email
  // Step 2: Verify 6-Digit OTP
  // Step 3: Set New Password & Confirm Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // STEP 1: Send OTP to User Email via Nodemailer
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-forgot-password-otp', { email });
      setSuccessMsg(res.data?.message || `6-Digit OTP sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-Digit OTP with Backend
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email inbox.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-forgot-password-otp', {
        email,
        otp
      });

      setSuccessMsg(res.data?.message || 'OTP verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 6-digit OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset & Update Password in Database
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password-with-otp', {
        email,
        otp,
        newPassword
      });

      setSuccessMsg(res.data?.message || 'Password updated successfully!');
      if (onSuccessEmail) onSuccessEmail(email);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-6"
        >
          {/* Close Modal Button */}
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            
            <h2 className="font-space text-xl font-extrabold text-slate-900">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify Email OTP'}
              {step === 3 && 'Set New Password'}
            </h2>

            {/* Step Progress Indicators */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-rose-600' : 'bg-slate-200'}`} />
              <span className={`w-6 h-1 rounded-full ${step >= 2 ? 'bg-rose-600' : 'bg-slate-200'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-rose-600' : 'bg-slate-200'}`} />
              <span className={`w-6 h-1 rounded-full ${step >= 3 ? 'bg-rose-600' : 'bg-slate-200'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-rose-600' : 'bg-slate-200'}`} />
            </div>

            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              {step === 1 && 'Enter your email address to receive a 6-digit verification code.'}
              {step === 2 && `Enter the 6-digit OTP code sent to your email (${email}).`}
              {step === 3 && 'OTP Verified! Enter your new password below to update your account.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-space font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-space font-semibold text-center flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL & CLICK SEND OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-600 tracking-wider mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-space font-bold text-sm transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>{loading ? 'Sending OTP to Email...' : 'Send OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: ENTER 6-DIGIT OTP & CLICK VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-space font-bold uppercase text-slate-600 tracking-wider">
                    6-Digit Email OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-[11px] font-space font-bold text-rose-600 hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                </div>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-space font-extrabold tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-space font-bold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>{loading ? 'Verifying OTP Code...' : 'Verify OTP'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD & CLICK UPDATE PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-600 tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-600 tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-space font-bold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>{loading ? 'Updating Password in Database...' : 'Update Password'}</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
