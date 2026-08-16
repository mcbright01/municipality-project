import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '../../api/client';
import { StatCard, statusStyles, PhotoStrip } from './CitizenPanel';

const STATUS_OPTIONS = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const OfficerPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/complaints', { params: filter ? { status: filter } : {} })
      .then((res) => setComplaints(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status.');
    }
  };

  const removeDuplicate = async (id) => {
    if (!window.confirm('Remove this complaint? This cannot be undone.')) return;
    try {
      await api.delete(`/complaints/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove complaint.');
    }
  };

  const stats = [
    { label: 'Total Complaints', value: complaints.length, icon: <FileText className="text-blue-600" /> },
    { label: 'Pending', value: complaints.filter((c) => c.status === 'Pending').length, icon: <FileText className="text-yellow-600" /> },
    { label: 'Flagged Duplicates', value: complaints.filter((c) => c.is_duplicate).length, icon: <FileText className="text-red-600" /> },
    { label: 'Resolved', value: complaints.filter((c) => c.status === 'Resolved').length, icon: <FileText className="text-green-600" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">All Complaints</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : complaints.length === 0 ? (
          <p className="p-12 text-center text-slate-400 italic">No complaints found.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    {c.reference_number}
                    {c.is_duplicate && (
                      <span className="ml-2 text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Possible Duplicate
                      </span>
                    )}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">{c.category} — {c.location_address}</p>
                  <p className="text-slate-400 text-xs mt-1">Reported by {c.citizen_name}</p>
                  <PhotoStrip photos={c.photos} />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c.complaint_id, e.target.value)}
                    className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border outline-none ${statusStyles[c.status] || ''}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => removeDuplicate(c.complaint_id)}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default OfficerPanel;
