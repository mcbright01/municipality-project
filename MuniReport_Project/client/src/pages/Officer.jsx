import React from 'react';
import OfficerPanel from '../components/dashboards/OfficerPanel';
import logo from '../assets/logo.jpeg';

const Officer = () => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 mb-8">
      <img src={logo} alt="MuniReport crest" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">Municipal Officer Dashboard</h1>
        <p className="text-xs text-slate-400">Handle reported issues and assignments</p>
      </div>
    </header>

    <main className="max-w-6xl mx-auto p-6">
      <OfficerPanel />
    </main>
  </div>
);

export default Officer;
