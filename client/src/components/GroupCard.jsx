import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatSignedBalance } from '../utils/currencyFormatter';

export const GroupCard = ({ group }) => {
  const {
    _id,
    name,
    startDate,
    endDate,
    members = [],
    totalSpending = 0,
    yourBalance = 0,
    currency = 'INR',
    status = 'Active'
  } = group;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  const statusBadges = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const isPositive = yourBalance > 0.01;
  const isNegative = yourBalance < -0.01;

  return (
    <Link
      to={`/groups/${_id}`}
      className="finlance-card p-6 rounded-3xl flex flex-col justify-between group relative overflow-hidden bg-white hover:border-violet-200/90 transition-all duration-300"
    >
      {/* Subtle top right violet accent glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
              🏔
            </div>
            <div className="flex flex-col">
              <h3 className="font-space text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors truncate max-w-[170px]">
                {name}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Trip Group</span>
            </div>
          </div>
          <span className={`text-[10px] font-space font-bold tracking-wider px-2.5 py-1 rounded-full border ${statusBadges[status] || statusBadges.Active}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500 mb-4 pt-1">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(startDate)} → {formatDate(endDate)}</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{members.length} members</span>
          </span>
        </div>

        {/* Member Avatars Overlapping Stack */}
        <div className="flex items-center space-x-1 mb-5">
          {members.slice(0, 4).map((m, idx) => (
            <img
              key={m._id || idx}
              src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
              alt={m.name}
              className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 object-cover -ml-2 first:ml-0 shadow-sm group-hover:-translate-y-0.5 transition-transform"
              title={m.name}
            />
          ))}
          {members.length > 4 && (
            <span className="w-8 h-8 rounded-full bg-violet-50 border-2 border-white text-[10px] font-space font-bold text-violet-700 flex items-center justify-center -ml-2 shadow-sm">
              +{members.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Balance Summary */}
      <div className="pt-4 border-t border-slate-100/90 grid grid-cols-2 gap-2 items-end">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Total spent</span>
          <p className="font-space text-base font-extrabold text-slate-900 mt-0.5">
            {formatCurrency(totalSpending, currency)}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block">Your balance</span>
          <p
            className={`font-space text-base font-extrabold mt-0.5 ${
              isPositive
                ? 'text-emerald-600'
                : isNegative
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {formatSignedBalance(yourBalance, currency)}
          </p>
        </div>
      </div>
    </Link>
  );
};
