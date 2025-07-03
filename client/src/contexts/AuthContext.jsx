import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (token) {
      // only persist; the interceptor in api.js will attach the header
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  const verifyEmail = async (tok) => {
    const { data } = await api.post("/auth/verify-email", { token: tok });
    setToken(data.accessToken);
    return data;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.accessToken);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, verifyEmail, loading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}
