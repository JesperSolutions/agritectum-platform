/**
 * Currency Utilities
 * Handles currency detection based on browser locale and location
 */

export type Currency = 'SEK' | 'DKK' | 'EUR' | 'USD' | 'GBP' | 'NOK';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * Currency information mapping
 */
export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
};

/**
 * Maps locale strings to currency codes
 */
const LOCALE_TO_CURRENCY: Record<string, Currency> = {
  // Swedish locales
  'sv-SE': 'SEK',
  'sv-FI': 'SEK',
  'sv': 'SEK',
  // Danish locales
  'da-DK': 'DKK',
  'da': 'DKK',
  // German locales
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'de-CH': 'EUR',
  'de': 'EUR',
  // English locales
  'en-US': 'USD',
  'en-CA': 'USD',
  'en-GB': 'GBP',
  'en-AU': 'USD',
  'en': 'USD',
  // Norwegian
  'nb-NO': 'NOK',
  'nn-NO': 'NOK',
  'no': 'NOK',
};

/**
 * Detect currency from browser locale
 */
export const detectCurrencyFromLocale = (locale?: string): Currency => {
  if (!locale) {
    // Try to get from browser
    locale = navigator.language || navigator.languages?.[0] || 'en-US';
  }

  // Normalize locale (e.g., 'sv-SE' or 'sv_SE')
  const normalizedLocale = locale.replace('_', '-');

  // Try exact match first
  if (LOCALE_TO_CURRENCY[normalizedLocale]) {
    return LOCALE_TO_CURRENCY[normalizedLocale];
  }

  // Try language code only (e.g., 'sv' from 'sv-SE')
  const languageCode = normalizedLocale.split('-')[0];
  if (LOCALE_TO_CURRENCY[languageCode]) {
    return LOCALE_TO_CURRENCY[languageCode];
  }

  // Default fallback
  return 'SEK';
};

/**
 * Get currency info by code
 */
export const getCurrencyInfo = (currency: Currency): CurrencyInfo => {
  return CURRENCIES[currency];
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCIES[currency]?.symbol || currency;
};

/**
 * Format amount with currency
 */
export const formatCurrencyAmount = (
  amount: number,
  currency: Currency,
  locale?: string
): string => {
  const currencyInfo = getCurrencyInfo(currency);
  const displayLocale = locale || currencyInfo.locale || 'sv-SE';

  try {
    return new Intl.NumberFormat(displayLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${amount.toLocaleString()} ${currency}`;
  }
};

/**
 * Get stored currency preference or detect from locale
 */
export const getCurrencyPreference = (): Currency => {
  // Check localStorage first
  const stored = localStorage.getItem('currencyPreference');
  if (stored && Object.keys(CURRENCIES).includes(stored)) {
    return stored as Currency;
  }

  // Detect from browser locale
  return detectCurrencyFromLocale();
};

/**
 * Store currency preference
 */
export const setCurrencyPreference = (currency: Currency): void => {
  localStorage.setItem('currencyPreference', currency);
};

