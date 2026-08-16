import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, UserPlus, Copy } from 'lucide-react';
import api from '../../api/client';
import { StatCard } from './CitizenPanel';

const ROLES = ['Admin', 'Citizen', 'Municipal Officer', 'Field Inspector', 'Supervisor', 'Data Analyst'];
const STAFF_ROLES = ROLES.filter((r) => r !== 'Citizen');

const AdminPanel = ({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: STAFF_ROLES[0] });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCredential, setCreatedCredential] = useState(null); // { email, temporaryPassword }

  const load = () => {
    setLoading(true);
    api.get('/users').then((res) => setUsers(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u.user_id}`, { is_active: !u.is_active });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user.');
    }
  };

  const changeRole = async (u, role) => {
    try {
      await api.patch(`/users/${u.user_id}`, { role });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update role.');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.full_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.user_id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete user.');
    }
  };

  const createStaffUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await api.post('/users', newUser);
      setCreatedCredential({ email: res.data.email, temporaryPassword: res.data.temporaryPassword });
      setNewUser({ fullName: '', email: '', role: STAFF_ROLES[0] });
      setShowCreateForm(false);
      load();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create user.');
    } finally {
      setCreating(false);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users className="text-blue-600" /> },
    { label: 'Active', value: users.filter((u) => u.is_active).length, icon: <ShieldCheck className="text-green-600" /> },
    { label: 'Deactivated', value: users.filter((u) => !u.is_active).length, icon: <ShieldCheck className="text-red-600" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* One-time credential display after creating a staff account */}
      {createdCredential && (
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">
              Staff account created — save this password now, it won't be shown again
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{createdCredential.email}</span>
              {' — temporary password: '}
              <span className="font-mono font-black">{createdCredential.temporaryPassword}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Share this with them securely; they should change it after first login.</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(createdCredential.temporaryPassword);
            }}
            className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Manage Users</h3>
          <button
            onClick={() => setShowCreateForm((s) => !s)}
            className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus size={14} /> Create Staff Account
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={createStaffUser} className="p-6 bg-slate-50 border-b border-slate-100 space-y-4">
            <p className="text-xs text-slate-500">
              Creates an account for any of the 5 staff roles (Citizen accounts are self-registered on the public
              sign-up page). A secure one-time password is generated automatically.
            </p>
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                required
                placeholder="Full name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="p-3 border border-slate-200 rounded-xl text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="p-3 border border-slate-200 rounded-xl text-sm"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="p-3 border border-slate-200 rounded-xl text-sm"
              >
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating} className="bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60">
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <div key={u.user_id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{u.full_name}</p>
                  <p className="text-slate-400 text-xs mt-1">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    className="text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border transition ${
                      u.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </button>
                  {u.user_id !== currentUserId && (
                    <button onClick={() => deleteUser(u)} className="text-xs font-bold text-red-500 hover:underline">
                      Delete
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

export default AdminPanel;
