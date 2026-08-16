import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';
import { ThreeDGaugeRings } from './ThreeDGaugeRings';
import { PieChart, Utensils, Plane, Hotel, Ticket, Music, Tv, ShoppingBag, Fuel, Wine, Compass, HelpCircle } from 'lucide-react';

const CATEGORY_ICONS = {
  Food: Utensils,
  Travel: Plane,
  Hotel: Hotel,
  Tickets: Ticket,
  Music: Music,
  Entertainment: Tv,
  Shopping: ShoppingBag,
  Fuel: Fuel,
  Drinks: Wine,
  Activities: Compass,
  Other: HelpCircle
};

export const CategoryAnalyticsChart = ({ analyticsData, currency = 'INR' }) => {
  if (!analyticsData) return null;

  const {
    totalGroupSpending = 0,
    categoryBreakdown = {}
  } = analyticsData;

  const activeCategories = Object.entries(categoryBreakdown)
    .filter(([_, amt]) => amt > 0)
    .sort(([_, a], [__, b]) => b - a);

  return (
    <div className="space-y-6">
      {/* 3D Gauge Rings Header */}
      <ThreeDGaugeRings
        analyticsData={analyticsData}
        totalSpending={totalGroupSpending}
        currency={currency}
      />

      {/* Category Spending Breakdown Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="saas-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-sm"
      >
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Spending Overview by Category</h3>
            <p className="text-xs text-slate-500">Distribution of group expenditures</p>
          </div>
        </div>

        {activeCategories.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No expenses recorded yet to display analytics.
          </div>
        ) : (
          <div className="space-y-4">
            {activeCategories.map(([catName, amt], index) => {
              const IconComponent = CATEGORY_ICONS[catName] || HelpCircle;
              const pct = totalGroupSpending > 0 ? ((amt / totalGroupSpending) * 100).toFixed(1) : 0;

              return (
                <div key={catName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800">{catName}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900">{formatCurrency(amt, currency)}</span>
                      <span className="text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>

                  {/* Clean Indigo Progress Bar with Repeat Scroll Fill Animation */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
