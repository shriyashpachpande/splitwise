import React from 'react';

export const SkeletonGroupCard = () => (
  <div className="saas-card p-6 rounded-2xl border border-slate-200 bg-white space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-5 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded-full w-16" />
    </div>
    <div className="h-4 bg-slate-100 rounded w-3/4" />
    <div className="flex space-x-2 pt-2">
      <div className="w-7 h-7 bg-slate-200 rounded-full" />
      <div className="w-7 h-7 bg-slate-200 rounded-full" />
      <div className="w-7 h-7 bg-slate-200 rounded-full" />
    </div>
    <div className="pt-4 border-t border-slate-100 flex justify-between">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/4" />
    </div>
  </div>
);

export const SkeletonStatCard = () => (
  <div className="saas-card p-5 rounded-2xl border border-slate-200 bg-white space-y-2 animate-pulse">
    <div className="h-3 bg-slate-200 rounded w-1/2" />
    <div className="h-8 bg-slate-200 rounded w-3/4" />
    <div className="h-3 bg-slate-100 rounded w-2/3" />
  </div>
);
