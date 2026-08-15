import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/currencyFormatter';

export const SettleUpModal = ({
  isOpen,
  onClose,
  groupId,
  members = [],
  initialFromUser = null,
  initialToUser = null,
  initialAmount = '',
  onSettlementCreated
}) => {
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen && members.length >= 2) {
      setFromUserId(initialFromUser?._id || members[0]._id);
      const defaultTo = members.find(m => m._id !== (initialFromUser?._id || members[0]._id));
      setToUserId(initialToUser?._id || defaultTo?._id || members[1]._id);
      setAmount(initialAmount || '');
      setNote('');
      setError('');
      setSuccessMsg(false);
    }
  }, [isOpen, members, initialFromUser, initialToUser, initialAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      setError('Settlement amount must be greater than 0');
      return;
    }

    if (fromUserId === toUserId) {
      setError('Payer and recipient cannot be the same person');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/groups/${groupId}/settlements`, {
        fromUserId,
        toUserId,
        amount: amtNum,
        note: note.trim()
      });

      setSuccessMsg(true);
      setTimeout(() => {
        onSettlementCreated();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error recording settlement');
    } finally {
      setSubmitting(false);
    }
  };

  const fromUser = members.find(m => m._id === fromUserId);
  const toUser = members.find(m => m._id === toUserId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl relative my-auto overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                <ArrowRightLeft className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="font-space text-xl font-extrabold text-slate-900 tracking-tight">Settle Up</h2>
                <p className="text-xs text-slate-500">Record direct payment between group members</p>
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
            <div className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start space-x-2 flex-shrink-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-space text-lg font-bold text-slate-900">Settlement Recorded!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                {fromUser?.name} paid {toUser?.name} {formatCurrency(parseFloat(amount) || 0)}
              </p>
            </div>
          ) : (
            <form data-lenis-prevent onSubmit={handleSubmit} className="overflow-y-auto pr-1.5 pt-5 space-y-4 flex-1 custom-modal-scroll">
              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Payer (Who Paid)
                </label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                >
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Recipient (Who Received)
                </label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                >
                  {members.filter(m => m._id !== fromUserId).map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Settlement Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 pl-8 pr-4 py-2.5 rounded-2xl text-sm font-space font-bold text-emerald-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                  Note / Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via UPI / GPay"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 flex-shrink-0">
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
                  {submitting ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
