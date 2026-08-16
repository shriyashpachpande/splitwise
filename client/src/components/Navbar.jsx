import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  LayoutDashboard,
  Users,
  Activity,
  User,
  LogOut,
  PlusCircle,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ onOpenCreateGroup }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-violet-800 to-indigo-600">
              Equally Split
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/groups"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/groups')
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Groups</span>
          </Link>

          <Link
            to="/activity"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/activity')
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </Link>
        </div>

        {/* Actions & Profile Dropdown */}
        <div className="flex items-center space-x-3">
          {onOpenCreateGroup && (
            <button
              onClick={onOpenCreateGroup}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Group</span>
            </button>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-emerald-500/40 object-cover"
                />
                <span className="hidden lg:inline text-sm font-medium text-slate-200 max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 glass-card rounded-2xl shadow-2xl py-2 border border-slate-800 text-sm animate-fade-in z-50"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800/80">
                    <p className="font-semibold text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Profile Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
