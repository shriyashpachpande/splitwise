import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, User, Plus } from 'lucide-react';

export const BottomNav = ({ onOpenAddExpense }) => {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/groups') {
      return location.pathname === '/groups' || location.pathname.startsWith('/groups/');
    }
    return location.pathname === path;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 flex justify-around items-center shadow-lg">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isActive('/dashboard') ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Dashboard</span>
      </Link>

      <Link
        to="/groups"
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isActive('/groups') ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Groups</span>
      </Link>

      {/* Center Floating CTA */}
      {onOpenAddExpense && (
        <button
          onClick={onOpenAddExpense}
          className="-mt-5 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-90 transition-all border-4 border-slate-50"
          title="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      )}

      <Link
        to="/activity"
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isActive('/activity') ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Activity className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Activity</span>
      </Link>

      <Link
        to="/profile"
        className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
          isActive('/profile') ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Profile</span>
      </Link>
    </div>
  );
};
