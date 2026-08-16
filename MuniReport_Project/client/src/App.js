import React, { useEffect, useState } from 'react';
import './App.css';
import api from './api/client';

import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';

function App() {
  // 'checking' avoids briefly flashing the landing page (or the wrong
  // dashboard) before we've confirmed the session against the server.
  const [view, setView] = useState('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('munireport_token');
    if (!token) {
      setView('landing');
      return;
    }

    // Never trust the cached localStorage user object for which dashboard
    // to render — always re-verify against the server first. The role
    // that matters is the one baked into the signed token, not anything
    // sitting in the browser, so a tampered or stale local value can never
    // put someone in front of the wrong dashboard.
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('munireport_user', JSON.stringify(res.data));
        setView('dashboard');
      })
      .catch(() => {
        localStorage.removeItem('munireport_token');
        localStorage.removeItem('munireport_user');
        setView('landing');
      });
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('munireport_token');
    localStorage.removeItem('munireport_user');
    setUser(null);
    setView('landing');
  };

  if (view === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-semibold text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="App">
      {view === 'landing' && (
        <LandingPage
          onNavigateRegister={() => setView('register')}
          onNavigateLogin={() => setView('login')}
        />
      )}

      {view === 'register' && (
        <Register
          onNavigateLogin={() => setView('login')}
          onNavigateHome={() => setView('landing')}
        />
      )}

      {view === 'login' && (
        <Login
          onNavigateRegister={() => setView('register')}
          onNavigateHome={() => setView('landing')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard
          user={user}
          onNavigateSubmit={() => setView('submit')}
          onLogout={handleLogout}
        />
      )}

      {view === 'submit' && (
        <SubmitComplaint onBack={() => setView('dashboard')} />
      )}
    </div>
  );
}

export default App;
