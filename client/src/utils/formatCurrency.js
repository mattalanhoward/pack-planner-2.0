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
  if (symbolOnly) {
    const sym = { USD: "$", EUR: "€", GBP: "£" }[currency] || "";
    const num = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(n);
    return `${sym}${num}`;
  }

  // default: use Intl currency with narrowSymbol where possible
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(n);
}
