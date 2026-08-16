import React, { useEffect, useState } from 'react';
import './App.css';
import api from './api/client';

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';

function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('munireport_token');
    localStorage.removeItem('munireport_user');
    setUser(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <LandingPage
            onNavigateRegister={() => navigate('/register')}
            onNavigateLogin={() => navigate('/login')}
          />
        )}
      />

      <Route
        path="/register"
        element={(
          <Register
            onNavigateLogin={() => navigate('/login')}
            onNavigateHome={() => navigate('/')}
          />
        )}
      />

      <Route
        path="/login"
        element={(
          <Login
            onNavigateRegister={() => navigate('/register')}
            onNavigateHome={() => navigate('/')}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      />

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} onNavigateSubmit={() => navigate('/submit')} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/submit"
        element={user ? <SubmitComplaint onBack={() => navigate('/dashboard')} /> : <Navigate to="/" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('munireport_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('munireport_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('munireport_token');
        localStorage.removeItem('munireport_user');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-semibold text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
    </BrowserRouter>
  );
}

export default App;
