import React, { useEffect, useState } from 'react';
import { Users, BarChart3 } from 'lucide-react';
import api from '../../api/client';
import { StatCard, statusStyles } from './CitizenPanel';

const SupervisorPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/complaints'), api.get('/users/inspectors')])
      .then(([c, i]) => {
        setComplaints(c.data);
        setInspectors(i.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const assign = async (complaintId, inspectorId) => {
    if (!inspectorId) return;
    try {
      await api.patch(`/complaints/${complaintId}/assign`, { inspector_id: inspectorId });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not assign complaint.');
    }
  };

  const unassigned = complaints.filter((c) => c.status === 'Pending');
  const inProgress = complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status));

  const stats = [
    { label: 'Unassigned', value: unassigned.length, icon: <Users className="text-red-600" /> },
    { label: 'Assigned / In Progress', value: inProgress.length, icon: <BarChart3 className="text-blue-600" /> },
    { label: 'Active Inspectors', value: inspectors.length, icon: <Users className="text-purple-600" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Assign Complaints to Field Inspectors</h3>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : complaints.length === 0 ? (
          <p className="p-12 text-center text-slate-400 italic">No complaints on file.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono font-bold text-slate-900 text-sm">{c.reference_number}</p>
                  <p className="text-slate-600 text-sm mt-1">{c.category} — {c.location_address}</p>
                  {c.inspector_name && (
                    <p className="text-slate-400 text-xs mt-1">Assigned to {c.inspector_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${statusStyles[c.status] || ''}`}>
                    {c.status}
                  </span>
                  {inspectors.length > 0 && !['Resolved', 'Rejected'].includes(c.status) && (
                    <select
                      defaultValue=""
                      onChange={(e) => assign(c.complaint_id, e.target.value)}
                      className="text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
                    >
                      <option value="" disabled>Assign inspector…</option>
                      {inspectors.map((i) => (
                        <option key={i.user_id} value={i.user_id}>{i.full_name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SupervisorPanel;
