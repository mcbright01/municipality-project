import React, { useEffect, useState } from 'react';
import { BarChart3, MapPin, Copy, Users } from 'lucide-react';
import api from '../../api/client';
import { StatCard } from './CitizenPanel';

const AnalystPanel = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/summary')
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-slate-400 py-12">Loading statistics…</p>;
  if (!summary) return <p className="text-center text-red-500 py-12">Could not load statistics.</p>;

  const maxCategoryCount = Math.max(1, ...summary.byCategory.map((c) => c.count));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total Complaints" value={summary.totals.total_complaints} icon={<BarChart3 className="text-blue-600" />} />
        <StatCard label="Flagged Duplicates" value={summary.totals.duplicate_count} icon={<Copy className="text-red-600" />} />
        <StatCard label="Registered Citizens" value={summary.totals.total_citizens} icon={<Users className="text-purple-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Complaints by Category</h3>
          <div className="space-y-3">
            {summary.byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">{c.category}</span>
                  <span className="text-slate-400 font-bold">{c.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(c.count / maxCategoryCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {summary.byStatus.map((s) => (
              <div key={s.status} className="bg-slate-50 rounded-xl p-4">
                <p className="text-2xl font-black text-slate-900">{s.count}</p>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          <MapPin size={16} /> Top Reported Areas
        </h3>
        {summary.topAreas.length === 0 ? (
          <p className="text-slate-400 italic text-sm">No data yet.</p>
        ) : (
          <ol className="space-y-2">
            {summary.topAreas.map((a, i) => (
              <li key={a.location_address} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                <span className="text-slate-700 font-medium">{i + 1}. {a.location_address}</span>
                <span className="text-slate-400 font-bold">{a.count} reports</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
};

export default AnalystPanel;
