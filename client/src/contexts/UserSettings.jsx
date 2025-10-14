import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const SettingsCtx = createContext();

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // ─── local state (init from localStorage for instant paint) ───
  const [weightUnit, setWeightUnit] = useState(
    () => localStorage.getItem("weightUnit") || "g"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "desert"
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("currency") || "EUR"
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || "en"
  );
  const [region, setRegion] = useState(() =>
    (localStorage.getItem("region") || "nl").toLowerCase()
  );
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("viewMode") || "column"
  );

  // Track if we've hydrated from the server to avoid echo PATCH
  const [hydrated, setHydrated] = useState(false);

  // Derived BCP-47 locale (always language-REGION)
  const locale = `${language}-${region.toUpperCase()}`;

  // One-time normalization for legacy symbol-based currency
  useEffect(() => {
    const map = { "€": "EUR", $: "USD", "£": "GBP" };
    if (map[currency]) setCurrency(map[currency]);
  }, []); // eslint-disable-line

  // ─── DOM side effects (theme) + mirror to localStorage ───
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
    const lc = (region || "").toLowerCase();
    if (lc !== region) setRegion(lc); // normalize
    localStorage.setItem("region", lc);
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

  // ─── HYDRATE from server on mount/login ───
  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/settings");
      const s = res.data || {};
      // Apply with sensible fallbacks + normalization
      setWeightUnit(s.weightUnit || "g");
      setTheme(s.theme || "desert");
      setCurrency(s.currency || "EUR");
      setLanguage(s.language || "en");
      setRegion((s.region || "nl").toLowerCase());
      setViewMode(s.viewMode || "column");
      setHydrated(true);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setHydrated(true); // don’t block PATCHs forever
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // ─── Persist to server whenever user changes a value ───
  useEffect(() => {
    if (!isAuthenticated || !hydrated) return; // ← prevent echo on initial hydrate
    const payload = {
      weightUnit,
      theme,
      currency,
      language,
      region: (region || "nl").toLowerCase(),
      viewMode,
      locale, // derived
    };
    api.patch("/settings", payload).catch((err) => {
      console.error("Failed to save settings:", err);
    });
  }, [
    isAuthenticated,
    hydrated,
    weightUnit,
    theme,
    currency,
    language,
    region,
    viewMode,
    locale,
  ]);

  // Optional helpers for screens that PATCH explicitly:
  const applySettings = useCallback((partial) => {
    if (partial.weightUnit != null) setWeightUnit(partial.weightUnit);
    if (partial.theme != null) setTheme(partial.theme);
    if (partial.currency != null) setCurrency(partial.currency);
    if (partial.language != null) setLanguage(partial.language);
    if (partial.region != null) setRegion(String(partial.region).toLowerCase());
    if (partial.viewMode != null) setViewMode(partial.viewMode);
  }, []);

  return (
    <SettingsCtx.Provider
      value={{
        // values
        weightUnit,
        theme,
        currency,
        language,
        region,
        locale,
        viewMode,
        hydrated,
        // setters
        setWeightUnit,
        setTheme,
        setCurrency,
        setLanguage,
        setRegion,
        setViewMode,
        // helpers
        refreshSettings,
        applySettings,
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
