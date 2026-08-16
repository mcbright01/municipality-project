import React, { useState } from 'react';
import { LayoutDashboard, User, LogOut } from 'lucide-react';
import CitizenPanel from '../components/dashboards/CitizenPanel';
import OfficerPanel from '../components/dashboards/OfficerPanel';
import InspectorPanel from '../components/dashboards/InspectorPanel';
import SupervisorPanel from '../components/dashboards/SupervisorPanel';
import AnalystPanel from '../components/dashboards/AnalystPanel';
import AdminPanel from '../components/dashboards/AdminPanel';
import ProfilePanel from '../components/dashboards/ProfilePanel';
import logo from '../assets/logo.jpeg';

const roleAccent = {
  Citizen: 'bg-blue-600',
  'Municipal Officer': 'bg-teal-600',
  'Field Inspector': 'bg-purple-600',
  Supervisor: 'bg-amber-600',
  'Data Analyst': 'bg-indigo-600',
  Admin: 'bg-slate-700',
};

const Dashboard = ({ user, onNavigateSubmit, onLogout }) => {
  const { name: userName = '', role: userRole = 'Citizen', id: userId } = user || {};
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'profile' — this is real, working navigation

  const renderPanel = () => {
    if (page === 'profile') {
      return <ProfilePanel user={user} />;
    }
    switch (userRole) {
      case 'Municipal Officer':
        return <OfficerPanel />;
      case 'Field Inspector':
        return <InspectorPanel />;
      case 'Supervisor':
        return <SupervisorPanel />;
      case 'Data Analyst':
        return <AnalystPanel />;
      case 'Admin':
        return <AdminPanel currentUserId={userId} />;
      case 'Citizen':
      default:
        return <CitizenPanel onNavigateSubmit={onNavigateSubmit} />;
    }
  };

  const navItemClass = (active) =>
    `flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition ${
      active ? `${roleAccent[userRole] || 'bg-blue-600'} text-white shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-2xl font-bold tracking-tight border-b border-slate-800 flex items-center gap-3">
          <img src={logo} alt="MuniReport crest" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20" />
          MuniReport
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest px-2">Main Menu</div>
          <button onClick={() => setPage('dashboard')} className={navItemClass(page === 'dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setPage('profile')} className={navItemClass(page === 'profile')}>
            <User size={20} /> My Profile
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-3 text-sm text-red-400 hover:text-red-300 transition font-semibold"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col">

        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MuniReport crest" className="w-9 h-9 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {page === 'profile' ? 'My Profile' : `${userRole} Dashboard`}
              </h2>
              <p className="text-xs text-slate-400">Welcome back to the municipal portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{userRole}</p>
            </div>
            <button
              onClick={() => setPage('profile')}
              className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 hover:bg-slate-300 transition"
              title="My Profile"
            >
              {userName.charAt(0)}
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
