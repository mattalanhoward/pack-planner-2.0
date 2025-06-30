// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token);
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem("token");
    }
  }, [token]);

  const verifyEmail = async (token) => {
    const { data } = await api.post("/auth/verify-email", { token });
    setToken(data.token);
    return data;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setToken(null);

  return (
    <AuthContext.Provider
      value={{ login, logout, verifyEmail, loading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}
