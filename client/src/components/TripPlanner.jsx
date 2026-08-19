import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  Lock,
  Utensils,
  Compass,
  Car,
  Hotel,
  ShoppingBag,
  ThumbsUp,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Info,
  Layers,
  User,
  ExternalLink,
  Users,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

const CATEGORY_MAP = {
  FOOD: { label: 'Food & Dining', icon: Utensils, bg: 'bg-amber-50 text-amber-700 border-amber-200/60', badge: 'bg-amber-500' },
  ACTIVITY: { label: 'Activity & Fun', icon: Compass, bg: 'bg-violet-50 text-violet-700 border-violet-200/60', badge: 'bg-violet-600' },
  TRAVEL: { label: 'Travel & Transit', icon: Car, bg: 'bg-sky-50 text-sky-700 border-sky-200/60', badge: 'bg-sky-500' },
  STAY: { label: 'Stay & Hotel', icon: Hotel, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', badge: 'bg-indigo-600' },
  SHOPPING: { label: 'Shopping', icon: ShoppingBag, bg: 'bg-pink-50 text-pink-700 border-pink-200/60', badge: 'bg-pink-500' },
  OTHER: { label: 'General', icon: Info, bg: 'bg-slate-50 text-slate-700 border-slate-200/60', badge: 'bg-slate-600' }
};

export default function TripPlanner({ groupId, currentUser }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

  // Form State with Start & End Date
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    category: 'ACTIVITY',
    estimatedCost: ''
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups/${groupId}/itineraries`);
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load trip itineraries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchPlans();
    }
  }, [groupId]);

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(plans.map((p) => p.startDate || p.date))).filter(Boolean).sort();
    return dates;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const pDate = plan.startDate || plan.date;
      const matchDay = selectedDay === 'ALL' || pDate === selectedDay;
      const matchCat = selectedCategory === 'ALL' || plan.category === selectedCategory;
      return matchDay && matchCat;
    });
  }, [plans, selectedDay, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      location: '',
      startDate: uniqueDates[0] || today,
      endDate: uniqueDates[0] || today,
      startTime: '10:00',
      endTime: '12:00',
      category: 'ACTIVITY',
      estimatedCost: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan, e) => {
    if (e) e.stopPropagation();
    setEditingPlan(plan);
    const sDate = plan.startDate || plan.date || new Date().toISOString().split('T')[0];
    const eDate = plan.endDate || sDate;
    setFormData({
      title: plan.title || '',
      description: plan.description || '',
      location: plan.location || '',
      startDate: sDate,
      endDate: eDate,
      startTime: plan.startTime || '10:00',
      endTime: plan.endTime || '12:00',
      category: plan.category || 'ACTIVITY',
      estimatedCost: plan.estimatedCost ? String(plan.estimatedCost) : ''
    });
    setViewingPlan(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate) return;

    try {
      const payload = {
        ...formData,
        date: formData.startDate // fallback for legacy queries
      };

      if (editingPlan) {
        await api.put(`/itineraries/${editingPlan._id}`, payload);
      } else {
        await api.post(`/groups/${groupId}/itineraries`, payload);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan', err);
    }
  };

  const handleToggleCompleted = async (plan, e) => {
    if (e) e.stopPropagation();
    const newStatus = plan.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED';
    try {
      setPlans((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, status: newStatus } : p))
      );
      if (viewingPlan && viewingPlan._id === plan._id) {
        setViewingPlan((prev) => ({ ...prev, status: newStatus }));
      }
      await api.put(`/itineraries/${plan._id}`, { status: newStatus });
    } catch (err) {
      console.error('Error updating status', err);
      fetchPlans();
    }
  };

  const handleToggleRSVP = async (planId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/itineraries/${planId}/rsvp`);
      setPlans((prev) =>
        prev.map((p) => (p._id === planId ? res.data : p))
      );
      if (viewingPlan && viewingPlan._id === planId) {
        setViewingPlan(res.data);
      }
    } catch (err) {
      console.error('Error toggling RSVP', err);
    }
  };

  const handleDelete = async (planId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip plan?')) return;
    try {
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      if (viewingPlan && viewingPlan._id === planId) {
        setViewingPlan(null);
      }
      await api.delete(`/itineraries/${planId}`);
    } catch (err) {
      console.error('Error deleting plan', err);
      fetchPlans();
    }
  };

  const completedCount = plans.filter((p) => p.status === 'COMPLETED').length;
  const upcomingCount = plans.length - completedCount;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. HERO HEADER BANNER & METRICS GRID */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/20 border border-slate-200/90 shadow-[0_15px_40px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Ambient Mesh Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-[11px] font-space font-extrabold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Group Itinerary & Travel Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-space text-slate-900 tracking-tight">
              Trip Schedule & Activities 🗺️
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg">
              Click any plan card for full details. Support for multi-day travels (24+ hrs).
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-extrabold text-xs shadow-[0_10px_25px_rgba(124,58,237,0.3)] transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Trip Activity</span>
          </button>
        </div>

        {/* 3-Column Modern Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-slate-200/60 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-slate-400">Total Planned</span>
              <div className="text-2xl font-black font-space text-slate-900 mt-0.5">{plans.length}</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-amber-500">Upcoming</span>
              <div className="text-2xl font-black font-space text-amber-700 mt-0.5">{upcomingCount}</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-emerald-600">Completed & Closed</span>
              <div className="text-2xl font-black font-space text-emerald-700 mt-0.5">{completedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEGMENTED FILTER BARS */}
      <div className="space-y-3">
        {/* Days Filter */}
        {uniqueDates.length > 0 && (
          <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-space font-extrabold transition-all shrink-0 ${
                selectedDay === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              All Days ({plans.length})
            </button>
            {uniqueDates.map((d, index) => {
              const dayCount = plans.filter((p) => (p.startDate || p.date) === d).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-space font-extrabold transition-all shrink-0 ${
                    selectedDay === d
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Day {index + 1} ({d}) • {dayCount}
                </button>
              );
            })}
          </div>
        )}

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-space font-bold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3.5 py-1.5 rounded-xl font-space font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TIMELINE CARDS LIST */}
      {loading ? (
        <div className="finlance-card p-12 rounded-3xl bg-white text-center border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-space font-bold text-xs">Loading trip schedule...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="finlance-card p-12 rounded-3xl bg-white text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-bold font-space text-slate-900">No Activity Plans Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {selectedDay !== 'ALL' || selectedCategory !== 'ALL'
                ? 'Try clearing active category or date filters.'
                : 'Start adding places to visit, restaurants, or travel plans for your trip group!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="finlance-btn-primary px-6 py-3 font-space text-xs inline-flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create First Activity</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isCompleted = plan.status === 'COMPLETED';
            const cat = CATEGORY_MAP[plan.category] || CATEGORY_MAP.OTHER;
            const CatIcon = cat.icon;

            const isUserAttending =
              currentUser &&
              plan.confirmedMembers?.some(
                (m) => (m._id || m) === currentUser._id
              );

            const startDateStr = plan.startDate || plan.date;
            const endDateStr = plan.endDate || startDateStr;
            const isMultiDay = startDateStr !== endDateStr;

            return (
              <motion.div
                key={plan._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setViewingPlan(plan)}
                className={`group cursor-pointer bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 relative overflow-hidden ${
                  isCompleted
                    ? 'border-emerald-200/80 bg-slate-50/40 opacity-85 shadow-sm'
                    : 'border-slate-200/90 hover:border-violet-400 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_35px_rgba(124,58,237,0.1)] hover:-translate-y-0.5'
                }`}
              >
                {/* Top Row: Category, Multi-day Badge, Est. Cost, Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-space font-bold border ${cat.bg}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </span>

                    {isMultiDay && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 font-space font-extrabold text-[11px]">
                        <span>Multi-Day ✈️</span>
                      </span>
                    )}

                    {plan.estimatedCost > 0 && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-space font-extrabold text-xs">
                        <span>Est: ₹{plan.estimatedCost.toLocaleString('en-IN')}</span>
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {isCompleted ? (
                    <span className="inline-flex items-center space-x-1.5 text-xs font-space font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80 shrink-0">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Closed 🔒</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-xs font-space font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/80 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Upcoming</span>
                    </span>
                  )}
                </div>

                {/* Main Card Content */}
                <div className="space-y-2">
                  <h3
                    className={`text-lg sm:text-xl font-black font-space text-slate-900 tracking-tight leading-snug group-hover:text-violet-700 transition-colors ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {plan.title}
                  </h3>

                  {/* Date & Time Range Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-space font-bold text-slate-500">
                    <div className="flex items-center space-x-1.5 text-violet-700 bg-violet-50/80 px-2.5 py-1 rounded-lg border border-violet-100">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {isMultiDay
                          ? `${startDateStr} ➔ ${endDateStr}`
                          : startDateStr}
                      </span>
                    </div>

                    {plan.startTime && (
                      <div className="flex items-center space-x-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {plan.startTime} {plan.endTime ? `- ${plan.endTime}` : ''}
                        </span>
                      </div>
                    )}

                    {plan.location && (
                      <div className="flex items-center space-x-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[200px]">{plan.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {plan.confirmedMembers?.slice(0, 4).map((member, idx) => (
                        <div
                          key={member._id || idx}
                          className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-[10px] font-space font-bold flex items-center justify-center border-2 border-white uppercase shadow-sm"
                          title={member.name || 'Member'}
                        >
                          {member.name ? member.name.charAt(0) : 'U'}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => handleToggleRSVP(plan._id, e)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-space font-bold transition-all shadow-sm ${
                        isUserAttending
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>
                        {isUserAttending ? "You're In 👍" : "I'm Going 👍"}{' '}
                        ({plan.confirmedMembers?.length || 0})
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={(e) => handleToggleCompleted(plan, e)}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-space font-extrabold transition-all duration-200 active:scale-95 ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Reopen 🔓' : 'Mark Done ✅'}</span>
                    </button>

                    <button
                      onClick={(e) => handleOpenEditModal(plan, e)}
                      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all border border-transparent hover:border-violet-100"
                      title="Edit Activity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(plan._id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                      title="Delete Activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. FULL DETAILS MODAL POPUP */}
      <AnimatePresence>
        {viewingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-slate-200/90 relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Header Bar */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const cat = CATEGORY_MAP[viewingPlan.category] || CATEGORY_MAP.OTHER;
                      const CatIcon = cat.icon;
                      return (
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-space font-bold border ${cat.bg}`}>
                          <CatIcon className="w-3.5 h-3.5" />
                          <span>{cat.label}</span>
                        </span>
                      );
                    })()}
                    {viewingPlan.status === 'COMPLETED' ? (
                      <span className="text-xs font-space font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        Closed 🔒
                      </span>
                    ) : (
                      <span className="text-xs font-space font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                        Upcoming Plan
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black font-space text-slate-900 tracking-tight pt-1">
                    {viewingPlan.title}
                  </h2>
                </div>

                <button
                  onClick={() => setViewingPlan(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Date & Time Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-space font-extrabold uppercase tracking-wider text-slate-400">
                  Schedule Details ⏱️
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-space font-bold">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] uppercase">Start Date & Time</span>
                    <span className="text-slate-900 text-sm font-extrabold mt-0.5 block">
                      {viewingPlan.startDate || viewingPlan.date}
                    </span>
                    {viewingPlan.startTime && (
                      <span className="text-violet-700 font-semibold">{viewingPlan.startTime}</span>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] uppercase">End Date & Time</span>
                    <span className="text-slate-900 text-sm font-extrabold mt-0.5 block">
                      {viewingPlan.endDate || viewingPlan.startDate || viewingPlan.date}
                    </span>
                    {viewingPlan.endTime && (
                      <span className="text-indigo-700 font-semibold">{viewingPlan.endTime}</span>
                    )}
                  </div>
                </div>

                {viewingPlan.location && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-space font-bold">Location Pin</span>
                      <span className="text-slate-900 text-xs font-bold font-space">{viewingPlan.location}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingPlan.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-space font-bold text-xs border border-rose-200/60 inline-flex items-center space-x-1 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open Map</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Description / Notes Block */}
              {viewingPlan.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-space font-extrabold uppercase tracking-wider text-slate-400">
                    Instructions & Notes 📝
                  </h4>
                  <p className="text-xs font-medium text-slate-700 bg-violet-50/40 p-4 rounded-2xl border border-violet-100 leading-relaxed whitespace-pre-line">
                    {viewingPlan.description}
                  </p>
                </div>
              )}

              {/* Budget & Created By */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/60">
                  <span className="text-[10px] font-space font-bold uppercase text-emerald-600 block">Est. Budget</span>
                  <span className="text-lg font-black font-space text-emerald-800">
                    ₹{viewingPlan.estimatedCost ? viewingPlan.estimatedCost.toLocaleString('en-IN') : '0'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-space font-bold text-xs flex items-center justify-center uppercase">
                    {viewingPlan.createdBy?.name ? viewingPlan.createdBy.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] font-space font-bold uppercase text-slate-400 block">Planned By</span>
                    <span className="text-xs font-bold font-space text-slate-800 truncate block max-w-[110px]">
                      {viewingPlan.createdBy?.name || 'Group Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RSVP Confirmed Members Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-space font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span>Attending Members ({viewingPlan.confirmedMembers?.length || 0})</span>
                  </h4>

                  <button
                    onClick={(e) => handleToggleRSVP(viewingPlan._id, e)}
                    className="px-3 py-1 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 font-space font-bold text-xs transition-all"
                  >
                    {viewingPlan.confirmedMembers?.some((m) => (m._id || m) === currentUser?._id)
                      ? "You're In 👍"
                      : "I'm Going 👍"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingPlan.confirmedMembers?.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center space-x-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-space font-bold text-[10px] flex items-center justify-center uppercase">
                        {m.name ? m.name.charAt(0) : 'M'}
                      </div>
                      <span className="text-xs font-bold font-space text-slate-800 truncate">
                        {m.name || 'Group Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={(e) => handleOpenEditModal(viewingPlan, e)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-space font-bold text-xs border border-slate-200/80 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Plan ✏️</span>
                </button>

                <button
                  onClick={(e) => handleToggleCompleted(viewingPlan, e)}
                  className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl text-xs font-space font-extrabold transition-all shadow-md ${
                    viewingPlan.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{viewingPlan.status === 'COMPLETED' ? 'Reopen Activity' : 'Mark Completed ✅'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CREATE / EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 relative overflow-hidden z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-extrabold font-space text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <span>{editingPlan ? 'Edit Trip Activity' : 'Add Trip Activity 🗺️'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scuba Diving or Flight to Goa"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date & End Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Date (For 24+ hr trips)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location Pin (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baga Beach, North Goa"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Estimated Budget */}
                <div>
                  <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Est. Budget (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-space font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flight PNR number, hotel booking voucher details"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-space font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="finlance-btn-primary px-6 py-3 font-space text-xs shadow-lg"
                  >
                    {editingPlan ? 'Save Changes' : 'Add Activity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
