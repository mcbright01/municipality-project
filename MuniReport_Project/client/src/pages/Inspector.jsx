import React from 'react';
import InspectorPanel from '../components/dashboards/InspectorPanel';
import logo from '../assets/logo.jpeg';

const Inspector = () => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 mb-8">
      <img src={logo} alt="MuniReport crest" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">Field Inspector Dashboard</h1>
        <p className="text-xs text-slate-400">Manage inspections and field tasks</p>
      </div>
    </header>

    <main className="max-w-6xl mx-auto p-6">
      <InspectorPanel />
    </main>
  </div>
);

export default Inspector;
