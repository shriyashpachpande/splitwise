import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2, Sparkles, X, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';

export const SimplifiedBalancesView = ({
  simplifiedTransactions = [],
  currency = 'INR',
  onSettleClick,
  onTileClick
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Information Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-space font-extrabold text-indigo-950 uppercase tracking-wider">
              ✨ Simplified Balances
            </h4>
            <p className="text-xs text-indigo-800/90 mt-0.5 font-medium">
              We simplify your balance in a group to reduce the total number of payments. Click any row for proof details.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfoModal(true)}
          className="text-xs font-space font-bold text-indigo-600 hover:text-indigo-700 underline flex-shrink-0 flex items-center space-x-1"
        >
          <span>Learn more</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Transactions List */}
      {simplifiedTransactions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="font-space font-bold text-emerald-900 text-sm">Everyone is settled up 🎉</p>
          <p className="text-xs text-emerald-700 font-medium">No outstanding payments needed in this group.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {simplifiedTransactions.map((tx, idx) => {
            const fromName = tx.fromUser?.name || 'User';
            const fromAvatar = tx.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fromName)}`;
            const toName = tx.toUser?.name || 'User';
            const toAvatar = tx.toUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(toName)}`;

            return (
              <div
                key={idx}
                onClick={() => onTileClick && onTileClick(tx.fromUser, tx.toUser, tx.amount)}
                className="saas-card p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white cursor-pointer hover:border-violet-300 hover:shadow-md transition-all group relative"
              >
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {/* From User */}
                  <div className="flex items-center space-x-2">
                    <img
                      src={fromAvatar}
                      alt={fromName}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    />
                    <span className="text-sm font-space font-bold text-slate-800">{fromName}</span>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                    <span className="font-space font-bold text-[11px]">owes</span>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-600" />
                  </div>

                  {/* To User */}
                  <div className="flex items-center space-x-2">
                    <img
                      src={toAvatar}
                      alt={toName}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    />
                    <span className="text-sm font-space font-bold text-slate-800">{toName}</span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-base font-space font-black text-slate-900">
                    {formatCurrency(tx.amount, currency)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTileClick) onTileClick(tx.fromUser, tx.toUser, tx.amount);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors hidden sm:flex items-center space-x-1 text-xs font-space font-semibold"
                    title="View Settlement Audit Proof"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Proof</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSettleClick(tx.fromUser, tx.toUser, tx.amount);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-extrabold text-xs shadow-sm shadow-violet-500/20 transition-all active:scale-95"
                  >
                    Settle Up
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-space">Debt Simplification Algorithm</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-space">
              "We simplify your balance in a group to reduce the total number of payments needed. It doesn't change anyone's total net balance."
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 font-space">
              <p className="font-bold text-slate-800">Example:</p>
              <p>• Without simplification: A owes B ₹500, and B owes C ₹500 (2 transactions).</p>
              <p>• With simplification: A pays C ₹500 directly (1 transaction).</p>
              <p className="text-emerald-600 font-bold pt-1">
                Everyone's final balance stays 100% mathematically identical!
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-indigo-600 text-white font-space font-bold rounded-xl text-xs"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
