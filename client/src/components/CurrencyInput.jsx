import React, { useState } from "react";
import { formatEuro, parseEuro } from "../utils/formatCurrency";

export default function CurrencyInput({ value, onChange, label }) {
  // We’ll keep two pieces of state:
  // 1) `display`, which is the string shown in the input (e.g. “1.234,56 €”)
  // 2) We rely on `value` (prop) as the “raw numeric” (e.g. 1234.56)
  const [display, setDisplay] = useState(formatEuro(value));

  // When parent changes `value` (e.g. on reset), update our display:
  React.useEffect(() => {
    setDisplay(formatEuro(value));
  }, [value]);

  // Called on every keystroke:
  const handleChange = (e) => {
    // Always store *exactly* what the user typed, so the cursor doesn’t jump.
    setDisplay(e.target.value);
  };

  // Called when the user “blurs” the input (leaves the field):
  const handleBlur = () => {
    // Parse the displayed string back to a raw number:
    const parsed = parseEuro(display);
    // If invalid, parsed = '' (we’ll pass 0 or empty)
    onChange(parsed);
    // Now re‐format the display using our helper:
    setDisplay(formatEuro(parsed));
  };

  // Called when the user focuses that field (e.g. to begin editing):
  // We want to strip away currency formatting so they can type a raw number:
  const handleFocus = () => {
    // Show only the raw numeric (no thousand separators or “€” suffix).
    if (value !== "" && value != null) {
      setDisplay(value.toString());
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-pine mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
        placeholder="0,00 €"
      />
    </div>
  );
}
