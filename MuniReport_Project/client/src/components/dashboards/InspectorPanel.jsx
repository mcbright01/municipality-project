import React, { useEffect, useState } from 'react';
import { Map, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import { StatCard, PhotoStrip } from './CitizenPanel';

const InspectorPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null); // complaint_id being reported on
  const [findings, setFindings] = useState('');
  const [isFalseReport, setIsFalseReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/complaints/assigned')
      .then((res) => setComplaints(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openReportForm = (id) => {
    setActiveReport(id);
    setFindings('');
    setIsFalseReport(false);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/complaints/${activeReport}/inspection`, { findings, isFalseReport });
      setActiveReport(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Assigned Cases', value: complaints.length, icon: <Map className="text-purple-600" /> },
    { label: 'In Progress', value: complaints.filter((c) => c.status === 'In Progress').length, icon: <CheckCircle className="text-orange-600" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">My Assignments</h3>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : complaints.length === 0 ? (
          <p className="p-12 text-center text-slate-400 italic">No sites currently assigned to you.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono font-bold text-slate-900 text-sm">{c.reference_number}</p>
                    <p className="text-slate-600 text-sm mt-1">{c.category} — {c.location_address}</p>
                    <p className="text-slate-500 text-sm mt-2 max-w-lg">{c.description}</p>
                    <PhotoStrip photos={c.photos} />
                  </div>
                  <button
                    onClick={() => openReportForm(c.complaint_id)}
                    className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Submit Site Report
                  </button>
                </div>

                {activeReport === c.complaint_id && (
                  <form onSubmit={submitReport} className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <textarea
                      required
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      placeholder="Describe what you found on-site…"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <input type="checkbox" checked={isFalseReport} onChange={(e) => setIsFalseReport(e.target.checked)} />
                      This complaint is false or could not be verified on-site
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" disabled={submitting} className="bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60">
                        {submitting ? 'Submitting…' : 'Submit'}
                      </button>
                      <button type="button" onClick={() => setActiveReport(null)} className="text-sm font-bold text-slate-500">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default InspectorPanel;
