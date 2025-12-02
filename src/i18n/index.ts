import { createIntl, createIntlCache } from 'react-intl';
import svMessages from '../locales/sv/index';
import daMessages from '../locales/da/index';
import deMessages from '../locales/de/index';
import type { SupportedLocale } from '../utils/geolocation';
import { storeLocale } from '../utils/geolocation';

// Create a cache for the intl instance
const cache = createIntlCache();

// Import messages for all supported locales
const messages: Record<SupportedLocale, any> = {
  'sv-SE': svMessages,
  'da-DK': daMessages,
  'en-US': svMessages, // Fallback to Swedish until English translations are added
  'de-DE': deMessages,
  'no-NO': svMessages, // Fallback to Swedish until Norwegian translations are added
};

// Default locale
const defaultLocale: SupportedLocale = 'sv-SE';

// Get initial locale from storage or detect
let initialLocale: SupportedLocale = defaultLocale;

// Try to get stored locale
try {
  const stored = localStorage.getItem('userLocale');
  if (stored && Object.keys(messages).includes(stored)) {
    initialLocale = stored as SupportedLocale;
  }
} catch (error) {
  // Ignore localStorage errors
}

// Create the intl instance with initial locale
export const intl = createIntl(
  {
    locale: initialLocale,
    messages: messages[initialLocale] || messages[defaultLocale],
    defaultLocale,
  },
  cache
);

/**
 * Update the locale dynamically
 * This should be called when user manually selects a language
 */
export const updateLocale = (locale: SupportedLocale): void => {
  if (!messages[locale]) {
    console.warn(`Locale ${locale} not available, falling back to ${defaultLocale}`);
    return;
  }
  
  // Update the intl instance
  Object.assign(intl, createIntl(
    {
      locale,
      messages: messages[locale],
      defaultLocale,
    },
    cache
  ));
  
  // Store as manual selection so it won't be overridden by auto-detection
  storeLocale(locale, true);
};

// Export the messages and locale for use in components
export { messages, defaultLocale };
export type { SupportedLocale };
export default intl;
