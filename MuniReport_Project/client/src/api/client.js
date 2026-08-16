// src/api/client.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the signed session token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('munireport_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the session has expired or been rejected, clear local auth state so
// the app falls back to the login screen instead of showing broken data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('munireport_token');
      localStorage.removeItem('munireport_user');
    }
    return Promise.reject(error);
  }
);

export default api;
