import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';
import { PieChart, Zap, Target, Activity } from 'lucide-react';

/**
 * 3D Radial Gauge Ring Charts (inspired by modern 3D illustration infographics)
 */
export const ThreeDGaugeRings = ({ analyticsData, totalSpending = 0, currency = 'INR' }) => {
  const categoryBreakdown = analyticsData?.categoryBreakdown || {};
  const activeCategories = Object.entries(categoryBreakdown)
    .filter(([_, amt]) => amt > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 4);

  if (activeCategories.length === 0) return null;

  const ringStyles = [
    {
      stroke: '#8B5CF6', // Purple
      glow: 'drop-shadow(0px 8px 12px rgba(139, 92, 246, 0.4))',
      bgGradient: 'from-purple-500/10 to-indigo-500/10',
      badge: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      stroke: '#06B6D4', // Cyan
      glow: 'drop-shadow(0px 8px 12px rgba(6, 182, 212, 0.4))',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      badge: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    },
    {
      stroke: '#F59E0B', // Amber/Orange
      glow: 'drop-shadow(0px 8px 12px rgba(245, 158, 11, 0.4))',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
      badge: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      stroke: '#EC4899', // Pink/Rose
      glow: 'drop-shadow(0px 8px 12px rgba(236, 72, 153, 0.4))',
      bgGradient: 'from-pink-500/10 to-rose-500/10',
      badge: 'bg-pink-100 text-pink-700 border-pink-200'
    }
  ];

  return (
    <div className="finlance-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-md space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-space text-lg font-extrabold text-slate-900">
            3D Radial Category Gauge Rings
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            3D circular ring metrics showing top spending allocation per category.
          </p>
        </div>
      </div>

      {/* 4 3D Ring Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {activeCategories.map(([catName, amt], idx) => {
          const style = ringStyles[idx % ringStyles.length];
          const pct = totalSpending > 0 ? ((amt / totalSpending) * 100).toFixed(0) : 0;
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <motion.div
              key={catName}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-b ${style.bgGradient} border border-slate-200/90 text-center space-y-3 relative group hover:shadow-lg transition-all`}
            >
              {/* 3D Ring SVG */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer Shadow Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="text-slate-200/80"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="none"
                  />

                  {/* 3D Main Animated Stroke Ring */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={style.stroke}
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                    style={{ filter: style.glow }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, delay: idx * 0.15, ease: 'easeOut' }}
                    strokeDasharray={circumference}
                  />
                </svg>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-space text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {pct}%
                  </span>
                  <span className="text-[9px] font-space text-slate-500 font-bold uppercase">Share</span>
                </div>
              </div>

              {/* Category Badge & Amount */}
              <div className="space-y-1">
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-space font-extrabold border ${style.badge}`}>
                  {catName}
                </span>
                <p className="font-space text-sm font-extrabold text-slate-900 mt-1">
                  {formatCurrency(amt, currency)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
