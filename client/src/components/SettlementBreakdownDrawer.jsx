import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, ArrowRight, CheckCircle2, DollarSign, Sparkles, Scale, Info } from 'lucide-react';
import Lenis from 'lenis';
import { formatCurrency } from '../utils/currencyFormatter';

export const SettlementBreakdownDrawer = ({
  isOpen,
  onClose,
  fromUser,
  toUser,
  netSettlementAmount = 0,
  expenses = [],
  settlements = [],
  currency = 'INR',
  onSettleNow
}) => {
  const scrollRef = useRef(null);

  // Setup Lenis Smooth Inertia Scroll inside Drawer
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const lenis = new Lenis({
        wrapper: scrollRef.current,
        content: scrollRef.current.firstElementChild,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.2,
        touchMultiplier: 2,
      });

      let animationFrameId;
      function raf(time) {
        lenis.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      }
      animationFrameId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(animationFrameId);
        lenis.destroy();
      };
    }
  }, [isOpen]);

  if (!isOpen || !fromUser || !toUser) return null;

  const fromId = fromUser._id?.toString() || fromUser.toString();
  const toId = toUser._id?.toString() || toUser.toString();

  const fromName = fromUser.name || 'Debtor';
  const toName = toUser.name || 'Creditor';

  const fromAvatar = fromUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fromName)}`;
  const toAvatar = toUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(toName)}`;

  // Filter expenses involving BOTH fromUser and toUser
  const sharedExpenses = expenses.filter(exp => {
    const payersList = exp.payers || [];
    const participantsList = exp.participants || [];

    const isFromPayer = payersList.some(p => (p.userId?._id || p.userId)?.toString() === fromId);
    const isToPayer = payersList.some(p => (p.userId?._id || p.userId)?.toString() === toId);

    const isFromPart = participantsList.some(p => (p.userId?._id || p.userId)?.toString() === fromId);
    const isToPart = participantsList.some(p => (p.userId?._id || p.userId)?.toString() === toId);

    return (isFromPayer && isToPart) || (isToPayer && isFromPart);
  });

  // Calculate detailed itemized breakdown math
  let totalOwedToCreditor = 0; // Share owed by fromUser for bills paid by toUser
  let totalOwedToDebtor = 0;   // Share owed by toUser for bills paid by fromUser

  const itemizedList = sharedExpenses.map(exp => {
    const payersList = exp.payers || [];
    const participantsList = exp.participants || [];

    // Check if toUser paid
    const toPayerObj = payersList.find(p => (p.userId?._id || p.userId)?.toString() === toId);
    const fromParticipantObj = participantsList.find(p => (p.userId?._id || p.userId)?.toString() === fromId);

    // Check if fromUser paid
    const fromPayerObj = payersList.find(p => (p.userId?._id || p.userId)?.toString() === fromId);
    const toParticipantObj = participantsList.find(p => (p.userId?._id || p.userId)?.toString() === toId);

    let impactAmount = 0; // Positive if fromUser owes toUser, negative if toUser owes fromUser
    let payerName = 'Group Member';

    if (toPayerObj && fromParticipantObj) {
      const share = fromParticipantObj.shareAmount || 0;
      totalOwedToCreditor += share;
      impactAmount = share;
      payerName = toName;
    } else if (fromPayerObj && toParticipantObj) {
      const share = toParticipantObj.shareAmount || 0;
      totalOwedToDebtor += share;
      impactAmount = -share;
      payerName = fromName;
    }

    return {
      _id: exp._id,
      description: exp.description,
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      payerName,
      impactAmount,
      fromShare: fromParticipantObj ? fromParticipantObj.shareAmount : 0,
      toShare: toParticipantObj ? toParticipantObj.shareAmount : 0
    };
  });

  // Past settlements between these two
  const directSettlements = settlements.filter(s => {
    const sFrom = (s.fromUser?._id || s.fromUser)?.toString();
    const sTo = (s.toUser?._id || s.toUser)?.toString();
    return (sFrom === fromId && sTo === toId) || (sFrom === toId && sTo === fromId);
  });

  let settledAmount = 0;
  directSettlements.forEach(s => {
    const sFrom = (s.fromUser?._id || s.fromUser)?.toString();
    if (sFrom === fromId) {
      settledAmount += s.amount;
    } else {
      settledAmount -= s.amount;
    }
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm overflow-hidden">
        {/* Backdrop Click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0 bg-slate-50/50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-violet-600" />
                <h3 className="font-space text-lg font-extrabold text-slate-900">Settlement Audit Trail</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Transparent itemized expense proof & net calculation
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Lenis Dedicated Inertia Scroll */}
          <div
            ref={scrollRef}
            data-lenis-prevent
            className="overflow-y-auto p-6 space-y-6 flex-1 custom-modal-scroll"
          >
            <div>
              {/* Users Pair Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-50/90 via-white to-emerald-50/80 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  {/* From User */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={fromAvatar}
                      alt={fromName}
                      className="w-12 h-12 rounded-full border-2 border-rose-200 bg-white object-cover shadow-sm"
                    />
                    <div>
                      <h4 className="font-space text-sm font-extrabold text-slate-900">{fromName}</h4>
                      <span className="text-[10px] font-space font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Owes Money
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-2">
                    <ArrowRight className="w-5 h-5 text-violet-600 animate-pulse" />
                  </div>

                  {/* To User */}
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-space text-sm font-extrabold text-slate-900 text-right">{toName}</h4>
                      <span className="text-[10px] font-space font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 float-right">
                        Gets Paid
                      </span>
                    </div>
                    <img
                      src={toAvatar}
                      alt={toName}
                      className="w-12 h-12 rounded-full border-2 border-emerald-200 bg-white object-cover shadow-sm"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-500">
                    Net Settlement Due
                  </span>
                  <p className="font-space text-3xl font-black text-slate-900">
                    {formatCurrency(netSettlementAmount, currency)}
                  </p>
                </div>
              </div>

              {/* Mathematical Proof Ledger Box */}
              <div className="mt-5 p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-space text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span>Mathematical Calculation Proof</span>
                  </h4>
                </div>

                <div className="space-y-2 text-xs font-space font-medium">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-slate-600">➕ {fromName}'s share of bills paid by {toName}</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(totalOwedToCreditor, currency)}</span>
                  </div>

                  {totalOwedToDebtor > 0 && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-slate-600">➖ {toName}'s share of bills paid by {fromName}</span>
                      <span className="font-extrabold text-emerald-600">-{formatCurrency(totalOwedToDebtor, currency)}</span>
                    </div>
                  )}

                  {settledAmount !== 0 && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-slate-600">➖ Previous direct settlements paid</span>
                      <span className="font-extrabold text-emerald-600">-{formatCurrency(settledAmount, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 rounded-2xl bg-violet-600 text-white font-bold pt-2.5 shadow-md">
                    <span>Net Balance Owed</span>
                    <span className="text-base font-black">{formatCurrency(netSettlementAmount, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Shared Expenses */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-space text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Shared Expenses ({itemizedList.length})
                  </h4>
                  <span className="text-[11px] font-space font-bold text-violet-600">Line-by-Line Breakdown</span>
                </div>

                {itemizedList.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                    No direct shared expenses found between {fromName} and {toName}. This amount is derived via multi-person debt simplification.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemizedList.map((item) => (
                      <div
                        key={item._id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-space text-sm font-extrabold text-slate-900">{item.description}</h5>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              <span>Paid by <span className="font-bold text-slate-700">{item.payerName}</span></span>
                              <span className="mx-1">•</span>
                              <span>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            </p>
                          </div>
                          <span className="font-space text-sm font-extrabold text-slate-900">
                            {formatCurrency(item.amount, currency)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-space">
                          <span className="text-slate-500 font-medium">
                            {fromName}'s share: <span className="font-bold text-slate-800">{formatCurrency(item.fromShare, currency)}</span>
                          </span>
                          <span className={`font-bold ${item.impactAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.impactAmount > 0 ? `+ ${formatCurrency(item.impactAmount, currency)} owed` : `- ${formatCurrency(Math.abs(item.impactAmount), currency)} credit`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-space font-bold text-xs transition-colors"
            >
              Close Audit
            </button>

            {onSettleNow && (
              <button
                onClick={() => {
                  onSettleNow(fromUser, toUser, netSettlementAmount);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-extrabold text-xs shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Settle Up {formatCurrency(netSettlementAmount, currency)}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
