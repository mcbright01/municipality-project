import React, { useState } from 'react';
import api from '../api/client';
import logo from '../assets/logo.jpeg';

const Login = ({ onNavigateRegister, onNavigateHome, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Persist the signed session token; api/client.js attaches it to
      // every subsequent request automatically.
      localStorage.setItem('munireport_token', token);
      localStorage.setItem('munireport_user', JSON.stringify(user));

      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-600">
        <button onClick={onNavigateHome} className="flex items-center gap-2 mb-6">
          <img src={logo} alt="MuniReport" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-black text-slate-800">MuniReport</span>
        </button>

        <h2 className="text-3xl font-black text-slate-800 mb-2 italic">Sign In</h2>
        <p className="text-slate-400 text-sm mb-8 font-bold uppercase tracking-widest">MuniReport Portal</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase disabled:opacity-60"
          >
            {loading ? 'Signing In…' : 'Login to Dashboard'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account? <span onClick={onNavigateRegister} className="text-blue-600 cursor-pointer font-bold hover:underline">Register here</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
