export function formatCurrency(
  value,
  {
    currency = "EUR",
    locale = "en-US",
    minimumFractionDigits = 2,
    symbolOnly = false,
  } = {}
) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";

  // Extended explicit symbols for fallback or symbolOnly mode
  const SYMBOLS = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    SEK: "kr",
  };

  if (symbolOnly) {
    const sym = SYMBOLS[currency] || "";
    const num = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(n);
    return `${sym}${num}`;
  }

  // Try Intl first
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(n);

    // If Intl already includes any symbol/letter, trust it.
    if (/[^\d\s.,-]/.test(formatted)) return formatted;

    // Fallback: attach explicit symbol if Intl gave a bare number
    const sym = SYMBOLS[currency] || currency;
    return `${sym}\u00A0${n.toFixed(2)}`;
  } catch {
    // Hard fallback
    const sym = SYMBOLS[currency] || currency;
    return `${sym}\u00A0${n.toFixed(2)}`;
  }
}
