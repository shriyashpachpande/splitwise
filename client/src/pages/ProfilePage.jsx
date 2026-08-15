import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { User, Mail, Shield, CheckCircle2, LogOut, Edit3, Save, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Full name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: name.trim() });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Profile Settings">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Header Hero Card */}
        <div className="finlance-card p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 pb-6 border-b border-slate-100">
            <div className="relative group">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                alt={user?.name}
                className="w-20 h-20 rounded-full border-4 border-violet-100 bg-slate-100 object-cover shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h2 className="font-space text-2xl font-extrabold text-slate-900 tracking-tight">{user?.name}</h2>
                <span className="text-xs font-space font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/90 shadow-xs flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">{user?.email}</p>
            </div>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-space font-bold flex items-center space-x-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Profile updated successfully! ✨</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-space font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                  Full Name
                </label>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-space font-bold text-violet-600 hover:text-violet-700 flex items-center space-x-1 hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Name</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-violet-600 font-bold">Editing Name...</span>
                )}
              </div>

              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-space font-bold transition-all ${
                    isEditing
                      ? 'bg-white border-2 border-violet-600 text-slate-900 shadow-md ring-4 ring-violet-100'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-700 cursor-not-allowed'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Email Field (Read Only) */}
            <div className="space-y-2">
              <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                Email Address (Primary)
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-space font-medium text-slate-500 bg-slate-100/70 border border-slate-200/80 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium px-1">
                Your email is used for login and receiving trip expense split notifications.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-extrabold text-xs shadow-lg shadow-violet-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setName(user?.name || '');
                      setIsEditing(false);
                      setError('');
                    }}
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-space font-bold text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-5 py-2.5 rounded-full bg-rose-50 text-rose-600 font-space font-bold text-xs hover:bg-rose-100 border border-rose-200 flex items-center space-x-2 transition-colors ml-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
};
