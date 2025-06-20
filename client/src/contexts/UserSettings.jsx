// src/contexts/UserSettings.jsx
import React, { createContext, useContext, useState } from "react";

const SettingsCtx = createContext();
export function SettingsProvider({ children }) {
  const [weightUnit, setWeightUnit] = useState("g"); // default to grams
  return (
    <SettingsCtx.Provider value={{ weightUnit, setWeightUnit }}>
      {children}
    </SettingsCtx.Provider>
  );
}
export const useUserSettings = () => useContext(SettingsCtx);
