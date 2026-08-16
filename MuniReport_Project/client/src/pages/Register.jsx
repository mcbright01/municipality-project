import React, { useEffect, useState } from 'react';
import api from '../api/client';
import logo from '../assets/logo.jpeg';

const Register = ({ onNavigateLogin, onNavigateHome }) => {
  const [provinces, setProvinces] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    province: '',
    postalAddress: '',
    municipality: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/provinces')
      .then((res) => {
        setProvinces(res.data);
        setFormData((f) => ({ ...f, province: res.data[0] || '' }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'Citizen',
        city: formData.city,
        province: formData.province,
        postalAddress: formData.postalAddress,
        municipality: formData.municipality,
      });
      alert('Registration successful! You can now log in.');
      onNavigateLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Error registering. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-lg border-t-8 border-blue-600">
        <button onClick={onNavigateHome} className="flex items-center gap-2 mb-6 mx-auto">
          <img src={logo} alt="MuniReport" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-black text-slate-800">MuniReport</span>
        </button>

        <h2 className="text-3xl font-black text-slate-800 mb-2 italic text-center">Join MuniReport</h2>
        <p className="text-slate-400 text-sm mb-8 text-center font-bold uppercase tracking-widest">Create your citizen account</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Full Name</label>
              <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Lerato Mokoena" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Email</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="lerato@email.com" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Password</label>
            <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required minLength={8} />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Confirm Password</label>
            <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required minLength={8} />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Where you're reporting from</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">City / Town</label>
              <input name="city" value={formData.city} onChange={handleChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sasolburg" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Province</label>
              <select name="province" value={formData.province} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Municipality</label>
            <input name="municipality" value={formData.municipality} onChange={handleChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Metsimaholo Local Municipality" required />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Postal Address (P.O. Box)</label>
            <input name="postalAddress" value={formData.postalAddress} onChange={handleChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="P.O. Box 123, Sasolburg, 1947" required />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-medium">
            Public sign-up creates a <strong>Citizen</strong> account for reporting issues. Municipal staff
            accounts (Officer, Inspector, Supervisor, Analyst, Admin) are created by an administrator — if
            that's what you're looking for, ask your Admin to set one up for you instead of registering here.
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95 uppercase mt-2 disabled:opacity-60">
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already a member? <span onClick={onNavigateLogin} className="text-blue-600 cursor-pointer font-bold hover:underline">Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
