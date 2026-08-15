import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, ShieldCheck, Mail } from 'lucide-react';
import api from '../services/api';

export const InviteMemberModal = ({ isOpen, onClose, group, onMemberAdded }) => {
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !group) return null;

  const inviteCode = group.inviteCode || group._id;

  const handleSendOtpInvite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSuccess(null);

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setErrorMsg('Please enter both full name and email address.');
      return;
    }

    try {
      setSendingOtp(true);
      const response = await api.post('/groups/invite/send-otp', {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        inviteCode
      });

      setOtpSuccess(response.data);
      setInviteName('');
      setInviteEmail('');
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP invite. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space text-lg font-extrabold text-slate-900">Invite via Email OTP</h3>
                <p className="text-xs text-slate-500 font-medium">Group: {group.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSendOtpInvite} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Enter your friend's name and email address below. We will dispatch a secure 6-digit OTP code to their email inbox!
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-medium">
                {errorMsg}
              </div>
            )}

            {otpSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-800 font-medium">
                <div className="flex items-center space-x-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>6-Digit OTP Sent Successfully!</span>
                </div>
                <p>An email with the 6-digit OTP code has been dispatched to the email inbox.</p>
              </div>
            )}

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

            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-space font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
            >
              {sendingOtp ? (
                <span>Sending 6-Digit OTP Email...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send 6-Digit OTP Invite</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-space font-medium">
            <span>🔒 Encrypted & Verified 6-Digit OTP</span>
            <span>Expires in 10 mins</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
