import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  LayoutDashboard,
  Users,
  Activity,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X
} from 'lucide-react';

export const Sidebar = ({ onOpenCreateGroup, mobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const isActive = (path) => {
    if (path === '/groups') {
      return location.pathname === '/groups' || location.pathname.startsWith('/groups/');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white/95 backdrop-blur-md border-r border-slate-200/80 h-screen sticky top-0 z-30 transition-all duration-300 shadow-[4px_0_24px_rgba(15,23,42,0.02)] ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header & Toggle */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-3 group overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_6px_20px_rgba(124,58,237,0.3)] flex-shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5 stroke-[2.5]" />
              </div>
              {!collapsed && (
                <span className="font-space text-lg font-extrabold text-slate-900 tracking-tight">
                  Equally Split
                </span>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Create Group Pill CTA */}
          {onOpenCreateGroup && (
            <div className="p-3">
              <button
                onClick={onOpenCreateGroup}
                className={`w-full py-2.5 px-3 finlance-btn-primary font-space text-xs flex items-center justify-center space-x-2 ${
                  collapsed ? 'px-0' : ''
                }`}
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                {!collapsed && <span>Create New Group</span>}
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-violet-700 font-space font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeFinlanceNavPillDesktop"
                      className="absolute inset-0 bg-violet-50/90 border border-violet-200/80 rounded-2xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 z-10 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
                  {!collapsed && <span className="z-10">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Bar */}
        {user && (
          <div className="p-3 border-t border-slate-100">
            <div
              className={`flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-violet-200 bg-white object-cover flex-shrink-0 shadow-sm"
                />
                {!collapsed && (
                  <div className="flex flex-col truncate">
                    <span className="font-space text-xs font-bold text-slate-800 truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* 2. Mobile Slide-out Drawer Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Slide-in Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-r border-slate-200"
            >
              {/* Header */}
              <div>
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
                  <Link to="/" onClick={onCloseMobile} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Wallet className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="font-space text-lg font-extrabold text-slate-900">
                      Equally Split
                    </span>
                  </Link>

                  <button
                    onClick={onCloseMobile}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Create Group CTA */}
                {onOpenCreateGroup && (
                  <div className="p-4">
                    <button
                      onClick={() => {
                        onCloseMobile();
                        onOpenCreateGroup();
                      }}
                      className="w-full py-3 px-4 finlance-btn-primary font-space text-xs flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>Create New Group</span>
                    </button>
                  </div>
                )}

                {/* Navigation Menu */}
                <nav className="px-3 py-2 space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-violet-50 text-violet-700 font-space font-bold border border-violet-200/80 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile User Profile Footer */}
              {user && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-9 h-9 rounded-full border border-violet-200 bg-white object-cover"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-space text-xs font-bold text-slate-800 truncate">{user.name}</span>
                        <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onCloseMobile();
                        logout();
                        navigate('/login');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
