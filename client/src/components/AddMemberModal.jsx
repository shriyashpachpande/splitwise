import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const AddMemberModal = ({ isOpen, onClose, groupId, onMemberAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() && !email.trim()) {
      setError('Please enter a member name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/groups/${groupId}/members`, {
        name: name.trim(),
        email: email.trim()
      });

      setSuccessMsg(`Member added successfully!`);
      setTimeout(() => {
        setName('');
        setEmail('');
        setSuccessMsg('');
        onMemberAdded();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member to group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative my-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                <UserPlus className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="font-space text-xl font-extrabold text-slate-900 tracking-tight">Add Member</h2>
                <p className="text-xs text-slate-500">Add a friend to split expenses</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-space text-base font-bold text-slate-900">{successMsg}</h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Member Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, Aman, Priya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="finlance-btn-secondary px-5 py-2.5 text-xs font-space"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="finlance-btn-primary px-6 py-2.5 text-xs font-space disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
