import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AppShell } from '../components/AppShell';
import { Activity, Clock } from 'lucide-react';

export const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalActivities = async () => {
      try {
        setLoading(true);
        // Fetch groups and aggregate recent activities
        const res = await api.get('/groups');
        const groups = res.data;
        let allActs = [];

        for (const g of groups) {
          try {
            const actRes = await api.get(`/groups/${g._id}/activity`);
            allActs = [...allActs, ...actRes.data.map(a => ({ ...a, groupName: g.name }))];
          } catch (e) {
            // Ignore single group activity fetch error
          }
        }

        allActs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(allActs);
      } catch (err) {
        console.error('Error loading activity feed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalActivities();
  }, []);

  return (
    <AppShell title="Activity Timeline">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="saas-card p-6 rounded-3xl border border-slate-200 bg-white space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Group Activity</h2>
              <p className="text-xs text-slate-500">Live stream of expense additions, edits, and settlements</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading recent timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No recent activity recorded yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              {activities.map(act => (
                <div key={act._id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {act.groupName}
                    </span>
                    <p className="text-xs font-semibold text-slate-800">{act.description}</p>
                    <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{new Date(act.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
