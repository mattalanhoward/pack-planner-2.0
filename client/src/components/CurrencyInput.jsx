// client/src/components/CurrencyInput.jsx
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * Currency-aware input with "raw on focus, formatted on blur" UX.
 * - value: number | "" (controlled by parent)
 * - onChange: (number | "") => void  (fires on blur)
 * - currency: ISO code e.g. "EUR" | "USD" | "GBP"
 * - locale: BCP47 e.g. "en-US" | "nl-NL" | "en-GB"
 */
export default function CurrencyInput({
  value,
  onChange,
  locale = "en-US",
  label,
  placeholder = "0.00",
  className = "mt-0.5 block w-full border border-primary rounded px-2 py-1 text-primary text-sm",
  "aria-label": ariaLabel = "Price",
  readOnly = false,
  onFocus,
  ...rest
}) {
  const [display, setDisplay] = useState(value ?? "");
  const [focused, setFocused] = useState(false);

  // decimal separator for the current locale (used for nicer placeholder)
  const decimalSymbol = useMemo(() => {
    const p = new Intl.NumberFormat(locale).format(1.1);
    return p.includes(",") ? "," : ".";
  }, [locale]);

  // helper: number-only formatting (no currency symbol)
  const formatNumberOnly = (n) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n));

  // keep local text in sync when external value changes
  useEffect(() => {
    if (value === "" || value == null) {
      setDisplay("");
      return;
    }
    // If not focused, show formatted number; if focused, show raw for editing
    setDisplay(focused ? String(value) : formatNumberOnly(value));
  }, [value, focused, locale]);

  // Robust-ish parse for user-typed strings across locales
  function parseToNumber(raw) {
    if (raw == null || raw === "") return "";
    const s = String(raw)
      .trim()
      .replace(/\s/g, "")
      // remove currency symbols and letters
      .replace(/[^\d,.\-]/g, "");

    // Heuristic: if both separators exist, assume last one is decimal
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    let normalized = s;

    if (lastComma !== -1 && lastDot !== -1) {
      if (lastComma > lastDot) {
        // comma as decimal, strip dots
        normalized = s.replace(/\./g, "").replace(",", ".");
      } else {
        // dot as decimal, strip commas
        normalized = s.replace(/,/g, "");
      }
    } else if (lastComma !== -1) {
      // only comma present -> treat as decimal
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      // only dot or none -> dots fine as decimal, remove any stray commas
      normalized = s.replace(/,/g, "");
    }

    const n = Number(normalized);
    return Number.isNaN(n) ? "" : n;
  }

  const handleChange = (e) => {
    setDisplay(e.target.value);
  };

  const handleFocus = () => {
    // When locked, keep formatted display; do not switch to raw
    if (readOnly) return;
    setFocused(true);
    // Show raw numeric (so cursor behavior is predictable for editing)
    if (value !== "" && value != null) {
      setDisplay(String(value));
    }
  };

  const handleBlur = () => {
    if (readOnly) return; // don't mutate/display on blur if field is locked
    const parsed = parseToNumber(display);
    onChange?.(parsed);
    setFocused(false); // effect above will format once parent value updates
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-primary mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => {
          // allow parent to show a popup (e.g., locked field info)
          onFocus?.(e);
          handleFocus();
        }}
        className={className}
        aria-label={ariaLabel}
        placeholder={`0${decimalSymbol}00`}
        readOnly={readOnly}
        {...rest}
      />
    </div>
  );
}
