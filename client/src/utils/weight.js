// src/utils/weight.js

// Use a precise constant; avoid drift on round-trips.
const GRAMS_PER_OUNCE = 28.349523125;

// Prefer browser locale at runtime; safe on SSR.
function getBrowserLocale(fallback = "en-US") {
  if (typeof navigator !== "undefined" && navigator.language)
    return navigator.language;
  return fallback;
}

/**
 * Convert grams into a numeric value in the target unit.
 * Kept for back-compat anywhere you used it.
 */
export function convertWeight(grams, unit) {
  switch (unit) {
    case "kg":
      return grams / 1000;
    case "lb":
      return grams / (GRAMS_PER_OUNCE * 16);
    case "oz":
      return grams / GRAMS_PER_OUNCE;
    case "g":
    default:
      return grams;
  }
}

// ---------- Intl helpers ----------
function getSeparators(locale) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((p) => p.type === "decimal")?.value || ".";
  const group = parts.find((p) => p.type === "group")?.value || ",";
  return { decimal, group };
}

// ---------- DISPLAY formatting (tiles, stat details) ----------
// Keeps your auto-switch rules:
//  • g-pref: "357 g" or "1.2 kg"
//  • oz-pref: "<16oz => '12.6 oz'; ≥16oz => '1 lb 2.5 oz'"
export function formatWeightDisplay(
  grams,
  unitPref,
  locale = getBrowserLocale()
) {
  if (grams == null || isNaN(grams)) return "";

  const fmt0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  if (unitPref === "g") {
    if (grams >= 1000) return `${fmt1.format(grams / 1000)} kg`;
    return `${fmt0.format(Math.round(grams))} g`;
  }

  // unitPref === "oz"
  const totalOz = grams / GRAMS_PER_OUNCE;

  if (totalOz >= 16) {
    const lbs = Math.floor(totalOz / 16);
    let oz = totalOz - lbs * 16;
    oz = Math.round(oz * 10) / 10; // one decimal for oz

    // Edge case: 1 lb 16.0 oz -> 2 lb 0 oz
    if (oz >= 16) return `${fmt0.format(lbs + 1)} lb 0 oz`;
    return `${fmt0.format(lbs)} lb ${fmt1.format(oz)} oz`;
  }

  return `${fmt1.format(totalOz)} oz`;
}

// ---------- INPUT formatting (modals) ----------
// Always returns a *plain number string* appropriate for an <input>.
//  • g-pref: integer grams
//  • oz-pref: 1 decimal ounce
export function formatWeightInputValue(
  grams,
  unitPref,
  locale = getBrowserLocale()
) {
  if (grams == null || isNaN(grams)) return "";

  if (unitPref === "g") {
    const v = Math.round(grams);
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
      v
    );
  }

  const oz = Math.round((grams / GRAMS_PER_OUNCE) * 10) / 10;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(oz);
}

// ---------- Locale-aware parsing (modals) ----------
// Accepts "12.6", "12,6", "1,234.5", "1.234,5", with or without unit text.
// Returns integer grams (rounded) or null.
export function parseWeightLocalized(
  input,
  unitPref,
  locale = getBrowserLocale()
) {
  if (input == null) return null;
  let str = String(input).trim();
  if (str === "") return null;

  // Normalize whitespace (incl NBSP)
  str = str.replace(/\s|\u00A0/g, "");

  const { decimal: decSep, group: grpSep } = getSeparators(locale);

  const hasComma = str.includes(",");
  const hasDot = str.includes(".");

  if (hasComma && hasDot) {
    // Heuristic: whichever appears last is the decimal; strip the other as grouping
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    const decimalIsComma = lastComma > lastDot;
    const decChar = decimalIsComma ? "," : ".";
    const grpChar = decimalIsComma ? "." : ",";
    str = str.split(grpChar).join(""); // remove grouping
    str = str.replace(decChar, "."); // unify decimal to '.'
  } else {
    // Single style input: remove locale group char, replace locale decimal with '.'
    if (grpSep && grpSep !== decSep) str = str.split(grpSep).join("");
    if (decSep !== ".") str = str.replace(decSep, ".");
  }

  // Remove stray letters/symbols (like "oz", "g")
  str = str.replace(/[^\d.+-]/g, "");

  const v = Number.parseFloat(str);
  if (Number.isNaN(v)) return null;

  const grams = unitPref === "g" ? v : v * GRAMS_PER_OUNCE;

  // Store integer grams for stability
  return Math.round(grams);
}

// ---------- Back-compat shim ----------
// You already call formatWeight(rawGrams, unit) from useWeight().
// Keep that name as an alias to the *display* formatter.
export function formatWeight(grams, unitPref, locale = getBrowserLocale()) {
  return formatWeightDisplay(grams, unitPref, locale);
}

// -------- Heuristic extraction (title/description) --------
// Finds weights like: "200 g", "0.2 kg", "7 oz", "1 lb 4 oz", "1lb 4oz", "2lbs"
// Returns integer grams or null (if not found).
export function extractWeightGrams(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.toLowerCase();

  const toNum = (x) => {
    const n = Number(String(x).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  // 1) Compound pounds + ounces: "1 lb 4 oz", "1lb 4oz"
  {
    const re =
      /(\d+(?:[\.,]\d+)?)\s*(?:lb|lbs|pounds?)\s*(\d+(?:[\.,]\d+)?)\s*(?:oz|ounces?)/i;
    const m = s.match(re);
    if (m) {
      const lb = toNum(m[1]);
      const oz = toNum(m[2]);
      if (lb != null && oz != null) {
        return Math.round(lb * (GRAMS_PER_OUNCE * 16) + oz * GRAMS_PER_OUNCE);
      }
    }
  }

  // 2) Kilograms: "0.23 kg"
  {
    const re = /(\d+(?:[\.,]\d+)?)\s*(?:kg|kilograms?)/i;
    const m = s.match(re);
    if (m) {
      const kg = toNum(m[1]);
      if (kg != null) return Math.round(kg * 1000);
    }
  }

  // 3) Grams: "230 g"
  {
    const re = /(\d+(?:[\.,]\d+)?)\s*(?:g|grams?)/i;
    const m = s.match(re);
    if (m) {
      const g = toNum(m[1]);
      if (g != null) return Math.round(g);
    }
  }

  // 4) Pounds only: "1.5 lb"
  {
    const re = /(\d+(?:[\.,]\d+)?)\s*(?:lb|lbs|pounds?)/i;
    const m = s.match(re);
    if (m) {
      const lb = toNum(m[1]);
      if (lb != null) return Math.round(lb * (GRAMS_PER_OUNCE * 16));
    }
  }

  // 5) Ounces only: "7 oz"
  {
    const re = /(\d+(?:[\.,]\d+)?)\s*(?:oz|ounces?)/i;
    const m = s.match(re);
    if (m) {
      const oz = toNum(m[1]);
      if (oz != null) return Math.round(oz * GRAMS_PER_OUNCE);
    }
  }

  return null;
}
