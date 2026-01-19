import { createIntl, createIntlCache } from 'react-intl';
import svMessages from '../locales/sv/index';
import enMessages from '../locales/en/index';
import daMessages from '../locales/da/index';
import deMessages from '../locales/de/index';
import type { SupportedLocale } from '../utils/geolocation';
import { storeLocale } from '../utils/geolocation';
import { logger } from '../utils/logger';

// Create a cache for the intl instance
const cache = createIntlCache();

// Import messages for all supported locales
// Note: svMessages and enMessages are default exports, so they're already the flat objects
const messages: Record<SupportedLocale, any> = {
  'sv-SE': svMessages,
  'en-US': enMessages,
  'da-DK': daMessages,
  'de-DE': deMessages,
  'no-NO': svMessages, // Fallback to Swedish until Norwegian translations are added
};

// Debug logging in development to verify message structure
if (import.meta.env.DEV) {
  logger.log('[i18n] Messages loaded for locales:', Object.keys(messages));
  logger.log('[i18n] English messages type:', typeof enMessages);
  logger.log('[i18n] English messages is object:', typeof enMessages === 'object' && enMessages !== null);
  if (enMessages && typeof enMessages === 'object') {
    const enKeys = Object.keys(enMessages);
    logger.log('[i18n] English messages keys count:', enKeys.length);
    logger.log('[i18n] English messages first 5 keys:', enKeys.slice(0, 5));
    logger.log('[i18n] English has navigation.scheduledVisits:', 'navigation.scheduledVisits' in enMessages);
    if (enMessages['navigation.scheduledVisits']) {
      logger.log('[i18n] English navigation.scheduledVisits value:', enMessages['navigation.scheduledVisits']);
    }
  }
  if (svMessages && typeof svMessages === 'object') {
    logger.log('[i18n] Swedish has navigation.scheduledVisits:', 'navigation.scheduledVisits' in svMessages);
  }
}

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
    logger.warn(`Locale ${locale} not available, falling back to ${defaultLocale}`);
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
