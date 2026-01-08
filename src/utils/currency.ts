/**
 * Currency formatting utilities
 * Determines currency based on locale/branch country
 */

import { SupportedLocale } from './geolocation';

/**
 * Get currency code based on locale
 */
export const getCurrencyCode = (locale?: SupportedLocale): string => {
  if (!locale) {
    // Try to get from localStorage or default to SEK
    try {
      const stored = localStorage.getItem('userLocale');
      if (stored) {
        locale = stored as SupportedLocale;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // Map locale to currency
  switch (locale) {
    case 'da-DK':
      return 'DKK';
    case 'sv-SE':
      return 'SEK';
    case 'de-DE':
      return 'EUR';
    case 'no-NO':
      return 'NOK';
    case 'en-US':
      return 'USD';
    default:
      return 'SEK'; // Default fallback
  }
};

/**
 * Format currency amount based on locale
 */
export const formatCurrency = (amount: number, locale?: SupportedLocale): string => {
  const currencyCode = getCurrencyCode(locale);
  const localeCode = locale || 'sv-SE';

  try {
    return new Intl.NumberFormat(localeCode.replace('-', '_'), {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if Intl.NumberFormat fails
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
};

/**
 * Format currency amount without symbol (just number with currency code)
 */
export const formatCurrencyAmount = (amount: number, locale?: SupportedLocale): string => {
  const currencyCode = getCurrencyCode(locale);
  return `${currencyCode} ${amount.toLocaleString()}`;
};


