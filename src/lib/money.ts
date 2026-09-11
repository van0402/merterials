export const CURRENCY_SYMBOLS: Record<string, string> = {
  VND: '₫',
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
  BGN: 'лв.',
  CAD: 'CA$',
  AUD: 'A$',
};

export function currencySymbolFor(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

export function formatMinorUnits(amount: number, currency = 'VND'): string {
  const normalizedCurrency = currency.toUpperCase();
  const divisor = normalizedCurrency === 'VND' ? 1 : 100;
  const fractionDigits = normalizedCurrency === 'VND' ? 0 : 2;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount / divisor);
}

export function formatCurrencyAmount(amount: number, currency = 'VND'): string {
  const normalizedCurrency = currency.toUpperCase();
  const fractionDigits = normalizedCurrency === 'VND' ? 0 : 2;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
