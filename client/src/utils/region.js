// client/src/utils/region.js
/**
 * Best-effort region detection:
 * 1) Explicit app setting if you have one (pass as arg)
 * 2) Browser locale region subtag (e.g., "en-GB" -> "GB")
 * 3) Language-to-locale hints
 * 4) Fallback "GB"
 */
export function detectRegion(preferredRegion) {
  if (preferredRegion && /^[A-Z]{2}$/.test(preferredRegion))
    return preferredRegion;

  // Try browser locale
  const loc = (
    Intl.DateTimeFormat().resolvedOptions().locale || ""
  ).toUpperCase();

  const m = loc.match(/-([A-Z]{2})/);
  if (m) return m[1];

  // Fall back by language (very rough defaults)
  const lang = (navigator.language || "en-GB").slice(0, 2).toLowerCase();
  const langMap = {
    en: "GB",
    de: "DE",
    nl: "NL",
    fr: "FR",
    es: "ES",
    it: "IT",
    sv: "SE",
    no: "NO",
    da: "DK",
    fi: "FI",
    pl: "PL",
    pt: "PT",
  };
  return langMap[lang] || "GB";
}

/**
 * Map a normalized ISO-2 region code to a display currency.
 * Keep this intentionally small and opinionated for your current focus (US/EU).
 * Default fallback: EUR (safer for your current EU-first audience).
 */
export function currencyForRegion(region) {
  if (!region) return "EUR";
  const r = String(region).toUpperCase();
  // Direct mappings first
  const MAP = {
    US: "USD",
    GB: "GBP",
    UK: "GBP", // just in case
    CA: "CAD",
    AU: "AUD",
    CH: "CHF",
  };
  if (MAP[r]) return MAP[r];
  // Broad EU (most EU countries → EUR)
  const EUR_SET = new Set([
    "NL",
    "DE",
    "FR",
    "IT",
    "ES",
    "PT",
    "BE",
    "AT",
    "IE",
    "FI",
    "EE",
    "LV",
    "LT",
    "LU",
    "MT",
    "SI",
    "SK",
    "CY",
    "GR",
  ]);
  if (EUR_SET.has(r)) return "EUR";
  // Default fallback
  return "EUR";
}

// Map messy labels to ISO alpha-2 we use everywhere
export function normalizeRegion(code) {
  const k = String(code || "")
    .trim()
    .toUpperCase();
  const map = {
    USA: "US",
    UNITED_STATES: "US",
    US: "US",
    CDN: "CA",
    CANADA: "CA",
    CA: "CA",
    UK: "GB",
    GB: "GB",
  };
  // For normalization we do NOT want to silently pick "GB" for unknown.
  // If it's not in the map and not already a 2-letter code, return empty string.
  return map[k] || (/^[A-Z]{2}$/.test(k) ? k : "");
}
