// src/hooks/useWeightInput.js
import { useCallback, useMemo } from "react";
import { useUserSettings } from "../contexts/UserSettings";
import { formatWeightInputValue, parseWeightLocalized } from "../utils/weight";

export function useWeightInput(unitOverride) {
  const { weightUnit } = useUserSettings();
  const unit = unitOverride || weightUnit;

  const formatInput = useCallback(
    (grams) => formatWeightInputValue(grams, unit),
    [unit]
  );

  const parseInput = useCallback(
    (value) => parseWeightLocalized(value, unit),
    [unit]
  );

  return useMemo(
    () => ({ unitLabel: unit, formatInput, parseInput }),
    [unit, formatInput, parseInput]
  );
}
