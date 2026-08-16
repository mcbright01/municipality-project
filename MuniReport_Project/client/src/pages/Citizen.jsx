import React from 'react';
import CitizenPanel from '../components/dashboards/CitizenPanel';
import logo from '../assets/logo.jpeg';

const Citizen = ({ onNavigateSubmit }) => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 mb-8">
      <img src={logo} alt="MuniReport crest" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">Citizen Dashboard</h1>
        <p className="text-xs text-slate-400">Submit and track complaints</p>
      </div>
    </header>

    <main className="max-w-6xl mx-auto p-6">
      <CitizenPanel onNavigateSubmit={onNavigateSubmit} />
    </main>
  </div>
);

export default Citizen;
