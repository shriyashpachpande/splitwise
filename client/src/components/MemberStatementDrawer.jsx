import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ArrowUpRight, ArrowDownLeft, Receipt, Wallet, Sparkles, ArrowRight, CheckCircle2, History, Scale, FileText, FileSpreadsheet } from 'lucide-react';
import Lenis from 'lenis';
import { formatCurrency, formatSignedBalance } from '../utils/currencyFormatter';
import { exportMemberStatementPdf } from '../utils/pdfExport';
import { exportMemberStatementExcel } from '../utils/excelExport';

export const MemberStatementDrawer = ({
  isOpen,
  onClose,
  member,
  group = {},
  allMembers = [],
  expenses = [],
  settlements = [],
  simplifiedTx = [],
  currency = 'INR',
  onSettleClick
}) => {
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PAID' | 'SHARED'
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

  if (!isOpen || !member) return null;

  const memberId = (member._id || member.id || member.userId?._id || member.userId)?.toString();
  const memberName = member.name || 'Member';
  const memberEmail = member.email || '';
  const memberAvatar = member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberName)}`;

  // Find overall net position stats
  const totalPaid = member.totalPaid !== undefined ? member.totalPaid : 0;
  const totalShare = member.totalShare !== undefined ? member.totalShare : 0;
  const netBalance = member.netBalance !== undefined ? member.netBalance : (totalPaid - totalShare);

  const isPos = netBalance > 0.01;
  const isNeg = netBalance < -0.01;

  // Compute pairwise relationships for this member from simplified transactions
  const owesToOthers = [];
  const getsFromOthers = [];

  simplifiedTx.forEach(tx => {
    const fId = (tx.fromUser?._id || tx.fromUser)?.toString();
    const tId = (tx.toUser?._id || tx.toUser)?.toString();

    if (fId === memberId) {
      owesToOthers.push({
        user: tx.toUser,
        amount: tx.amount
      });
    } else if (tId === memberId) {
      getsFromOthers.push({
        user: tx.fromUser,
        amount: tx.amount
      });
    }
  });

  // Calculate detailed transaction ledger for this member
  const memberTransactions = expenses
    .map(exp => {
      const payersList = exp.payers || [];
      const participantsList = exp.participants || [];

      const payerObj = payersList.find(p => (p.userId?._id || p.userId)?.toString() === memberId);
      const participantObj = participantsList.find(p => (p.userId?._id || p.userId)?.toString() === memberId);

      const isPayer = !!payerObj;
      const isParticipant = !!participantObj;

      if (!isPayer && !isParticipant) return null;

      const amountPaidByMember = payerObj ? (payerObj.amount || 0) : 0;
      const shareOwedByMember = participantObj ? (participantObj.shareAmount || 0) : 0;
      const netImpact = amountPaidByMember - shareOwedByMember;

      const firstPayer = payersList[0]?.userId?.name || 'Someone';

      return {
        _id: exp._id,
        description: exp.description,
        category: exp.category,
        totalAmount: exp.amount,
        date: exp.date,
        isPayer,
        isParticipant,
        amountPaidByMember,
        shareOwedByMember,
        netImpact,
        firstPayer
      };
    })
    .filter(Boolean);

  // Filter transactions based on tab
  const filteredTransactions = memberTransactions.filter(tx => {
    if (filterTab === 'PAID') return tx.isPayer;
    if (filterTab === 'SHARED') return tx.isParticipant;
    return true;
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
            <div className="flex items-center space-x-3.5">
              <img
                src={memberAvatar}
                alt={memberName}
                className="w-12 h-12 rounded-full border-2 border-violet-200 bg-white object-cover shadow-sm"
              />
              <div>
                <h3 className="font-space text-lg font-extrabold text-slate-900">{memberName}</h3>
                <p className="text-xs text-slate-500 font-medium">{memberEmail || 'Group Member'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Lenis Inertia Scroll */}
          <div
            ref={scrollRef}
            data-lenis-prevent
            className="overflow-y-auto p-6 space-y-6 flex-1 custom-modal-scroll"
          >
            <div>
              {/* Summary Stats Grid */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-space font-bold uppercase tracking-wider text-slate-500">
                    Financial Summary
                  </span>
                  <span className={`text-xs font-space font-extrabold px-3 py-1 rounded-full border ${
                    isPos
                      ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200'
                      : isNeg
                      ? 'bg-rose-100/90 text-rose-800 border-rose-200'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {isPos ? 'Gets Back Overall' : isNeg ? 'Owes Money Overall' : 'Settled Up'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] font-space font-bold uppercase text-slate-400">Total Paid</span>
                    <p className="font-space text-sm font-extrabold text-slate-900 mt-0.5">
                      {formatCurrency(totalPaid, currency)}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] font-space font-bold uppercase text-slate-400">Total Share</span>
                    <p className="font-space text-sm font-extrabold text-slate-900 mt-0.5">
                      {formatCurrency(totalShare, currency)}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] font-space font-bold uppercase text-slate-400">Net Position</span>
                    <p className={`font-space text-sm font-extrabold mt-0.5 ${
                      isPos ? 'text-emerald-600' : isNeg ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      {formatSignedBalance(netBalance, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAIRWISE SETTLEMENT BREAKDOWN (Kisko Kitna Dena Hai / Kisse Kitna Milna Hai) */}
              <div className="mt-6 space-y-3">
                <h4 className="font-space text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Settlement Breakdown (Whom to Pay / Receive)
                </h4>

                {owesToOthers.length === 0 && getsFromOthers.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs font-space font-semibold text-emerald-800">
                    🎉 {memberName} has zero pending debts in this group!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Owes to Others */}
                    {owesToOthers.map((item, idx) => {
                      const uName = item.user?.name || 'Member';
                      const uAvatar = item.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uName)}`;
                      return (
                        <div key={idx} className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={uAvatar} alt={uName} className="w-8 h-8 rounded-full border border-rose-200 bg-white object-cover" />
                            <div>
                              <p className="font-space text-xs font-extrabold text-slate-900">
                                {memberName} <span className="text-rose-600">owes</span> {uName}
                              </p>
                              <span className="text-[10px] font-space text-slate-500">Pending payment</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-space text-sm font-extrabold text-rose-600">
                              {formatCurrency(item.amount, currency)}
                            </span>
                            {onSettleClick && (
                              <button
                                onClick={() => {
                                  onSettleClick(member, item.user, item.amount);
                                  onClose();
                                }}
                                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-space font-bold text-[11px] shadow-xs hover:bg-rose-700 transition-all"
                              >
                                Settle
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Gets from Others */}
                    {getsFromOthers.map((item, idx) => {
                      const uName = item.user?.name || 'Member';
                      const uAvatar = item.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uName)}`;
                      return (
                        <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={uAvatar} alt={uName} className="w-8 h-8 rounded-full border border-emerald-200 bg-white object-cover" />
                            <div>
                              <p className="font-space text-xs font-extrabold text-slate-900">
                                {uName} <span className="text-emerald-600">owes</span> {memberName}
                              </p>
                              <span className="text-[10px] font-space text-slate-500">Receivable</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-space text-sm font-extrabold text-emerald-600">
                              {formatCurrency(item.amount, currency)}
                            </span>
                            {onSettleClick && (
                              <button
                                onClick={() => {
                                  onSettleClick(item.user, member, item.amount);
                                  onClose();
                                }}
                                className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-space font-bold text-[11px] shadow-xs hover:bg-emerald-700 transition-all"
                              >
                                Collect
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ITEMIZED TRANSACTION HISTORY (Kidhar Kidhar Pay Kare / Participated) */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-space text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    Transaction History ({filteredTransactions.length})
                  </h4>

                  {/* Filter Pills */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-space font-bold">
                    <button
                      onClick={() => setFilterTab('ALL')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all ${
                        filterTab === 'ALL' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterTab('PAID')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all ${
                        filterTab === 'PAID' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setFilterTab('SHARED')}
                      className={`px-2.5 py-0.5 rounded-lg transition-all ${
                        filterTab === 'SHARED' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Shared
                    </button>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                    No transactions found for {memberName} in this category.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map(tx => (
                      <div
                        key={tx._id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 hover:border-violet-300 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-space text-sm font-extrabold text-slate-900">{tx.description}</h5>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              <span>{tx.category}</span>
                              <span className="mx-1">•</span>
                              <span>Paid by <span className="font-bold text-slate-700">{tx.firstPayer}</span></span>
                              <span className="mx-1">•</span>
                              <span>{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            </p>
                          </div>
                          <span className="font-space text-sm font-extrabold text-slate-900">
                            {formatCurrency(tx.totalAmount, currency)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-space">
                          <div className="flex items-center space-x-2">
                            {tx.isPayer && (
                              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold">
                                Paid ₹{tx.amountPaidByMember.toFixed(2)}
                              </span>
                            )}
                            {tx.isParticipant && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                                Share ₹{tx.shareOwedByMember.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <span className={`font-bold ${
                            tx.netImpact > 0.01
                              ? 'text-emerald-600'
                              : tx.netImpact < -0.01
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}>
                            {tx.netImpact > 0.01
                              ? `+${formatCurrency(tx.netImpact, currency)}`
                              : tx.netImpact < -0.01
                              ? formatCurrency(tx.netImpact, currency)
                              : '₹0.00'}
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
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0 gap-2.5">
            <button
              onClick={() => exportMemberStatementPdf(member, group, expenses, simplifiedTx, currency)}
              className="flex-1 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-space font-bold text-xs border border-rose-200/90 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              title="Export Member PDF Statement"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => exportMemberStatementExcel(member, group, expenses, simplifiedTx, currency)}
              className="flex-1 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-space font-bold text-xs border border-emerald-200/90 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              title="Export Member Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-space font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
