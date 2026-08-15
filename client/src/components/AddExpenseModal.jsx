import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Plus, Trash2, CheckCircle2, AlertCircle, Calendar, User, Check, Sparkles, Edit2 } from 'lucide-react';
import Lenis from 'lenis';
import api from '../services/api';

const CATEGORIES = [
  { name: 'Food', icon: '🍛' },
  { name: 'Travel', icon: '🚗' },
  { name: 'Hotel', icon: '🏨' },
  { name: 'Tickets', icon: '🎟' },
  { name: 'Music', icon: '🎵' },
  { name: 'Entertainment', icon: '🍿' },
  { name: 'Shopping', icon: '🛍' },
  { name: 'Fuel', icon: '⛽' },
  { name: 'Drinks', icon: '🍹' },
  { name: 'Activities', icon: '🏔' },
  { name: 'Other', icon: '🧾' }
];

export const AddExpenseModal = ({
  isOpen,
  onClose,
  groupId,
  members = [],
  onExpenseAdded,
  editingExpense = null
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Payers state
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [singlePayerId, setSinglePayerId] = useState('');
  const [multiPayersMap, setMultiPayersMap] = useState({});

  // Split state
  const [splitType, setSplitType] = useState('EQUAL'); // 'EQUAL' | 'UNEQUAL' | 'ITEM_WISE'
  const [selectedEqualMembers, setSelectedEqualMembers] = useState([]);
  const [unequalSharesMap, setUnequalSharesMap] = useState({});
  const [itemsList, setItemsList] = useState([
    { name: '', price: '', participants: [] }
  ]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const modalScrollRef = useRef(null);

  // Initialize Lenis Smooth Inertia Scrolling inside Modal
  useEffect(() => {
    if (isOpen && modalScrollRef.current) {
      const lenis = new Lenis({
        wrapper: modalScrollRef.current,
        content: modalScrollRef.current.firstElementChild,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.2,
        touchMultiplier: 2,
      });

      let animationFrameId;
      function raf(time) {
        lenis.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      }
      animationFrameId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(animationFrameId);
        lenis.destroy();
      };
    }
  }, [isOpen]);

  // Populate data for Create or Edit mode
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (editingExpense) {
        setDescription(editingExpense.description || '');
        setCategory(editingExpense.category || 'Food');
        setAmount(editingExpense.amount ? editingExpense.amount.toString() : '');
        if (editingExpense.date) {
          setDate(new Date(editingExpense.date).toISOString().split('T')[0]);
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }

        // Payers setup
        const payers = editingExpense.payers || [];
        if (payers.length > 1) {
          setIsMultiPayer(true);
          const map = {};
          members.forEach(m => { map[m._id] = ''; });
          payers.forEach(p => {
            const uId = p.userId?._id || p.userId;
            if (uId) map[uId] = p.amount ? p.amount.toString() : '';
          });
          setMultiPayersMap(map);
        } else {
          setIsMultiPayer(false);
          const uId = payers[0]?.userId?._id || payers[0]?.userId || (members[0]?._id || '');
          setSinglePayerId(uId);
          const map = {};
          members.forEach(m => { map[m._id] = ''; });
          if (uId) map[uId] = editingExpense.amount ? editingExpense.amount.toString() : '';
          setMultiPayersMap(map);
        }

        // Split Type & Participants
        const sType = editingExpense.splitType || 'EQUAL';
        setSplitType(sType);

        const parts = editingExpense.participants || [];
        const partUserIds = parts.map(p => p.userId?._id || p.userId);
        setSelectedEqualMembers(partUserIds.length > 0 ? partUserIds : members.map(m => m._id));

        const uMap = {};
        members.forEach(m => { uMap[m._id] = ''; });
        parts.forEach(p => {
          const uId = p.userId?._id || p.userId;
          if (uId) uMap[uId] = p.shareAmount ? p.shareAmount.toString() : '';
        });
        setUnequalSharesMap(uMap);

        if (editingExpense.items && editingExpense.items.length > 0) {
          setItemsList(
            editingExpense.items.map(item => ({
              name: item.name || '',
              price: item.price ? item.price.toString() : '',
              participants: item.participants ? item.participants.map(p => p._id || p) : []
            }))
          );
        } else {
          setItemsList([{ name: '', price: '', participants: members.map(m => m._id) }]);
        }
      } else {
        // Reset for brand new expense
        setDescription('');
        setCategory('Food');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setIsMultiPayer(false);
        if (members.length > 0) {
          setSinglePayerId(members[0]._id);
          setSelectedEqualMembers(members.map(m => m._id));

          const initialMap = {};
          members.forEach(m => { initialMap[m._id] = ''; });
          setMultiPayersMap(initialMap);
          setUnequalSharesMap(initialMap);
        }
        setItemsList([{ name: '', price: '', participants: members.map(m => m._id) }]);
      }
    }
  }, [isOpen, editingExpense?._id]);

  if (!isOpen) return null;

  const totalAmountNum = parseFloat(amount) || 0;

  const multiPayerSum = Object.values(multiPayersMap).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const unequalSum = Object.values(unequalSharesMap).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const itemsSum = itemsList.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0),
    0
  );

  const handleAddItemRow = () => {
    setItemsList([...itemsList, { name: '', price: '', participants: members.map(m => m._id) }]);
  };

  const handleRemoveItemRow = (index) => {
    setItemsList(itemsList.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...itemsList];
    updated[index][field] = value;
    setItemsList(updated);
  };

  const handleToggleItemParticipant = (itemIndex, memberId) => {
    const updated = [...itemsList];
    const item = updated[itemIndex];
    if (item.participants.includes(memberId)) {
      item.participants = item.participants.filter(id => id !== memberId);
    } else {
      item.participants.push(memberId);
    }
    setItemsList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (totalAmountNum <= 0) {
      setError('Expense amount must be greater than 0');
      return;
    }

    let payersData = [];
    if (!isMultiPayer) {
      if (!singlePayerId) {
        setError('Please select who paid for this expense');
        return;
      }
      payersData = [{ userId: singlePayerId, amount: totalAmountNum }];
    } else {
      payersData = Object.entries(multiPayersMap)
        .map(([uId, val]) => ({ userId: uId, amount: parseFloat(val) || 0 }))
        .filter(p => p.amount > 0);

      if (Math.abs(multiPayerSum - totalAmountNum) > 0.01) {
        setError(`Paid amount (₹${multiPayerSum.toFixed(2)}) must equal total expense amount (₹${totalAmountNum.toFixed(2)}).`);
        return;
      }
    }

    let participantsData = [];
    let itemsData = [];

    if (splitType === 'EQUAL') {
      if (selectedEqualMembers.length === 0) {
        setError('Select at least one participant to split equally');
        return;
      }
      participantsData = selectedEqualMembers.map(id => ({ userId: id }));
    } else if (splitType === 'UNEQUAL') {
      if (Math.abs(unequalSum - totalAmountNum) > 0.01) {
        setError(`Split amounts (₹${unequalSum.toFixed(2)}) must equal total expense amount (₹${totalAmountNum.toFixed(2)}).`);
        return;
      }
      participantsData = Object.entries(unequalSharesMap)
        .map(([uId, val]) => ({ userId: uId, shareAmount: parseFloat(val) || 0 }))
        .filter(p => p.shareAmount > 0);
    } else if (splitType === 'ITEM_WISE') {
      if (itemsList.length === 0) {
        setError('At least one item is required for item-wise split');
        return;
      }
      if (Math.abs(itemsSum - totalAmountNum) > 0.01) {
        setError(`Sum of items (₹${itemsSum.toFixed(2)}) must equal total expense amount (₹${totalAmountNum.toFixed(2)}).`);
        return;
      }

      for (let i = 0; i < itemsList.length; i++) {
        const item = itemsList[i];
        if (!item.name.trim()) {
          setError(`Item #${i + 1} name cannot be empty`);
          return;
        }
        if ((parseFloat(item.price) || 0) <= 0) {
          setError(`Item #${i + 1} price must be greater than 0`);
          return;
        }
        if (item.participants.length === 0) {
          setError(`Item "${item.name}" must have at least one participant`);
          return;
        }
      }

      itemsData = itemsList.map(item => ({
        name: item.name,
        price: parseFloat(item.price),
        participants: item.participants
      }));
    }

    try {
      setSubmitting(true);
      const payload = {
        description,
        category,
        amount: totalAmountNum,
        date,
        payers: payersData,
        splitType,
        participants: participantsData,
        items: itemsData
      };

      let res;
      if (editingExpense) {
        res = await api.put(`/expenses/${editingExpense._id}`, payload);
      } else {
        res = await api.post(`/groups/${groupId}/expenses`, payload);
      }

      onExpenseAdded(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving expense');
    } finally {
      setSubmitting(false);
    }
  };

  const perPersonShare = selectedEqualMembers.length > 0 && totalAmountNum > 0
    ? (totalAmountNum / selectedEqualMembers.length).toFixed(2)
    : '0.00';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/30 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white w-full max-w-xl rounded-[32px] p-5 sm:p-7 border border-slate-200/90 shadow-[0_30px_90px_rgba(15,23,42,0.12)] relative my-auto max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold shadow-sm text-xl">
                {editingExpense ? '✏️' : '💳'}
              </div>
              <div>
                <h2 className="font-space text-2xl font-extrabold text-slate-900 tracking-tight">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {editingExpense ? 'Update payer, amount, or split mode' : 'Record a payment & select split mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2 flex-shrink-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Form Body - Lenis Dedicated Instance for Butter Smooth Inertia Scroll */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div
              ref={modalScrollRef}
              data-lenis-prevent
              className="overflow-y-auto pt-4 pr-1.5 space-y-5 flex-1 custom-modal-scroll"
            >
              <div className="space-y-5">
                {/* Description & Amount Hero Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                      What was it for? *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nanded To Kalyan"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/90 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-100/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                      Amount (₹) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm font-extrabold text-violet-600">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-violet-50/70 border border-violet-200/80 pl-8 pr-4 py-3 rounded-2xl text-base font-space font-extrabold text-violet-700 placeholder:text-violet-300 focus:bg-white focus:border-violet-600 transition-all text-right"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Category Pills Strip */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                    Category
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-space font-bold whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 scale-[1.03]'
                              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80'
                          }`}
                        >
                          <span className="text-sm">{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Paid By Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/90 px-4 py-2.5 rounded-2xl text-xs font-space font-bold text-slate-900 focus:bg-white focus:border-violet-600 transition-all"
                    />
                  </div>

                  {/* Paid By Toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-space font-bold uppercase text-slate-500 tracking-wider">
                        Paid By
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMultiPayer(!isMultiPayer)}
                        className="text-xs text-violet-600 font-bold hover:underline"
                      >
                        {isMultiPayer ? 'Single Payer' : 'Multiple Payers?'}
                      </button>
                    </div>

                    {!isMultiPayer ? (
                      <select
                        value={singlePayerId}
                        onChange={(e) => setSinglePayerId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/90 px-4 py-2.5 rounded-2xl text-xs font-space font-bold text-slate-900 cursor-pointer shadow-sm focus:bg-white focus:border-violet-600"
                      >
                        {members.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        {members.map(m => (
                          <div key={m._id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-800 font-semibold">{m.name}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={multiPayersMap[m._id] || ''}
                                onChange={(e) => setMultiPayersMap({ ...multiPayersMap, [m._id]: e.target.value })}
                                className="w-24 bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs text-right font-space font-bold"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 flex justify-between text-xs font-bold border-t border-slate-200">
                          <span className="text-slate-500">Paid Sum:</span>
                          <span className={Math.abs(multiPayerSum - totalAmountNum) < 0.01 ? 'text-emerald-600 font-space' : 'text-rose-600 font-space'}>
                            ₹{multiPayerSum.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SPLIT MODE SECTION */}
                <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-space font-extrabold uppercase text-slate-700 tracking-wider">
                      Split Mode
                    </span>
                    {splitType === 'EQUAL' && selectedEqualMembers.length > 0 && totalAmountNum > 0 && (
                      <span className="text-xs font-space font-extrabold text-emerald-700 bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200/90 shadow-xs flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>₹{perPersonShare} each</span>
                      </span>
                    )}
                  </div>

                  {/* Segmented Control Strip */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200/60">
                    {[
                      { id: 'EQUAL', label: 'Equal' },
                      { id: 'UNEQUAL', label: 'Unequal' },
                      { id: 'ITEM_WISE', label: 'Item-wise' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSplitType(mode.id)}
                        className={`py-2 px-3 rounded-xl font-space text-xs font-extrabold transition-all ${
                          splitType === mode.id
                            ? 'bg-white text-violet-700 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* EQUAL SPLIT MEMBER TILES */}
                  {splitType === 'EQUAL' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs font-space font-semibold text-slate-500 px-1">
                        <span>{selectedEqualMembers.length} of {members.length} members selected</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedEqualMembers.length === members.length) {
                              setSelectedEqualMembers([]);
                            } else {
                              setSelectedEqualMembers(members.map(m => m._id));
                            }
                          }}
                          className="text-violet-600 hover:text-violet-800 text-[11px] font-bold"
                        >
                          {selectedEqualMembers.length === members.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {members.map(m => {
                          const isChecked = selectedEqualMembers.includes(m._id);
                          return (
                            <button
                              key={m._id}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedEqualMembers(selectedEqualMembers.filter(id => id !== m._id));
                                } else {
                                  setSelectedEqualMembers([...selectedEqualMembers, m._id]);
                                }
                              }}
                              className={`relative flex items-center justify-between p-3 rounded-2xl transition-all duration-200 text-left ${
                                isChecked
                                  ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950 shadow-sm'
                                  : 'bg-white border border-slate-200/90 text-slate-500 hover:border-slate-300 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                  alt={m.name}
                                  className={`w-8 h-8 rounded-full border ${
                                    isChecked ? 'border-emerald-300' : 'border-slate-200'
                                  } object-cover`}
                                />
                                <div>
                                  <p className={`font-space text-xs font-extrabold ${isChecked ? 'text-emerald-950' : 'text-slate-700'}`}>
                                    {m.name}
                                  </p>
                                  {isChecked && totalAmountNum > 0 && (
                                    <p className="text-[10px] text-emerald-700 font-space font-bold">
                                      ₹{perPersonShare}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isChecked
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'bg-slate-100 border border-slate-300 text-transparent'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* UNEQUAL SPLIT */}
                  {splitType === 'UNEQUAL' && (
                    <div className="space-y-2 pt-1">
                      {members.map(m => (
                        <div key={m._id} className="flex items-center justify-between text-xs bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                              alt={m.name}
                              className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                            />
                            <span className="text-slate-800 font-space font-bold">{m.name}'s Share</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={unequalSharesMap[m._id] || ''}
                              onChange={(e) => setUnequalSharesMap({ ...unequalSharesMap, [m._id]: e.target.value })}
                              className="w-28 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-right font-space font-extrabold text-violet-700 focus:outline-none focus:border-violet-600"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Shares Sum:</span>
                        <span className={Math.abs(unequalSum - totalAmountNum) < 0.01 ? 'text-emerald-600 font-space font-extrabold' : 'text-rose-600 font-space font-extrabold'}>
                          ₹{unequalSum.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ITEM_WISE SPLIT */}
                  {splitType === 'ITEM_WISE' && (
                    <div className="space-y-3 pt-1">
                      {itemsList.map((item, idx) => (
                        <div key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Item name (e.g. Pizza, Drinks)"
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
                            />
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                className="w-24 bg-slate-50 border border-slate-200 px-2 py-2 rounded-xl text-xs text-right font-space font-bold text-violet-700"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Shared by:</span>
                            {members.map(m => {
                              const isSelected = item.participants.includes(m._id);
                              return (
                                <button
                                  key={m._id}
                                  type="button"
                                  onClick={() => handleToggleItemParticipant(idx, m._id)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-space font-bold border transition-colors ${
                                    isSelected
                                      ? 'bg-violet-600 border-violet-600 text-white'
                                      : 'bg-slate-100 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {m.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="w-full py-2.5 bg-white hover:bg-slate-50 text-violet-600 border border-violet-200 rounded-2xl text-xs font-space font-bold flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Item</span>
                      </button>

                      <div className="pt-2 flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Items Sum: ₹{itemsSum.toFixed(2)}</span>
                        <span className={Math.abs(itemsSum - totalAmountNum) < 0.01 ? 'text-emerald-600 font-space' : 'text-rose-600 font-space'}>
                          {Math.abs(itemsSum - totalAmountNum) < 0.01 ? '✓ Balanced' : `Expense Total: ₹${totalAmountNum.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-space font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-space font-extrabold text-xs shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{submitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
