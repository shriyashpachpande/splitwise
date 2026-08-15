import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Mail, KeyRound, ArrowRight, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const JoinGroupPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [groupInfo, setGroupInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState('');

  // Step state: 1 = Enter Details, 2 = Enter 6-Digit OTP
  const [step, setStep] = useState(1);

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const inputRefs = useRef([]);

  // Fetch Group metadata on load
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        setLoadingInfo(true);
        const res = await api.get(`/groups/invite-info/${inviteCode}`);
        setGroupInfo(res.data);
      } catch (err) {
        setInfoError(err.response?.data?.message || 'Invalid or expired invite link.');
      } finally {
        setLoadingInfo(false);
      }
    };

    if (inviteCode) {
      fetchGroupInfo();
    }
  }, [inviteCode]);

  // Handle Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please enter your full name and email address.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await api.post('/groups/invite/send-otp', {
        name: name.trim(),
        email: email.trim(),
        inviteCode
      });

      setDevOtp(res.data.devOtp || null);
      setSuccessMessage(`6-digit OTP code sent to ${email.trim()}`);
      setStep(2);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);

    // Auto-focus next input box
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpArray(digits);
      if (inputRefs.current[5]) inputRefs.current[5].focus();
    }
  };

  // Handle OTP key down (backspace support)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle Verify OTP & Join
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const fullOtp = otpArray.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await api.post('/groups/invite/verify-otp', {
        name: name.trim(),
        email: email.trim(),
        inviteCode,
        otp: fullOtp
      });

      // Save token and log in user in AuthContext
      if (loginWithToken) {
        await loginWithToken(res.data.token, res.data.user);
      } else {
        localStorage.setItem('token', res.data.token);
      }

      setSuccessMessage('🎉 Verified! Joining group...');
      setTimeout(() => {
        navigate(`/groups/${res.data.groupId}`);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid or expired 6-Digit OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-violet-400 font-space font-bold">
        Loading Group Invite...
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-space text-xl font-extrabold text-slate-900">Invalid Invite Link</h2>
          <p className="text-xs text-slate-500 font-medium">{infoError}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-2xl bg-violet-600 text-white font-space font-bold text-xs"
          >
            Go to Login Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 font-space text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Group Invitation</span>
          </div>

          <h2 className="font-space text-2xl font-black text-slate-900">
            Join <span className="text-violet-600">{groupInfo?.name}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Invited by <strong className="text-slate-800">{groupInfo?.createdBy?.name || 'Group Owner'}</strong> • {groupInfo?.memberCount} Members
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}



        {/* STEP 1: Name & Email Input */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-space font-extrabold text-slate-500 uppercase tracking-wider">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name (e.g. Aman Gupta)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-space font-extrabold text-slate-500 uppercase tracking-wider">
                  Your Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-space font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-violet-200 disabled:opacity-50"
            >
              {sendingOtp ? (
                <span>Sending OTP Code...</span>
              ) : (
                <>
                  <span>Request 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6-Digit OTP Entry */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 font-medium">
                Enter the 6-digit OTP code sent to <strong className="text-slate-900">{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-space font-bold text-violet-600 hover:underline"
              >
                Edit Name or Email
              </button>
            </div>

            {/* 6 OTP Input Boxes */}
            <div className="flex items-center justify-center gap-2">
              {otpArray.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 text-center text-lg font-space font-extrabold bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white shadow-xs transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={verifyingOtp}
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-space font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-violet-200 disabled:opacity-50"
            >
              {verifyingOtp ? (
                <span>Verifying OTP...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Join Group</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link to="/login" className="text-xs font-space font-bold text-slate-400 hover:text-slate-700">
            Already have an account? Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
