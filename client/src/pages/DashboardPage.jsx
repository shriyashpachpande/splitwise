import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { GroupCard } from '../components/GroupCard';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { SkeletonGroupCard } from '../components/SkeletonLoader';
import { formatCurrency } from '../utils/currencyFormatter';
import {
  FolderKanban,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Search,
  Sparkles,
  ArrowRight,
  Activity as ActivityIcon
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const groupsRes = await api.get('/groups');
      setGroups(groupsRes.data || []);
      
      // Fetch recent global activity notifications feed
      try {
        const notifRes = await api.get('/notifications').catch(() => null);
        if (notifRes && notifRes.data) {
          setActivities(notifRes.data.slice(0, 5));
        }
      } catch (e) {
        // Silently handle if notifications unavailable
      }
    } catch (err) {
      console.error('Error fetching dashboard groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'Active').length;
  const totalSpent = groups.reduce((sum, g) => sum + (g.totalSpending || 0), 0);

  let totalYouOwe = 0;
  let totalOthersOweYou = 0;

  groups.forEach(g => {
    const bal = g.yourBalance || 0;
    if (bal < 0) {
      totalYouOwe += Math.abs(bal);
    } else if (bal > 0) {
      totalOthersOweYou += bal;
    }
  });

  const netOverallBalance = totalOthersOweYou - totalYouOwe;

  const filteredGroups = groups.filter(g => {
    const matchesTab = activeTab === 'All' || g.status === activeTab;
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell
      title="Dashboard"
      onOpenCreateGroup={() => setIsCreateModalOpen(true)}
    >
      <div className="space-y-8">
        
        {/* Top Header Greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-space text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Here's what's happening with your trip balances today.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="finlance-btn-primary flex items-center space-x-2 px-5 py-2.5 font-space text-xs"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Group</span>
          </button>
        </div>

        {/* Hero Net Position Balance Card */}
        <div className="finlance-hero-card p-8 text-white relative overflow-hidden">
          <div className="absolute right-[-40px] top-[-40px] w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-300/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute left-[-20px] bottom-[-20px] w-72 h-72 bg-gradient-to-tr from-pink-500/15 to-violet-400/10 blur-[90px] rounded-full pointer-events-none" />

          <svg className="absolute right-6 bottom-4 w-64 lg:w-96 h-32 opacity-25 pointer-events-none" viewBox="0 0 400 150" fill="none">
            <path d="M0,120 Q50,90 100,105 T200,60 T300,80 T400,20" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="400" cy="20" r="6" fill="white" />
          </svg>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="finlance-badge-glass px-4 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>Total Balance • All Trip Accounts</span>
              </span>

              <span className="finlance-badge-glass px-3.5 py-1 text-xs font-medium">
                {activeGroups} Active Trips
              </span>
            </div>

            <div>
              <p className="font-space text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {netOverallBalance >= 0 ? `+${formatCurrency(netOverallBalance)}` : formatCurrency(netOverallBalance)}
              </p>
              
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="finlance-badge-glass px-3.5 py-1.5 text-xs font-medium flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {netOverallBalance >= 0
                      ? `+${formatCurrency(netOverallBalance)} overall owed across all groups`
                      : `${formatCurrency(Math.abs(netOverallBalance))} overall owe across all groups`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="finlance-card p-5 rounded-3xl space-y-3 bg-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-500">Total Groups</span>
              <div className="w-9 h-9 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                <FolderKanban className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="font-space text-2xl lg:text-3xl font-extrabold text-slate-900">{totalGroups}</p>
            <p className="text-xs text-slate-400 font-medium">{activeGroups} active now</p>
          </div>

          <div className="finlance-card p-5 rounded-3xl space-y-3 bg-white">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-500">Total Spending</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="font-space text-2xl lg:text-3xl font-extrabold text-slate-900">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-slate-400 font-medium">Across all trips</p>
          </div>

          <div className="finlance-card p-5 rounded-3xl space-y-3 bg-white">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-500">You Owe</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                <ArrowDownLeft className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="font-space text-2xl lg:text-3xl font-extrabold text-rose-600">
              {formatCurrency(totalYouOwe)}
            </p>
            <p className="text-xs text-rose-500/80 font-medium">Pending settlements</p>
          </div>

          <div className="finlance-card p-5 rounded-3xl space-y-3 bg-white">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-500">You Get Back</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <ArrowUpRight className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="font-space text-2xl lg:text-3xl font-extrabold text-emerald-600">
              {formatCurrency(totalOthersOweYou)}
            </p>
            <p className="text-xs text-emerald-600/80 font-medium">To be collected</p>
          </div>
        </div>

        {/* Main 2-Column Section: Groups (2/3) + Recent Activity Widget (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3): Groups List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-1 bg-slate-200/60 p-1.5 rounded-full w-full sm:w-auto">
                {['All', 'Active', 'Upcoming', 'Completed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full font-space text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search trip group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200/80 pl-10 pr-4 py-2 rounded-full text-xs font-medium focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
            </div>

            {/* Groups Grid / Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SkeletonGroupCard />
                <SkeletonGroupCard />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="finlance-card p-12 rounded-3xl text-center space-y-4 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100 shadow-sm">
                  <FolderKanban className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-space text-base font-bold text-slate-900">No Trip Groups Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create a trip group to start recording expenses, tracking splits, and settling balances.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="finlance-btn-primary px-5 py-2.5 font-space text-xs inline-flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Group</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredGroups.map(group => (
                  <GroupCard key={group._id} group={group} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column (1/3): Live Recent Activity Widget */}
          <div className="space-y-6">
            <div className="finlance-card p-6 rounded-3xl bg-white space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-space text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ActivityIcon className="w-4 h-4 text-violet-600" />
                  <span>Recent Activity</span>
                </h3>
                <Link to="/activity" className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center space-x-1">
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-medium">No recent transactions recorded.</p>
                ) : (
                  activities.map((act, idx) => (
                    <div
                      key={act._id || idx}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-space font-extrabold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {act.groupName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(act.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="font-space text-xs font-semibold text-slate-900 line-clamp-2">
                        {act.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={() => fetchDashboardData()}
      />
    </AppShell>
  );
};
