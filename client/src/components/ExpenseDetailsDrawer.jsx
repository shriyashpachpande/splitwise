import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, User, Tag, Receipt, CheckCircle2, Edit2 } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';

export const ExpenseDetailsDrawer = ({
  expense,
  isOpen,
  onClose,
  currency = 'INR',
  onDeleteExpense,
  onEditExpense
}) => {
  if (!isOpen || !expense) return null;

  const firstPayer = expense.payers[0]?.userId?.name || 'Someone';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{expense.description}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                    {expense.category}
                  </span>
                  <span>•</span>
                  <span>{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {onEditExpense && (
                <button
                  onClick={() => {
                    onEditExpense(expense);
                    onClose();
                  }}
                  title="Edit Expense"
                  className="text-violet-600 hover:text-violet-800 p-2 rounded-2xl hover:bg-violet-50 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Amount Badge */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Expense Amount</span>
              <p className="text-3xl font-space font-black text-slate-900 mt-1">
                {formatCurrency(expense.amount, currency)}
              </p>
            </div>

            {/* Paid By */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-space font-bold uppercase text-slate-500 tracking-wider">Paid By</h4>
                {onEditExpense && (
                  <button
                    onClick={() => {
                      onEditExpense(expense);
                      onClose();
                    }}
                    className="text-xs font-space font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change Payer / Edit</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {expense.payers.map((p, idx) => {
                  const payerName = p.userId?.name || 'User';
                  const payerAvatar = p.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payerName}`;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <div className="flex items-center space-x-3">
                        <img
                          src={payerAvatar}
                          alt={payerName}
                          className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                        />
                        <span className="text-sm font-space font-bold text-slate-800">{payerName}</span>
                      </div>
                      <span className="text-sm font-space font-bold text-emerald-600">
                        {formatCurrency(p.amount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Shares Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-space font-bold uppercase text-slate-500 tracking-wider">Split Breakdown</h4>
                <span className="text-xs font-space font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  {expense.splitType}
                </span>
              </div>

              <div className="space-y-2">
                {expense.participants.map((part, idx) => {
                  const partName = part.userId?.name || 'User';
                  const partAvatar = part.userId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partName}`;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <div className="flex items-center space-x-3">
                        <img
                          src={partAvatar}
                          alt={partName}
                          className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                        />
                        <span className="text-sm font-space font-semibold text-slate-800">{partName}</span>
                      </div>
                      <span className="text-sm font-space font-bold text-slate-900">
                        {formatCurrency(part.shareAmount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line Items if Item-Wise */}
            {expense.splitType === 'ITEM_WISE' && expense.items?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-space font-bold uppercase text-slate-500 tracking-wider">Line Items</h4>
                <div className="space-y-2">
                  {expense.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between font-space font-bold text-slate-800">
                        <span>{item.name}</span>
                        <span>{formatCurrency(item.price, currency)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Participants: {item.participants.map(id => id?.name || id).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              {onEditExpense && (
                <button
                  onClick={() => {
                    onEditExpense(expense);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-space font-bold text-xs flex items-center space-x-1.5 border border-violet-200 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Expense</span>
                </button>
              )}
              <button
                onClick={() => {
                  onDeleteExpense(expense._id);
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-space font-bold text-xs flex items-center space-x-1.5 border border-rose-200 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-space font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
