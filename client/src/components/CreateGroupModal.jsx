import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Users, AlertCircle } from 'lucide-react';
import api from '../services/api';

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('INR');
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!memberEmailInput.trim()) return;
    const email = memberEmailInput.trim().toLowerCase();
    if (memberEmails.includes(email)) {
      setError('Member email already added to invite list');
      return;
    }
    setMemberEmails([...memberEmails, email]);
    setMemberEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setMemberEmails(memberEmails.filter(e => e !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/groups', {
        name,
        description,
        startDate,
        endDate,
        currency,
        memberEmails
      });

      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
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
          className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative my-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                <Users className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="font-space text-xl font-extrabold text-slate-900 tracking-tight">Create New Group</h2>
                <p className="text-xs text-slate-500">Organize trip expenses & split settlements</p>
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
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-5">
            <div>
              <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Manali Trip"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mountain adventure with friends"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                Invite Members by Email
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={memberEmailInput}
                  onChange={(e) => setMemberEmailInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-4 py-2.5 bg-violet-50 border border-violet-200 hover:bg-violet-100 text-violet-700 rounded-2xl text-xs font-space font-bold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {memberEmails.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {memberEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold rounded-full"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
