import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, User, LogOut, ChevronDown, Menu } from 'lucide-react';

export const TopBar = ({ title, onOpenAddExpense, onOpenCreateGroup, onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        <h1 className="font-space text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>{title || 'Dashboard'}</span>
        </h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-3">
        {onOpenAddExpense && (
          <button
            onClick={onOpenAddExpense}
            className="finlance-btn-primary flex items-center space-x-2 px-4 py-2 font-space text-xs"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        )}

        {onOpenCreateGroup && !onOpenAddExpense && (
          <button
            onClick={onOpenCreateGroup}
            className="finlance-btn-primary flex items-center space-x-2 px-4 py-2 font-space text-xs"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create New Group</span>
          </button>
        )}

        {/* Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 p-1.5 rounded-full hover:bg-slate-100/80 transition-colors border border-slate-200/60"
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full bg-slate-100 border border-violet-300 object-cover shadow-sm"
              />
              <span className="hidden md:inline font-space text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-3xl shadow-2xl py-2 border border-slate-100 text-xs animate-slide-up z-50"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-space font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  <User className="w-4 h-4 text-violet-600" />
                  <span>Profile Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
