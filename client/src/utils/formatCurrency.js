// utils/formatCurrency.js
export function formatEuro(value) {
  if (value === '' || value == null) return '';
  // Convert the raw numeric value to a locale‐aware string with currency
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// If you ever need to parse back from a formatted string “1.234,56 €” to 1234.56,
// you can do something like:
export function parseEuro(formatted) {
  // Remove any non‐digit, non‐comma, non‐dot chars:
  let cleaned = formatted.replace(/[^\d.,-]/g, '');
  // In "de-DE" format, thousand‐separator is ".", decimal is ","
  // So swap "," → "." and remove any "." used for grouping:
  cleaned = cleaned.replace(/\./g, '');
  cleaned = cleaned.replace(',', '.');
  const asNumber = parseFloat(cleaned);
  return isNaN(asNumber) ? '' : asNumber;
}
