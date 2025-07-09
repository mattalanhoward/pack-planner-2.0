// src/hooks/useUnit.js
import { useUserSettings } from "../contexts/UserSettings";

export function useUnit() {
  const { weightUnit } = useUserSettings(); // e.g. "g", "kg", "lb", "oz", or "auto" :contentReference[oaicite:2]{index=2}
  return weightUnit;
}
