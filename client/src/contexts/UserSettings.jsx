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
    () => localStorage.getItem("region") || "US"
  );
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("viewMode") || "column"
  );

  // ─── derive a single locale code, e.g. "en-US" ────────────
  //    (we uppercase the region to match BCP-47 syntax)
  const locale = `${language}-${region.toUpperCase()}`;

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

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  // ─── persist everything to server in one shot ─────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const payload = {
      weightUnit,
      theme,
      currency,
      language,
      region,
      viewMode,
      locale,
    };
    api
      .patch("/settings", payload)
      .catch((err) => console.error("Failed to save settings:", err));
  }, [weightUnit, theme, currency, language, region, viewMode]);

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
        locale,
        viewMode,
        setViewMode,
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
