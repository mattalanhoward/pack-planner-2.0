// src/contexts/UserSettings.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const SettingsCtx = createContext();

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // ─── client‐side state ─────────────────────────────────────
  const [weightUnit, setWeightUnit] = useState(
    () => localStorage.getItem("weightUnit") || "g"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "desert"
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("currency") || "€"
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || "en"
  );
  const [region, setRegion] = useState(
    () => localStorage.getItem("region") || "eu"
  );

  // ─── mirror to localStorage & apply DOM side‐effects ───────
  useEffect(() => {
    localStorage.setItem("weightUnit", weightUnit);
  }, [weightUnit]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("region", region);
  }, [region]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.classList.remove(
      "theme-forest",
      "theme-desert",
      "theme-alpine",
      "theme-snow",
      "theme-ocean",
      "theme-dark",
      "theme-light"
    );
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // ─── persist everything to server in one shot ─────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const payload = { weightUnit, theme, currency, language, region };
    api
      .patch("/settings", payload)
      .catch((err) => console.error("Failed to save settings:", err));
  }, [weightUnit, theme, currency, language, region]);

  return (
    <SettingsCtx.Provider
      value={{
        weightUnit,
        setWeightUnit,
        theme,
        setTheme,
        currency,
        setCurrency,
        language,
        setLanguage,
        region,
        setRegion,
      }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}

export const useUserSettings = () => {
  const ctx = useContext(SettingsCtx);
  if (!ctx) {
    throw new Error("useUserSettings must be used inside a SettingsProvider");
  }
  return ctx;
};
