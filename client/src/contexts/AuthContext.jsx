import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  // Helper to log in
  const login = async (email, password) => {
    setLoading(true);
    const resp = await api.post('/auth/login', { email, password });
    const jwt = resp.data.token;
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // Expose whether the user is “authenticated”
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
