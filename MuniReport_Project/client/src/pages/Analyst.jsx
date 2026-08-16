import React from 'react';
import AnalystPanel from '../components/dashboards/AnalystPanel';
import logo from '../assets/logo.jpeg';

const Analyst = () => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 mb-8">
      <img src={logo} alt="MuniReport crest" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">Data Analyst Dashboard</h1>
        <p className="text-xs text-slate-400">Explore reports and analytics</p>
      </div>
    </header>

    <main className="max-w-6xl mx-auto p-6">
      <AnalystPanel />
    </main>
  </div>
);

export default Analyst;
