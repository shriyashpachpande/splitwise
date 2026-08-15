import React from 'react';
import { formatCurrency } from '../utils/currencyFormatter';
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

const CATEGORY_COLORS = {
  Food: 'from-amber-500 to-orange-500',
  Travel: 'from-blue-500 to-cyan-500',
  Hotel: 'from-indigo-500 to-purple-500',
  Tickets: 'from-emerald-500 to-teal-500',
  Music: 'from-pink-500 to-rose-500',
  Entertainment: 'from-violet-500 to-purple-500',
  Shopping: 'from-fuchsia-500 to-pink-500',
  Fuel: 'from-yellow-500 to-amber-500',
  Drinks: 'from-rose-500 to-red-500',
  Activities: 'from-teal-500 to-emerald-500',
  Other: 'from-slate-400 to-slate-500'
};

export const CategoryAnalyticsChart = ({ analyticsData, currency = 'INR' }) => {
  if (!analyticsData) return null;

  const {
    totalGroupSpending = 0,
    currentUserPaid = 0,
    currentUserShare = 0,
    categoryBreakdown = {}
  } = analyticsData;

  const activeCategories = Object.entries(categoryBreakdown)
    .filter(([_, amt]) => amt > 0)
    .sort(([_, a], [__, b]) => b - a);

  return (
    <div className="space-y-6">
      {/* Category Spending Breakdown Card */}
      <div className="saas-card p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
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
            {activeCategories.map(([catName, amt]) => {
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

                  {/* Clean Indigo Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
