import React from 'react';
import {
  FileText, MapPin, UserCheck, Search, BarChart3, ShieldCheck,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import logo from '../assets/logo.jpeg';
import roadsImg from '../assets/roads.jpg';
import wasteImg from '../assets/waste.jpg';
import utilitiesImg from '../assets/utilities.jpg';
import safetyImg from '../assets/safety.png';

const roles = [
  'Citizen', 'Municipal Officer', 'Field Inspector', 'Supervisor', 'Data Analyst', 'Admin',
];

const categories = [
  { name: 'Roads & Potholes', img: roadsImg, desc: 'Damaged surfaces, potholes, and unsafe road conditions.' },
  { name: 'Waste Management', img: wasteImg, desc: 'Missed collections, illegal dumping, and overflowing bins.' },
  { name: 'Water & Utilities', img: utilitiesImg, desc: 'Leaks, outages, and sanitation or electricity failures.' },
];

const LandingPage = ({ onNavigateRegister, onNavigateLogin }) => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <img src={logo} alt="MuniReport crest" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-blue-600/20 flex-shrink-0" />
            <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 truncate">MuniReport</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 flex-shrink-0">
            <a href="#how-it-works" className="hover:text-blue-600 transition">How it works</a>
            <a href="#categories" className="hover:text-blue-600 transition">Report Categories</a>
            <a href="#roles" className="hover:text-blue-600 transition">Who it's for</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <button
              onClick={onNavigateLogin}
              className="whitespace-nowrap text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition px-2 sm:px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateRegister}
              className="whitespace-nowrap bg-blue-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <span className="sm:hidden">Report</span>
              <span className="hidden sm:inline">Report an Issue</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-200">
            Built for South African municipalities
          </span>
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight">
            Every pothole, leak, and missed collection — on the record.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
            MuniReport gives citizens a direct line to their municipality, and gives staff a
            transparent, role-based workflow to resolve service delivery issues instead of
            losing them in a paper register.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all active:scale-95"
            >
              Report an Issue <ArrowRight size={18} />
            </button>
            <button
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl hover:bg-slate-50 transition-all"
            >
              Staff Sign In
            </button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" /> Unique reference number per report</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" /> Full audit trail</div>
          </div>
        </div>

        <div className="relative pb-8 sm:pb-0">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-100">
            <img src={roadsImg} alt="Pothole reported through MuniReport" className="w-full h-[280px] sm:h-[420px] object-cover" />
          </div>
          {/* Signature element: a live-looking complaint receipt card */}
          <div className="absolute bottom-0 left-3 right-3 sm:left-auto sm:right-auto sm:-bottom-8 sm:-left-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 sm:p-5 sm:w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>
            </div>
            <p className="font-mono font-bold text-slate-900 text-lg">MUNI-48213</p>
            <p className="text-xs text-slate-500 mt-1">Pothole — Jan van Riebeeck St</p>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="max-w-7xl mx-auto py-16 px-6 border-t border-slate-100">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">How MuniReport Works</h2>
          <p className="mt-4 text-xl text-slate-600">
            A complete digital solution for municipal service delivery management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<FileText className="w-10 h-10 text-blue-600" />} title="Submit Complaints" desc="Report service failures with photos, a location, and detailed descriptions." />
          <FeatureCard icon={<MapPin className="w-10 h-10 text-blue-600" />} title="Track Progress" desc="Monitor your complaint status in real time with a unique reference number." />
          <FeatureCard icon={<UserCheck className="w-10 h-10 text-blue-600" />} title="Role-Based Access" desc="Six distinct user roles ensure the right people handle the right tasks." />
          <FeatureCard icon={<Search className="w-10 h-10 text-blue-600" />} title="Inspect & Resolve" desc="Field inspectors visit sites and submit formal reports for resolution." />
          <FeatureCard icon={<BarChart3 className="w-10 h-10 text-blue-600" />} title="Data Analytics" desc="Generate statistical reports and identify complaint trends by area." />
          <FeatureCard icon={<ShieldCheck className="w-10 h-10 text-blue-600" />} title="Full Accountability" desc="A complete audit trail tracks every action with timestamps and user IDs." />
        </div>
      </section>

      {/* --- REPORT CATEGORIES --- */}
      <section id="categories" className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto py-16 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">What You Can Report</h2>
            <p className="mt-4 text-xl text-slate-600">The issues municipal teams see most often.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((c) => (
              <div key={c.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                <img src={c.img} alt={c.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                  <p className="text-slate-600 text-sm mt-2">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ROLES --- */}
      <section id="roles" className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Six roles, one platform</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              From the citizen who reports a problem to the analyst who spots the trend behind it,
              every person in the resolution chain works from the same record — with access limited
              to what their role needs.
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            <img src={safetyImg} alt="Municipal field team on site" className="w-full h-80 object-cover" />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MuniReport crest" className="w-9 h-9 rounded-full object-cover" />
            <span className="font-black text-white">MuniReport</span>
          </div>
          <p className="text-sm text-slate-400">Municipal Waste &amp; Complaint Reporting System</p>
          <a href="mailto:support@olums.org" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition">
            support@olums.org
          </a>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-lg transition duration-300">
    <div className="flex-shrink-0 mt-1">{icon}</div>
    <div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 mt-2">{desc}</p>
    </div>
  </div>
);

export default LandingPage;
