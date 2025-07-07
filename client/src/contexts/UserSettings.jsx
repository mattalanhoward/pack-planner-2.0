// src/contexts/UserSettings.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const SettingsCtx = createContext();
const altTheme = "desert";

export function SettingsProvider({ children }) {
  const [weightUnit, setWeightUnit] = useState("g"); // default to grams
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "desert"
  );

  // whenever theme changes, write to <html> and to localStorage
  useEffect(() => {
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
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Optional: persist theme to server whenever it changes
  useEffect(() => {
    async function save() {
      try {
        await api.patch("/settings", { theme });
      } catch (err) {
        console.error("Could not save theme setting", err);
      }
    }
    save();
  }, [theme]);

  return (
    <SettingsCtx.Provider
      value={{ weightUnit, setWeightUnit, theme, setTheme, altTheme }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}
export const useUserSettings = () => useContext(SettingsCtx);
