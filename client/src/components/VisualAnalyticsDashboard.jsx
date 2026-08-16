import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatSignedBalance } from '../utils/currencyFormatter';
import { ThreeDColumnChart } from './ThreeDColumnChart';
import { ThreeDGaugeRings } from './ThreeDGaugeRings';
import {
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRightLeft,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Layers,
  Award,
  TrendingUp
} from 'lucide-react';

export const VisualAnalyticsDashboard = ({
  group,
  expenses = [],
  settlements = [],
  simplifiedTx = [],
  analyticsData = null,
  onSettleClick
}) => {
  const [activeSubTab, setActiveSubTab] = useState('ALL'); // 'ALL' | 'PAYMENTS' | 'DEBTS' | 'CATEGORIES'
  const currency = group?.currency || 'INR';

  if (!group || !group.members) return null;

  const totalSpending = group.totalSpending || 0;
  const members = group.members || [];

  // Calculate highest payer
  const sortedByPaid = [...members].sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0));
  const topPayer = sortedByPaid[0];

  // Category breakdown
  const categoryBreakdown = analyticsData?.categoryBreakdown || {};
  const activeCategories = Object.entries(categoryBreakdown)
    .filter(([_, amt]) => amt > 0)
    .sort(([_, a], [__, b]) => b - a);

  // SVG Donut Circle Math
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const donutColors = [
    '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6',
    '#06B6D4', '#F97316', '#3B82F6', '#14B8A6', '#64748B'
  ];

  let cumulativeAmt = 0;
  const donutSlices = activeCategories.map(([catName, amt], index) => {
    const percentage = totalSpending > 0 ? amt / totalSpending : 0;
    const dashLen = percentage * circumference;
    const startOffset = totalSpending > 0 ? (cumulativeAmt / totalSpending) * circumference : 0;
    cumulativeAmt += amt;

    return {
      catName,
      amt,
      percentage: (percentage * 100).toFixed(1),
      color: donutColors[index % donutColors.length],
      dashLen,
      startOffset
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card with Analytics Pills */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-6 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 text-slate-900 shadow-sm overflow-hidden border border-slate-200"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-2xl bg-indigo-100 text-indigo-600 border border-indigo-200 font-bold">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="font-space text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Visual Analytics & Debt Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium pl-1">
              Interactive graphic breakdown of payments, spending shares, and pairwise settlement flows.
            </p>
          </div>

          {/* Quick Sub-Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 text-xs font-space font-bold">
            {[
              { id: 'ALL', label: 'Overview', icon: Layers },
              { id: 'PAYMENTS', label: 'Member Payments', icon: Wallet },
              { id: 'DEBTS', label: 'Who Owes Whom', icon: ArrowRightLeft },
              { id: 'CATEGORIES', label: 'Categories', icon: PieChartIcon }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 relative z-10">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[10px] font-space uppercase text-slate-400 tracking-wider font-bold">Total Group Budget</span>
            <p className="font-space text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalSpending, currency)}
            </p>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{expenses.length} total expenses</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[10px] font-space uppercase text-slate-400 tracking-wider font-bold">Top Contributor</span>
            <p className="font-space text-base sm:text-lg font-extrabold text-emerald-600 mt-1 truncate">
              {topPayer ? topPayer.name : 'N/A'}
            </p>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
              Paid {formatCurrency(topPayer?.totalPaid || 0, currency)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[10px] font-space uppercase text-slate-400 tracking-wider font-bold">Pending Settlements</span>
            <p className="font-space text-lg sm:text-xl font-extrabold text-amber-600 mt-1">
              {simplifiedTx.length} transfers
            </p>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Simplified debt count</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[10px] font-space uppercase text-slate-400 tracking-wider font-bold">Active Categories</span>
            <p className="font-space text-lg sm:text-xl font-extrabold text-purple-600 mt-1">
              {activeCategories.length} types
            </p>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Top: {activeCategories[0]?.[0] || 'None'}</span>
          </div>
        </div>
      </motion.div>

      {/* 3D ISOMETRIC COLUMN CHART (Infographic Column Blocks) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'PAYMENTS') && (
        <ThreeDColumnChart
          members={members}
          currency={currency}
          totalSpending={totalSpending}
        />
      )}

      {/* 3D RADIAL GAUGE RINGS (Category Rings) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'CATEGORIES') && (
        <ThreeDGaugeRings
          analyticsData={analyticsData}
          totalSpending={totalSpending}
          currency={currency}
        />
      )}

      {/* 2. CHART SECTION 1: MEMBER SPENDING BREAKDOWN (Repeat Scroll Fill Animated Bars) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'PAYMENTS') && (
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space text-base font-extrabold text-slate-900">
                  Member Spending Breakdown (Kon Kitna Pay Kara)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Out-of-pocket contributions compared to fair share per member.
                </p>
              </div>
            </div>
            <span className="text-xs font-space font-bold px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-100">
              {members.length} Members
            </span>
          </div>

          {/* Animated Bar List */}
          <div className="space-y-4 pt-2">
            {sortedByPaid.map((m, index) => {
              const paid = m.totalPaid || 0;
              const share = m.totalShare || 0;
              const maxPaid = sortedByPaid[0]?.totalPaid || 1;
              const barPercentage = Math.min(100, Math.max(8, (paid / maxPaid) * 100));
              const avatar = m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`;

              return (
                <motion.div
                  key={m._id || index}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 hover:border-violet-300 hover:bg-white transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={avatar} alt={m.name} className="w-9 h-9 rounded-full border border-slate-200 bg-white object-cover shadow-xs" />
                      <div>
                        <h4 className="font-space text-xs sm:text-sm font-extrabold text-slate-900 flex items-center space-x-1.5">
                          <span>{m.name}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center space-x-1">
                              <Award className="w-3 h-3 text-amber-600" />
                              <span>Highest Payer</span>
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Share: {formatCurrency(share, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-space text-sm sm:text-base font-extrabold text-slate-900">
                        {formatCurrency(paid, currency)}
                      </span>
                      <span className="block text-[11px] font-space font-bold text-violet-600">
                        {totalSpending > 0 ? ((paid / totalSpending) * 100).toFixed(1) : 0}% of group total
                      </span>
                    </div>
                  </div>

                  {/* Animated Visual Bar Track (Fill from 0% -> target % EVERY TIME on Scroll) */}
                  <div className="relative w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${barPercentage}%` }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${index === 0
                          ? 'from-amber-500 via-orange-500 to-indigo-600'
                          : 'from-violet-500 to-indigo-600'
                        }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 3. CHART SECTION 2: WHO OWES WHOM HOW MUCH? (Pairwise Settlement Flow) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'DEBTS') && (
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space text-base font-extrabold text-slate-900">
                  Pairwise Settlement Matrix (Kisko Kitna Pay Karna Hai)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Optimized simplified debt transfers between group members.
                </p>
              </div>
            </div>

            <span className="text-xs font-space font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              {simplifiedTx.length} Pending Transfers
            </span>
          </div>

          {simplifiedTx.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-space text-base font-extrabold text-emerald-900">All Expenses Settled Up!</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto font-medium">
                No member owes any money to anyone right now. Perfect financial harmony!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simplifiedTx.map((tx, idx) => {
                const fromUser = tx.fromUser;
                const toUser = tx.toUser;
                const amount = tx.amount;
                const fAvatar = fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fromUser?.name || 'Payer')}`;
                const tAvatar = toUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(toUser?.name || 'Recipient')}`;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="p-5 rounded-3xl bg-slate-50/90 border border-slate-200/90 hover:border-violet-300 hover:bg-white transition-all space-y-4 shadow-xs"
                  >
                    {/* Visual Flow Header */}
                    <div className="flex items-center justify-between">
                      {/* Payer (From) */}
                      <div className="flex items-center space-x-2.5">
                        <img src={fAvatar} alt={fromUser?.name} className="w-10 h-10 rounded-full border-2 border-rose-300 bg-white object-cover" />
                        <div>
                          <p className="font-space text-xs font-extrabold text-slate-900">{fromUser?.name}</p>
                          <span className="text-[10px] font-space font-bold uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Payer (Owes)
                          </span>
                        </div>
                      </div>

                      {/* Directional Arrow Badge */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold shadow-xs">
                          <ArrowRight className="w-4 h-4 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-space text-slate-400 font-bold mt-1">PAY TO</span>
                      </div>

                      {/* Recipient (To) */}
                      <div className="flex items-center space-x-2.5">
                        <div className="text-right">
                          <p className="font-space text-xs font-extrabold text-slate-900">{toUser?.name}</p>
                          <span className="text-[10px] font-space font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Gets Back
                          </span>
                        </div>
                        <img src={tAvatar} alt={toUser?.name} className="w-10 h-10 rounded-full border-2 border-emerald-300 bg-white object-cover" />
                      </div>
                    </div>

                    {/* Amount & Quick Settle CTA */}
                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-space text-slate-400 font-bold uppercase">Debt Amount</span>
                        <p className="font-space text-lg font-extrabold text-violet-700">
                          {formatCurrency(amount, currency)}
                        </p>
                      </div>

                      {onSettleClick && (
                        <button
                          onClick={() => onSettleClick(fromUser, toUser, amount)}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-bold text-xs shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settle Now</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* 4. CHART SECTION 3: CATEGORY & NET POSITIONS GRAPH */}
      {(activeSubTab === 'ALL' || activeSubTab === 'CATEGORIES') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Donut & List Chart (Re-animates SVG Donut every time on scroll) */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm"
          >
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space text-base font-extrabold text-slate-900">Category Spending Graph</h3>
                <p className="text-xs text-slate-500 font-medium">Distribution by category expenditure</p>
              </div>
            </div>

            {activeCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No category breakdown available.</div>
            ) : (
              <div className="space-y-5">
                {/* SVG Animated Donut Graph with Circle Arcs */}
                <div className="flex items-center justify-center py-3 relative">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                      {/* Outer Background Track Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="text-slate-100"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="none"
                      />

                      {/* Animated Colored Donut Slices */}
                      {donutSlices.map((slice, i) => (
                        <motion.circle
                          key={slice.catName || i}
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke={slice.color}
                          strokeWidth="10"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${slice.dashLen} ${circumference}`}
                          strokeDashoffset={-slice.startOffset}
                          initial={{ strokeDasharray: `0 ${circumference}` }}
                          whileInView={{ strokeDasharray: `${slice.dashLen} ${circumference}` }}
                          viewport={{ once: false, amount: 0.15 }}
                          transition={{ duration: 1, delay: i * 0.12, ease: 'easeOut' }}
                          className="hover:stroke-[12] transition-all cursor-pointer"
                        />
                      ))}
                    </svg>

                    {/* Center Total Spending Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                      <span className="text-[10px] font-space font-bold uppercase text-slate-400 tracking-wider">Total Spent</span>
                      <span className="font-space text-base sm:text-lg font-extrabold text-slate-900">
                        {formatCurrency(totalSpending, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Legend List */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {donutSlices.map((slice, i) => (
                    <motion.div
                      key={slice.catName || i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="flex items-center justify-between text-xs font-space p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: slice.color }} />
                        <span className="font-bold text-slate-800">{slice.catName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900">{formatCurrency(slice.amt, currency)}</span>
                        <span className="text-slate-400 ml-1.5">({slice.percentage}%)</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Member Net Position Balance Matrix */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm"
          >
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space text-base font-extrabold text-slate-900">Net Position Matrix</h3>
                <p className="text-xs text-slate-500 font-medium">Receivables (+) vs Liabilities (-)</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {members.map(m => {
                const net = m.netBalance || 0;
                const isPos = net > 0.01;
                const isNeg = net < -0.01;

                return (
                  <div key={m._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-white hover:border-slate-300 transition-all">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="w-8 h-8 rounded-full border border-slate-200 bg-white object-cover"
                      />
                      <div>
                        <p className="font-space text-xs font-bold text-slate-900">{m.name}</p>
                        <span className={`text-[10px] font-space font-semibold px-2 py-0.5 rounded-full ${isPos
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                          }`}>
                          {isPos ? 'Receivable' : isNeg ? 'Liability' : 'Settled'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-space text-sm font-extrabold ${isPos ? 'text-emerald-600' : isNeg ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                        {formatSignedBalance(net, currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
