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
