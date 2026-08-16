import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';
import { Award, TrendingUp, Sparkles } from 'lucide-react';

/**
 * 3D Isometric / Gradient Column Infographic Bar Chart
 * Styled inspired by modern 3D infographic illustrations
 * Re-animates fill (0% -> target%) EVERY TIME user scrolls into view (once: false)
 */
export const ThreeDColumnChart = ({ members = [], currency = 'INR', totalSpending = 0 }) => {
  if (!members || members.length === 0) return null;

  // Sort members by totalPaid descending (top 6)
  const sortedMembers = [...members].sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0)).slice(0, 6);
  const maxPaid = Math.max(...sortedMembers.map(m => m.totalPaid || 0), 1);

  // Vibrant 3D Bar Color Palettes (Front, Top Cap, Side Shadow)
  const barPalettes = [
    {
      name: 'Purple',
      front: 'bg-gradient-to-t from-purple-700 via-purple-600 to-purple-500',
      top: 'bg-purple-400',
      side: 'bg-purple-900/60',
      glow: 'shadow-purple-500/30 shadow-lg',
      border: 'border-purple-300/40',
      badge: 'bg-purple-100 text-purple-700'
    },
    {
      name: 'Blue',
      front: 'bg-gradient-to-t from-blue-700 via-blue-600 to-blue-500',
      top: 'bg-blue-400',
      side: 'bg-blue-900/60',
      glow: 'shadow-blue-500/30 shadow-lg',
      border: 'border-blue-300/40',
      badge: 'bg-blue-100 text-blue-700'
    },
    {
      name: 'Orange',
      front: 'bg-gradient-to-t from-orange-600 via-amber-500 to-amber-400',
      top: 'bg-amber-300',
      side: 'bg-amber-900/60',
      glow: 'shadow-amber-500/30 shadow-lg',
      border: 'border-amber-300/40',
      badge: 'bg-amber-100 text-amber-800'
    },
    {
      name: 'Pink',
      front: 'bg-gradient-to-t from-pink-600 via-pink-500 to-rose-400',
      top: 'bg-pink-300',
      side: 'bg-rose-900/60',
      glow: 'shadow-pink-500/30 shadow-lg',
      border: 'border-pink-300/40',
      badge: 'bg-pink-100 text-pink-700'
    },
    {
      name: 'Emerald',
      front: 'bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-400',
      top: 'bg-teal-300',
      side: 'bg-emerald-900/60',
      glow: 'shadow-emerald-500/30 shadow-lg',
      border: 'border-emerald-300/40',
      badge: 'bg-emerald-100 text-emerald-700'
    },
    {
      name: 'Red',
      front: 'bg-gradient-to-t from-red-600 via-red-500 to-rose-400',
      top: 'bg-red-300',
      side: 'bg-red-900/60',
      glow: 'shadow-red-500/30 shadow-lg',
      border: 'border-red-300/40',
      badge: 'bg-red-100 text-red-700'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.6 }}
      className="finlance-card p-5 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-md space-y-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-space text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              3D Infographic Member Spending Chart
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              3D visual column breakdown of out-of-pocket payments made by trip members.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-space font-extrabold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Max Paid: {formatCurrency(maxPaid, currency)}</span>
        </div>
      </div>

      {/* Grid Floor Overlay & 3D Isometric Columns Canvas */}
      <div className="relative pt-8 pb-4 px-2 sm:px-6 rounded-3xl bg-gradient-to-b from-indigo-50/70 via-slate-50 to-purple-50/50 text-slate-900 border border-slate-200 shadow-inner overflow-hidden">
        {/* Subtle 3D Light Grid Backdrop Background */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* 3D Columns Flex Container */}
        <div className="relative z-10 flex items-end justify-around gap-2 sm:gap-6 min-h-[280px] sm:min-h-[320px] pt-12 pb-4">
          {sortedMembers.map((m, idx) => {
            const paid = m.totalPaid || 0;
            const heightPct = Math.max(12, Math.min(100, (paid / maxPaid) * 100));
            const palette = barPalettes[idx % barPalettes.length];
            const isHighest = idx === 0 && paid > 0;

            return (
              <div key={m._id || idx} className="flex-1 flex flex-col items-center group relative max-w-[85px] sm:max-w-[100px]">
                
                {/* Floating Value Pill Above 3D Column */}
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: 0.15 * idx + 0.3 }}
                  className="mb-3 text-center transition-transform group-hover:-translate-y-1 z-20"
                >
                  <span className="font-space text-[10px] sm:text-xs font-extrabold px-2 sm:px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/90 shadow-md block whitespace-nowrap">
                    {formatCurrency(paid, currency)}
                  </span>
                  {isHighest && (
                    <span className="text-[9px] font-space font-extrabold text-amber-700 flex items-center justify-center space-x-1 mt-0.5">
                      <Award className="w-3 h-3 text-amber-600" />
                      <span>TOP</span>
                    </span>
                  )}
                </motion.div>

                {/* 3D Column Bar - Re-animates fill every time on scroll */}
                <div className="w-full relative flex flex-col justify-end" style={{ height: `${heightPct * 2.2}px` }}>
                  
                  {/* Top 3D Cap */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.4, delay: 0.12 * idx }}
                    className={`w-full h-3.5 rounded-t-lg ${palette.top} shadow-sm border-t border-white/60`}
                  />

                  {/* Main Front Face - Fills from Height 0% to Target % EVERY TIME user scrolls into view */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileInView={{ height: '100%', opacity: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.8, delay: 0.12 * idx, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full ${palette.front} ${palette.glow} rounded-b-lg border-x border-b border-white/30 relative overflow-hidden group-hover:brightness-105 transition-all`}
                  >
                    {/* Inner Glass Highlight Streak */}
                    <div className="absolute inset-y-0 left-0 w-2 bg-white/35 backdrop-blur-xs" />
                  </motion.div>
                </div>

                {/* Member Avatar & Name Label Base */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: 0.15 * idx + 0.2 }}
                  className="mt-4 text-center space-y-1 z-10"
                >
                  <div className="relative inline-block">
                    <img
                      src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                      alt={m.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white bg-white object-cover mx-auto shadow-md"
                    />
                  </div>

                  <p className="font-space text-xs font-bold text-slate-800 truncate max-w-[65px] sm:max-w-[85px]" title={m.name}>
                    {m.name}
                  </p>
                  <span className="text-[10px] font-space text-slate-500 block font-bold">
                    {totalSpending > 0 ? ((paid / totalSpending) * 100).toFixed(0) : 0}%
                  </span>
                </motion.div>

              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
