import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const InviteMemberModal = ({ isOpen, onClose, group, onMemberAdded }) => {
  const [step, setStep] = useState(1); // 1: Enter details & send OTP, 2: Enter & Verify OTP
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !group) return null;

  const inviteCode = group.inviteCode || group._id;

  const resetForm = () => {
    setStep(1);
    setInviteName('');
    setInviteEmail('');
    setOtpCode('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setErrorMsg('Please enter both full name and email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/groups/invite/send-otp', {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        inviteCode
      });

      setSuccessMsg(response.data.message || `6-digit OTP code dispatched to ${inviteEmail.trim()}`);
      setStep(2); // Automatically transition to Step 2 for OTP input!
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP & Join Group
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/groups/invite/verify-otp', {
        inviteCode,
        email: inviteEmail.trim(),
        otp: otpCode.trim(),
        name: inviteName.trim()
      });

      setSuccessMsg(`🎉 ${inviteName} verified the OTP and joined "${group.name}"!`);
      if (onMemberAdded) onMemberAdded();

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired 6-digit OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md overflow-y-auto">
        <div className="absolute inset-0" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {step === 2 ? (
                <button
                  onClick={() => { setStep(1); setErrorMsg(''); }}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <UserPlus className="w-5 h-5" />
                </div>
              )}

              <div>
                <h3 className="font-space text-lg font-extrabold text-slate-900">
                  {step === 1 ? 'Invite Member via OTP' : 'Enter 6-Digit OTP Code'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Group: {group.name}</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-xs text-emerald-900 font-medium">
              <div className="flex items-center space-x-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Enter Name & Email to Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Enter your friend's full name and email address below. We will send a secure 6-digit OTP code to their email inbox to verify their identity!
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-space font-extrabold text-slate-500 uppercase tracking-wider">
                    Friend's Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-space font-extrabold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-space font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending 6-Digit OTP...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send 6-Digit OTP Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter 6-Digit OTP to Verify */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl text-xs text-violet-800 space-y-1">
                <p className="font-bold">✉️ OTP Sent to: <span className="underline">{inviteEmail}</span></p>
                <p className="text-[11px] text-violet-600">Please enter the 6-digit code received in the inbox below to confirm member entry.</p>
              </div>

              <div>
                <label className="text-[11px] font-space font-extrabold text-slate-500 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <div className="relative mt-1">
                  <KeyRound className="w-4 h-4 text-violet-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 898703"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-base font-mono tracking-widest font-extrabold text-slate-900 focus:outline-none focus:border-violet-500 text-center"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-space font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying OTP Code...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify OTP & Add to Group</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-violet-600 font-bold hover:underline"
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrorMsg(''); }}
                    className="text-slate-500 font-medium hover:underline"
                  >
                    Change Email / Name
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-space font-medium">
            <span>🔒 Encrypted 2-Step OTP Verification</span>
            <span>Expires in 10 mins</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
