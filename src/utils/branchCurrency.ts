/**
 * Branch Currency Utilities
 * Handles currency determination based on branch configuration and country
 */

import { SupportedLocale } from './geolocation';

/**
 * Map country codes/names to currency codes
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Country names
  Denmark: 'DKK',
  Sweden: 'SEK',
  Norway: 'NOK',
  Germany: 'EUR',
  USA: 'USD',
  Canada: 'CAD',
  'United Kingdom': 'GBP',
  Finland: 'EUR',
  Netherlands: 'EUR',
  Belgium: 'EUR',
  Austria: 'EUR',
  Switzerland: 'CHF',
  France: 'EUR',
  Italy: 'EUR',
  Spain: 'EUR',

  // 2-letter country codes (ISO 3166-1 alpha-2)
  DK: 'DKK',
  SE: 'SEK',
  NO: 'NOK',
  DE: 'EUR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  FI: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  CH: 'CHF',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
};

/**
 * Map locales to default currencies
 */
const LOCALE_TO_CURRENCY: Record<SupportedLocale, string> = {
  'da-DK': 'DKK',
  'sv-SE': 'SEK',
  'de-DE': 'EUR',
  'no-NO': 'NOK',
  'en-US': 'USD',
};

/**
 * Get currency code from country identifier
 * Supports both country names and ISO country codes
 */
export const getCurrencyFromCountry = (country: string): string => {
  if (!country) return 'SEK'; // Default fallback

  // Try exact match first
  if (COUNTRY_TO_CURRENCY[country]) {
    return COUNTRY_TO_CURRENCY[country];
  }

  // Try case-insensitive match for country names
  const normalized = country.toLowerCase();
  for (const [key, currency] of Object.entries(COUNTRY_TO_CURRENCY)) {
    if (key.toLowerCase() === normalized) {
      return currency;
    }
  }

  return 'SEK'; // Default fallback
};

/**
 * Get currency code from locale
 */
export const getCurrencyFromLocale = (locale: SupportedLocale): string => {
  return LOCALE_TO_CURRENCY[locale] || 'SEK';
};

/**
 * Determine the best currency for a branch
 * Priority: explicit branch.currency > branch.country > default SEK
 */
export const determineBranchCurrency = (
  branchCurrency?: string,
  branchCountry?: string
): string => {
  // If branch has explicit currency set, use it
  if (branchCurrency) {
    return branchCurrency;
  }

  // If branch has country, derive currency from it
  if (branchCountry) {
    return getCurrencyFromCountry(branchCountry);
  }

  // Default fallback
  return 'SEK';
};

/**
 * Format amount as currency with proper locale-based formatting
 */
export const formatBranchCurrency = (
  amount: number,
  currencyCode: string = 'SEK',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale.replace('-', '_'), {
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
 * Get supported currencies list
 */
export const getSupportedCurrencies = (): Array<{ code: string; name: string }> => {
  return [
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'EUR', name: 'Euro' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CHF', name: 'Swiss Franc' },
  ];
};

/**
 * Validate if a currency code is supported
 */
export const isValidCurrencyCode = (code: string): boolean => {
  return getSupportedCurrencies().some(c => c.code === code.toUpperCase());
};
