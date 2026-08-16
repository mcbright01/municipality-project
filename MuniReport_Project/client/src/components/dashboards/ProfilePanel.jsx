import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Building2 } from 'lucide-react';
import api from '../../api/client';

const ProfilePanel = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-slate-400 py-12">Loading profile…</p>;

  const p = profile || user || {};
  const isCitizen = p.role === 'Citizen';

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-white shadow flex items-center justify-center text-2xl font-black text-blue-600">
            {(p.name || '?').charAt(0)}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">{p.name}</h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">
              {p.role}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <ProfileRow icon={<Mail size={16} />} label="Email" value={p.email} />

          {isCitizen && (
            <>
              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Address on file</p>
              </div>
              <ProfileRow icon={<Building2 size={16} />} label="Municipality" value={p.municipality} />
              <ProfileRow icon={<MapPin size={16} />} label="City / Town" value={p.city} />
              <ProfileRow icon={<MapPin size={16} />} label="Province" value={p.province} />
              <ProfileRow icon={<MapPin size={16} />} label="Postal Address" value={p.postalAddress} />
            </>
          )}

          {!isCitizen && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-500">
              Staff accounts don't carry a residential address — that's collected for Citizen accounts only,
              so complaints can be routed to the right municipality.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-slate-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export default ProfilePanel;
