// src/hooks/useWeight.js
import { useUnit } from "./useUnit";
import { formatWeight } from "../utils/weight";

export function useWeight(rawGrams) {
  const unit = useUnit();
  if (rawGrams == null) return "";
  return formatWeight(rawGrams, unit);
}
