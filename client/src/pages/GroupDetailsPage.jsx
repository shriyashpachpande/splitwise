import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SettleUpModal } from '../components/SettleUpModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { SimplifiedBalancesView } from '../components/SimplifiedBalancesView';
import { CategoryAnalyticsChart } from '../components/CategoryAnalyticsChart';
import { ExpenseDetailsDrawer } from '../components/ExpenseDetailsDrawer';
import { SettlementBreakdownDrawer } from '../components/SettlementBreakdownDrawer';
import { MemberStatementDrawer } from '../components/MemberStatementDrawer';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { formatCurrency, formatSignedBalance } from '../utils/currencyFormatter';
import {
  ArrowLeft,
  Calendar,
  Users,
  PlusCircle,
  ArrowRightLeft,
  PieChart as PieChartIcon,
  Receipt,
  Scale,
  History,
  Activity as ActivityIcon,
  Search,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet,
  TrendingDown,
  Clock,
  Zap,
  Trash2
} from 'lucide-react';

export const GroupDetailsPage = () => {
  const { id: groupId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balancesData, setBalancesData] = useState(null);
  const [simplifiedTx, setSimplifiedTx] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activities, setActivities] = useState([]);

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  // Filters for expenses tab
  const [expenseSearch, setExpenseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals & Drawers state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [selectedExpenseForDrawer, setSelectedExpenseForDrawer] = useState(null);
  const [selectedSettlementForBreakdown, setSelectedSettlementForBreakdown] = useState(null);
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [settlePayer, setSettlePayer] = useState(null);
  const [settleRecipient, setSettleRecipient] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');

  const handleDeleteGroupConfirm = async () => {
    try {
      setDeletingGroup(true);
      await api.delete(`/groups/${groupId}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeletingGroup(false);
      setIsDeleteModalOpen(false);
    }
  };

  const fetchAllGroupData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [groupRes, expRes, setRes, balRes, simpRes, anaRes, actRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/expenses`),
        api.get(`/groups/${groupId}/settlements`),
        api.get(`/groups/${groupId}/balances`),
        api.get(`/groups/${groupId}/simplified-balances`),
        api.get(`/groups/${groupId}/analytics`),
        api.get(`/groups/${groupId}/activity`)
      ]);

      setGroup(groupRes.data);
      setExpenses(expRes.data);
      setSettlements(setRes.data);
      setBalancesData(balRes.data);
      setSimplifiedTx(simpRes.data.simplifiedTransactions || []);
      setAnalyticsData(anaRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error('Error loading group data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGroupData(true);
  }, [groupId]);

  const handleOpenSettleModal = (fromUser = null, toUser = null, amount = '') => {
    setSettlePayer(fromUser);
    setSettleRecipient(toUser);
    setSettleAmount(amount);
    setIsSettleModalOpen(true);
  };

  const handleAddMemberInline = async (e) => {
    e.preventDefault();
    setMemberError('');
    if (!addMemberEmail.trim()) return;

    try {
      await api.post(`/groups/${groupId}/members`, { name: addMemberEmail.trim() });
      setAddMemberEmail('');
      fetchAllGroupData();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Error adding member');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      setSelectedExpenseForDrawer(null);
      fetchAllGroupData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting expense');
    }
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-space">
        <div className="text-violet-600 font-bold text-sm flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-full bg-violet-600 animate-ping" />
          <span>Loading Trip Engine...</span>
        </div>
      </div>
    );
  }

  const userIdStr = currentUser?._id?.toString();
  const userBalanceRecord = group.members.find(m => m._id.toString() === userIdStr);
  const yourBalance = userBalanceRecord ? userBalanceRecord.netBalance : 0;
  const youOwe = yourBalance < 0 ? Math.abs(yourBalance) : 0;
  const youGetBack = yourBalance > 0 ? yourBalance : 0;

  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    const matchesSearch = exp.description.toLowerCase().includes(expenseSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navTabs = [
    { id: 'Overview', label: 'Overview', icon: PieChartIcon },
    { id: 'Expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
    { id: 'Balances', label: 'Balances', icon: Scale },
    { id: 'Members', label: `Members (${group.members.length})`, icon: Users },
    { id: 'Settlements', label: `Settlements (${settlements.length})`, icon: History },
    { id: 'Activity', label: 'Activity', icon: ActivityIcon }
  ];

  return (
    <AppShell
      title={group.name}
      onOpenAddExpense={() => setIsAddExpenseOpen(true)}
    >
      <div className="space-y-6">
        
        {/* 1. Ultra Premium FinTech Glass Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(99,102,241,0.06)] overflow-hidden">
          
          {/* Subtle Ambient Soft Aura Glows using user specified color stops */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute -top-16 -right-16 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%)' }}
          />

          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -25, 0],
              y: [0, 25, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(239, 68, 68, 0.2) 100%)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/groups"
                  className="p-2.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/80"
                  title="Back to groups"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25 border border-white text-white">
                  🏔
                </div>
                
                <h1 className="font-space text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {group.name}
                </h1>

                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-space font-extrabold uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{group.status}</span>
                </span>
              </div>

              {group.description && (
                <p className="text-xs sm:text-sm text-slate-600 pl-1 sm:pl-16 font-medium leading-relaxed">
                  {group.description}
                </p>
              )}

              {/* Group Metadata & Member Avatars */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pl-1 sm:pl-16 pt-1">
                <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 font-space font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  <span>
                    {new Date(group.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} → {new Date(group.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </span>

                {/* Member Avatars Stack */}
                <div className="flex items-center space-x-2 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200/80">
                  <div className="flex -space-x-2 overflow-hidden">
                    {group.members.slice(0, 4).map(m => (
                      <img
                        key={m._id}
                        src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                        alt={m.name}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                        title={m.name}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-space font-bold text-slate-700">
                    {group.members.length} members
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Header CTAs Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-2 lg:pt-0">
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="flex-1 lg:flex-none px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-space font-bold text-xs border border-slate-200/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-violet-600" />
                <span>+ Add Member</span>
              </button>

              <button
                onClick={() => handleOpenSettleModal()}
                className="flex-1 lg:flex-none px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-space font-bold text-xs border border-slate-200/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4 text-violet-600" />
                <span>Settle Up</span>
              </button>

              {((group.createdBy?._id || group.createdBy)?.toString() === (currentUser?._id || currentUser?.id)?.toString()) && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex-1 lg:flex-none px-4 py-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-space font-bold text-xs border border-rose-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm"
                  title="Delete Group (Creator Only)"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Group</span>
                </button>
              )}

              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="w-full sm:flex-1 lg:flex-none px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-space font-extrabold text-xs shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Responsive Pill Navigation Strip */}
        <div className="relative bg-slate-200/70 p-1.5 rounded-2xl overflow-x-auto no-scrollbar shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center space-x-1 min-w-max">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-space text-xs font-bold transition-all ${
                    isSelected
                      ? 'text-violet-700 font-extrabold z-10'
                      : 'text-slate-600 hover:text-slate-900 z-10'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeGroupTabPill"
                      className="absolute inset-0 bg-white border border-slate-200/80 rounded-xl shadow-sm z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 z-10 ${isSelected ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span className="z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* 5 Ultra Premium Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Spending */}
              <div className="finlance-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-200/50 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-400">Total Spending</span>
                  <div className="w-9 h-9 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="font-space text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(group.totalSpending, group.currency)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Group Total</span>
                  <span className="font-space font-bold text-violet-600">{expenses.length} expenses</span>
                </div>
              </div>

              {/* Your Paid */}
              <div className="finlance-card p-5 rounded-3xl bg-white border border-emerald-200/60 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-200/50 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-emerald-700">Your Paid</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="font-space text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {formatCurrency(analyticsData?.currentUserPaid || 0, group.currency)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-emerald-700/80 font-medium">
                  <span>Out of pocket</span>
                  <span className="font-space font-bold">Paid by you</span>
                </div>
              </div>

              {/* Your Share */}
              <div className="finlance-card p-5 rounded-3xl bg-white border border-amber-200/60 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-200/50 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-amber-700">Your Share</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="font-space text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                  {formatCurrency(analyticsData?.currentUserShare || 0, group.currency)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-amber-100/60 flex items-center justify-between text-[11px] text-amber-700/80 font-medium">
                  <span>Your consumption</span>
                  <span className="font-space font-bold">Fair share</span>
                </div>
              </div>

              {/* You Owe */}
              <div className="finlance-card p-5 rounded-3xl bg-rose-50/40 border border-rose-200 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/40 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-rose-700">You Owe</span>
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                    <TrendingDown className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="font-space text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                  {formatCurrency(youOwe, group.currency)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-700 font-medium">
                  <span>Net liability</span>
                  <span className="font-space font-bold">Pay friends</span>
                </div>
              </div>

              {/* You Get Back */}
              <div className="finlance-card p-5 rounded-3xl bg-emerald-50/40 border border-emerald-200 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-space font-bold uppercase tracking-wider text-emerald-700">You Get Back</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="font-space text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {formatCurrency(youGetBack, group.currency)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                  <span>Net receivable</span>
                  <span className="font-space font-bold">Collect back</span>
                </div>
              </div>
            </div>

            {/* Category Chart */}
            <CategoryAnalyticsChart analyticsData={analyticsData} currency={group.currency} />

            {/* Simplified Settlements */}
            <div className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white">
              <SimplifiedBalancesView
                simplifiedTransactions={simplifiedTx}
                currency={group.currency}
                onSettleClick={(from, to, amt) => handleOpenSettleModal(from, to, amt)}
                onTileClick={(from, to, amt) => setSelectedSettlementForBreakdown({ fromUser: from, toUser: to, amount: amt })}
              />
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES LIST */}
        {activeTab === 'Expenses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 finlance-card p-4 rounded-3xl border border-slate-200 bg-white">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search expense description..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
                {['All', 'Food', 'Travel', 'Hotel', 'Activities', 'Shopping'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-space text-xs font-bold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="finlance-card p-12 rounded-3xl border border-slate-200 bg-white text-center space-y-3">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-space text-lg font-bold text-slate-900">No Expenses Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start adding shared trip expenses, hotel bills, or dinner receipts to calculate splits.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="finlance-btn-primary px-6 py-3 font-space text-xs inline-flex items-center space-x-2 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Add First Expense</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map(expense => {
                  const firstPayer = expense.payers[0]?.userId?.name || 'Someone';

                  const userParticipant = expense.participants.find(
                    p => p.userId?._id?.toString() === userIdStr || p.userId?.toString() === userIdStr
                  );
                  const userShareAmt = userParticipant ? userParticipant.shareAmount : 0;

                  return (
                    <div
                      key={expense._id}
                      onClick={() => setSelectedExpenseForDrawer(expense)}
                      className="finlance-card p-4.5 rounded-3xl border border-slate-200/80 bg-white cursor-pointer flex items-center justify-between gap-4 hover:border-violet-300 transition-all"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                          🍛
                        </div>
                        <div>
                          <h4 className="font-space text-sm sm:text-base font-bold text-slate-900">{expense.description}</h4>
                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700">{expense.category}</span>
                            <span>•</span>
                            <span>Paid by <span className="font-semibold text-slate-800">{firstPayer}</span></span>
                            <span>•</span>
                            <span>{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center space-x-4">
                        <div>
                          <p className="font-space text-base sm:text-lg font-extrabold text-slate-900">
                            {formatCurrency(expense.amount, group.currency)}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Your share: <span className="font-space font-bold text-violet-700">{formatCurrency(userShareAmt, group.currency)}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BALANCES */}
        {activeTab === 'Balances' && (
          <div className="space-y-6">
            <div className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <h3 className="font-space text-base font-extrabold text-slate-900 tracking-tight">
                Member Net Positions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {group.members.map(m => {
                  const isPos = m.netBalance > 0.01;
                  const isNeg = m.netBalance < -0.01;

                  return (
                    <div
                      key={m._id}
                      onClick={() => setSelectedMemberForStatement(m)}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-violet-300 hover:bg-white hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                          alt={m.name}
                          className="w-10 h-10 rounded-full bg-white border border-slate-200 object-cover shadow-sm"
                        />
                        <div>
                          <p className="font-space font-bold text-xs text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Paid: {formatCurrency(m.totalPaid, group.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-space text-xs font-extrabold ${
                            isPos
                              ? 'text-emerald-600'
                              : isNeg
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatSignedBalance(m.netBalance, group.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white">
              <SimplifiedBalancesView
                simplifiedTransactions={simplifiedTx}
                currency={group.currency}
                onSettleClick={(from, to, amt) => handleOpenSettleModal(from, to, amt)}
              />
            </div>
          </div>
        )}

        {/* TAB 4: MEMBERS */}
        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-space text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-violet-600" />
                  <span>Group Members & Invitations</span>
                </h3>

                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-space font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Invite via Link & 6-Digit OTP</span>
                </button>
              </div>

              {memberError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-2xl border border-rose-200 font-medium">
                  {memberError}
                </p>
              )}

              <form onSubmit={handleAddMemberInline} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 max-w-lg">
                <input
                  type="text"
                  placeholder="Enter friend's name (e.g. Rahul, Aman)..."
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500"
                  required
                />
                <button
                  type="submit"
                  className="finlance-btn-primary px-6 py-2.5 font-space text-xs"
                >
                  Add Member
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map(m => (
                <div
                  key={m._id}
                  onClick={() => setSelectedMemberForStatement(m)}
                  className="finlance-card p-4.5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:border-violet-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                      alt={m.name}
                      className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 object-cover shadow-sm"
                    />
                    <div>
                      <h4 className="font-space font-bold text-xs text-slate-900">{m.name}</h4>
                      <p className="text-[11px] text-slate-500">{m.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-space uppercase font-semibold text-slate-400">Balance</span>
                    <p
                      className={`font-space text-xs font-extrabold ${
                        m.netBalance > 0.01
                          ? 'text-emerald-600'
                          : m.netBalance < -0.01
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatSignedBalance(m.netBalance, group.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTLEMENTS */}
        {activeTab === 'Settlements' && (
          <div className="space-y-4">
            {settlements.length === 0 ? (
              <div className="finlance-card p-10 rounded-3xl border border-slate-200 bg-white text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-space text-base font-bold text-slate-900">No Settlements Recorded Yet</h3>
                <p className="text-xs text-slate-500">When members settle up, payment history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map(set => {
                  const fromName = set.fromUser?.name || 'User';
                  const toName = set.toUser?.name || 'User';

                  return (
                    <div
                      key={set._id}
                      className="finlance-card p-4.5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-space text-xs sm:text-sm font-bold text-slate-900">
                            {fromName} paid {toName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(set.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {set.note && ` • "${set.note}"`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-space text-base font-extrabold text-emerald-600">
                          {formatCurrency(set.amount, group.currency)}
                        </span>
                        <p className="font-space text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                          ✓ Settled
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ACTIVITY TIMELINE */}
        {activeTab === 'Activity' && (
          <div className="finlance-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
            <h3 className="font-space text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <ActivityIcon className="w-5 h-5 text-violet-600" />
              <span>Group Activity Feed</span>
            </h3>

            <div className="relative border-l-2 border-slate-200/80 ml-3 pl-5 space-y-6">
              {activities.map(act => (
                <div key={act._id} className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-violet-600 border-2 border-white ring-2 ring-violet-100" />
                  <p className="text-xs font-semibold text-slate-800">{act.description}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(act.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupId={groupId}
        onMemberAdded={() => fetchAllGroupData()}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        groupId={groupId}
        members={group.members}
        editingExpense={editingExpense}
        onExpenseAdded={() => fetchAllGroupData(false)}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        groupId={groupId}
        members={group.members}
        initialFromUser={settlePayer}
        initialToUser={settleRecipient}
        initialAmount={settleAmount}
        onSettlementCreated={() => fetchAllGroupData(false)}
      />

      <ExpenseDetailsDrawer
        expense={selectedExpenseForDrawer}
        isOpen={!!selectedExpenseForDrawer}
        onClose={() => setSelectedExpenseForDrawer(null)}
        currency={group.currency}
        onDeleteExpense={(expId) => handleDeleteExpense(expId)}
        onEditExpense={(expToEdit) => {
          setSelectedExpenseForDrawer(null);
          setEditingExpense(expToEdit);
          setIsAddExpenseOpen(true);
        }}
      />

      <SettlementBreakdownDrawer
        isOpen={!!selectedSettlementForBreakdown}
        onClose={() => setSelectedSettlementForBreakdown(null)}
        fromUser={selectedSettlementForBreakdown?.fromUser}
        toUser={selectedSettlementForBreakdown?.toUser}
        netSettlementAmount={selectedSettlementForBreakdown?.amount || 0}
        expenses={expenses}
        settlements={settlements}
        currency={group.currency}
        onSettleNow={(from, to, amt) => handleOpenSettleModal(from, to, amt)}
      />

      <MemberStatementDrawer
        isOpen={!!selectedMemberForStatement}
        onClose={() => setSelectedMemberForStatement(null)}
        member={selectedMemberForStatement}
        allMembers={group.members}
        expenses={expenses}
        settlements={settlements}
        simplifiedTx={simplifiedTx}
        currency={group.currency}
        onSettleClick={(from, to, amt) => handleOpenSettleModal(from, to, amt)}
      />

      <InviteMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        group={group}
        onMemberAdded={() => fetchAllGroupData()}
      />

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setIsDeleteModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 z-10 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-space text-lg font-extrabold text-slate-900">Delete Group?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Are you sure you want to permanently delete <strong className="text-slate-900">{group.name}</strong>? All expenses, settlements, and history will be permanently deleted.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-space font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroupConfirm}
                  disabled={deletingGroup}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-space font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {deletingGroup ? 'Deleting...' : 'Yes, Delete Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};
