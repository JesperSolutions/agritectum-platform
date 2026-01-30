/**
 * Geolocation utility for detecting user's country and setting locale
 */

import { logger } from './logger';

export type SupportedLocale = 'sv-SE' | 'da-DK' | 'en-US' | 'de-DE' | 'no-NO';

export interface CountryLocaleMap {
  [countryCode: string]: SupportedLocale;
}

// Map country codes to locales
const COUNTRY_TO_LOCALE: CountryLocaleMap = {
  // Nordic countries
  SE: 'sv-SE', // Sweden
  DK: 'da-DK', // Denmark
  NO: 'no-NO', // Norway
  FI: 'sv-SE', // Finland (default to Swedish)
  IS: 'en-US', // Iceland (default to English)

  // Other countries
  DE: 'de-DE', // Germany
  US: 'en-US', // United States
  GB: 'en-US', // United Kingdom
  CA: 'en-US', // Canada
  AU: 'en-US', // Australia

  // Default fallback
  DEFAULT: 'sv-SE', // Default to Swedish
};

/**
 * Detect user's country using browser timezone
 * This is a client-side method that doesn't require API calls
 */
export const detectCountryFromTimezone = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map timezones to countries
    const timezoneToCountry: Record<string, string> = {
      // Denmark
      'Europe/Copenhagen': 'DK',

      // Sweden
      'Europe/Stockholm': 'SE',

      // Norway
      'Europe/Oslo': 'NO',

      // Germany
      'Europe/Berlin': 'DE',
      'Europe/Munich': 'DE',
      'Europe/Hamburg': 'DE',

      // Finland (use Swedish)
      'Europe/Helsinki': 'SE',

      // UK
      'Europe/London': 'GB',

      // US
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
    };

    return timezoneToCountry[timezone] || null;
  } catch (error) {
    logger.warn('Could not detect country from timezone:', error);
    return null;
  }
};

/**
 * Detect user's country using browser language
 */
export const detectCountryFromLanguage = (): string | null => {
  try {
    // Check all browser languages, not just the first one
    const navigatorWithLanguage = navigator as unknown as { userLanguage?: string };
    const languages = navigator.languages || [navigator.language] || [
        navigatorWithLanguage.userLanguage,
      ];

    for (const language of languages) {
      if (!language) continue;

      // Extract country code from language (e.g., 'da-DK' -> 'DK')
      if (language.includes('-')) {
        const parts = language.split('-');
        if (parts.length >= 2) {
          const country = parts[1].toUpperCase();
          // Validate it's a known country
          if (['DK', 'SE', 'NO', 'DE', 'US', 'GB', 'FI'].includes(country)) {
            return country;
          }
        }
      }

      // Map language codes to countries
      const languageToCountry: Record<string, string> = {
        da: 'DK', // Danish
        sv: 'SE', // Swedish
        no: 'NO', // Norwegian
        nb: 'NO', // Norwegian Bokmål
        nn: 'NO', // Norwegian Nynorsk
        de: 'DE', // German
        en: 'US', // English (default to US)
      };

      const langCode = language.split('-')[0].toLowerCase();
      if (languageToCountry[langCode]) {
        return languageToCountry[langCode];
      }
    }

    return null;
  } catch (error) {
    logger.warn('Could not detect country from language:', error);
    return null;
  }
};

/**
 * Detect user's country using IP geolocation API (optional, requires API)
 * Falls back to timezone/language detection if API fails
 */
export const detectCountryFromIP = async (): Promise<string | null> => {
  try {
    // Using a free IP geolocation service
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.country_code || null;
    }
  } catch (error) {
    logger.warn('Could not detect country from IP:', error);
  }

  return null;
};

/**
 * Detect user's country using multiple methods
 * Priority: Browser language > Timezone > IP geolocation > Default
 */
export const detectUserCountry = async (): Promise<string> => {
  // Try browser language first (fastest and most reliable for user preference)
  const languageCountry = detectCountryFromLanguage();
  if (languageCountry) {
    logger.log('[Geolocation] Detected country from browser language:', languageCountry);
    return languageCountry;
  }

  // Fallback to timezone detection
  const timezoneCountry = detectCountryFromTimezone();
  if (timezoneCountry) {
    logger.log('[Geolocation] Detected country from timezone:', timezoneCountry);
    return timezoneCountry;
  }

  // Try IP geolocation last (slowest)
  const ipCountry = await detectCountryFromIP();
  if (ipCountry) {
    logger.log('[Geolocation] Detected country from IP:', ipCountry);
    return ipCountry;
  }

  // Final fallback to browser language again
  const languageCountry2 = detectCountryFromLanguage();
  if (languageCountry) {
    return languageCountry;
  }

  // Default fallback
  logger.log('[Geolocation] Using default country: SE');
  return 'SE'; // Default to Sweden
};

/**
 * Get locale based on country code
 */
export const getLocaleFromCountry = (countryCode: string): SupportedLocale => {
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] || COUNTRY_TO_LOCALE.DEFAULT;
};

/**
 * Detect and return user's locale
 */
export const detectUserLocale = async (): Promise<SupportedLocale> => {
  const country = await detectUserCountry();
  return getLocaleFromCountry(country);
};

/**
 * Get stored locale preference from localStorage
 * Returns both the locale and whether it was manually set
 * If old format (no isManual flag), treats it as auto-detected (isManual: false)
 */
export const getStoredLocale = (): { locale: SupportedLocale; isManual: boolean } | null => {
  try {
    const stored = localStorage.getItem('userLocale');

    if (!stored) {
      return null;
    }

    // Check if locale is valid
    if (!Object.values(COUNTRY_TO_LOCALE).includes(stored as SupportedLocale)) {
      return null;
    }

    // Check if isManual flag exists
    const isManualFlag = localStorage.getItem('userLocaleManual');
    const isManual = isManualFlag === 'true';

    // If flag doesn't exist, this is an old stored locale - treat as auto-detected
    // so it will be re-detected on next visit
    if (isManualFlag === null) {
      // Migrate old format: clear it so it gets re-detected
      return null;
    }

    return { locale: stored as SupportedLocale, isManual };
  } catch (error) {
    logger.warn('Could not read stored locale:', error);
  }
  return null;
};

/**
 * Store locale preference in localStorage
 * @param locale - The locale to store
 * @param isManual - Whether this locale was manually selected by the user (default: false for auto-detected)
 */
export const storeLocale = (locale: SupportedLocale, isManual: boolean = false): void => {
  try {
    localStorage.setItem('userLocale', locale);
    localStorage.setItem('userLocaleManual', isManual ? 'true' : 'false');
  } catch (error) {
    logger.warn('Could not store locale:', error);
  }
};

/**
 * Clear stored locale preference
 */
export const clearStoredLocale = (): void => {
  try {
    localStorage.removeItem('userLocale');
    localStorage.removeItem('userLocaleManual');
  } catch (error) {
    logger.warn('Could not clear stored locale:', error);
  }
};
