/**
 * Currency formatting utilities
 * Determines currency based on user preference, locale/branch country
 */

import { SupportedLocale } from './geolocation';

/**
 * Get stored user currency preference from localStorage
 */
const getStoredCurrency = (): string | null => {
  try {
    return localStorage.getItem('userCurrency');
  } catch {
    return null;
  }
};

/**
 * Store user currency preference in localStorage
 */
export const storeCurrency = (currency: string): void => {
  try {
    localStorage.setItem('userCurrency', currency);
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Get currency code based on user preference, then locale/branch country
 */
export const getCurrencyCode = (locale?: SupportedLocale, overrideStoredCurrency?: string): string => {
  // First, check if there's a stored currency preference (manually set by user)
  const storedCurrency = overrideStoredCurrency || getStoredCurrency();
  if (storedCurrency) {
    if (import.meta.env.DEV) {
      console.log('[getCurrencyCode] Using stored currency:', storedCurrency);
    }
    return storedCurrency;
  }

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

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[getCurrencyCode] Input locale:', locale, 'Type:', typeof locale);
  }

  // Map locale to currency
  const currency = (() => {
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
        if (import.meta.env.DEV) {
          console.warn('[getCurrencyCode] Unknown locale, defaulting to SEK:', locale);
        }
        return 'SEK'; // Default fallback
    }
  })();

  if (import.meta.env.DEV) {
    console.log('[getCurrencyCode] Returning currency:', currency);
  }

  return currency;
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

/**
 * Get phone country code based on locale
 * Returns the 2-letter ISO country code for the phone input library
 */
export const getPhoneCountryCode = (locale?: SupportedLocale): string => {
  // First check localStorage for explicit override
  try {
    const stored = localStorage.getItem('phoneCountryCode');
    if (stored) {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }

  if (!locale) {
    try {
      const stored = localStorage.getItem('userLocale');
      if (stored) {
        locale = stored as SupportedLocale;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // Map locale to phone country code
  switch (locale) {
    case 'da-DK':
      return 'dk';
    case 'sv-SE':
      return 'se';
    case 'de-DE':
      return 'de';
    case 'no-NO':
      return 'no';
    case 'en-US':
      return 'us';
    default:
      return 'se'; // Default to Sweden
  }
};

/**
 * Store phone country code preference
 */
export const storePhoneCountryCode = (countryCode: string): void => {
  try {
    localStorage.setItem('phoneCountryCode', countryCode.toLowerCase());
  } catch {
    // Ignore localStorage errors
  }
};


