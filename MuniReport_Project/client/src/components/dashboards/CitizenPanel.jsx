import React, { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/client';

const statusStyles = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-green-50 text-green-700 border-green-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const CitizenPanel = ({ onNavigateSubmit }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/complaints/mine')
      .then((res) => setComplaints(res.data))
      .catch(() => setError('Could not load your complaints.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancelComplaint = async (id) => {
    if (!window.confirm('Cancel this complaint?')) return;
    try {
      await api.patch(`/complaints/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel complaint.');
    }
  };

  const stats = [
    { label: 'Total Complaints', value: complaints.length, icon: <FileText className="text-blue-600" /> },
    { label: 'Pending', value: complaints.filter((c) => c.status === 'Pending').length, icon: <Clock className="text-yellow-600" /> },
    { label: 'In Progress', value: complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length, icon: <FileText className="text-blue-400" /> },
    { label: 'Resolved', value: complaints.filter((c) => c.status === 'Resolved').length, icon: <CheckCircle className="text-green-600" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onNavigateSubmit}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          Submit New Complaint
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">My Complaints</h3>
        </div>
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-red-500">{error}</p>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 font-medium italic">No complaints submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-mono font-bold text-slate-900 text-sm">{c.reference_number}</p>
                  <p className="text-slate-600 text-sm mt-1">{c.category} — {c.location_address}</p>
                  <p className="text-slate-400 text-xs mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                  <PhotoStrip photos={c.photos} />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${statusStyles[c.status] || ''}`}>
                    {c.status}
                  </span>
                  {c.status === 'Pending' && (
                    <button
                      onClick={() => cancelComplaint(c.complaint_id)}
                      className="text-slate-400 hover:text-red-500 transition"
                      title="Cancel complaint"
                    >
                      <XCircle size={18} />
                    </button>
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

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
    <div className="p-4 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">{icon}</div>
    <div>
      <div className="text-3xl font-black text-slate-900 leading-none">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wide">{label}</div>
    </div>
  </div>
);

// Small thumbnail row for a complaint's attached photos, with a lightbox
// on click. Reused across the Citizen, Officer, and Inspector panels.
const PhotoStrip = ({ photos }) => {
  const [lightbox, setLightbox] = React.useState(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-3">
        {photos.slice(0, 4).map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(src)}
            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition"
          >
            <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
        {photos.length > 4 && (
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
            +{photos.length - 4}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
        >
          <img src={lightbox} alt="Full size evidence" className="max-h-full max-w-full rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  );
};

export default CitizenPanel;
export { StatCard, statusStyles, PhotoStrip };
