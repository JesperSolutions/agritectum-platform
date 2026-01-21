import React, { useState, useEffect } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import { defaultLocale, messages, updateLocale } from '../i18n';
import {
  detectUserLocale,
  getStoredLocale,
  storeLocale,
  type SupportedLocale,
} from '../utils/geolocation';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface IntlProviderProps {
  children: React.ReactNode;
}

const IntlProvider: React.FC<IntlProviderProps> = ({ children }) => {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const initializeLocale = async () => {
      try {
        // Priority 1: Check user profile for preferredLanguage
        if (currentUser?.uid) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.data();
            const userLanguage = userData?.preferredLanguage || userData?.locale;

            if (userLanguage && messages[userLanguage as SupportedLocale]) {
              setCurrentLocale(userLanguage as SupportedLocale);
              storeLocale(userLanguage as SupportedLocale, true);
              setIsInitialized(true);
              logger.log('[IntlProvider] Using user profile language:', userLanguage);
              return;
            }
          } catch (error) {
            logger.warn('[IntlProvider] Could not fetch user language preference:', error);
          }
        }

        // Priority 2: Check if user has a manually stored preference
        const stored = getStoredLocale();

        if (stored && stored.isManual && messages[stored.locale]) {
          setCurrentLocale(stored.locale);
          setIsInitialized(true);
          return;
        }

        // Priority 3: Auto-detect from geolocation
        const detectedLocale = await detectUserLocale();

        // Verify the locale has messages available
        if (messages[detectedLocale]) {
          setCurrentLocale(detectedLocale);
          // Store the detected locale as auto-detected (not manual)
          storeLocale(detectedLocale, false);
          // Update the global intl instance (but don't mark as manual since it's auto-detected)
          // We use storeLocale directly instead of updateLocale to avoid marking as manual
        } else {
          // Fallback to default if detected locale not available
          logger.warn(`Locale ${detectedLocale} not available, using default ${defaultLocale}`);
          setCurrentLocale(defaultLocale);
        }
      } catch (error) {
        logger.warn('Could not detect locale, using default:', error);
        // Fallback to default
        setCurrentLocale(defaultLocale);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLocale();
  }, [currentUser?.uid]); // Re-run when user changes

  // Use current locale or fallback to default
  const activeLocale = currentLocale || defaultLocale;
  const activeMessages = messages[activeLocale] || messages[defaultLocale];

  // Debug logging in development
  if (import.meta.env.DEV && isInitialized) {
    logger.log('[IntlProvider] Active locale:', activeLocale, 'Type:', typeof activeLocale);
    logger.log('[IntlProvider] Available locales:', Object.keys(messages));
    logger.log(
      '[IntlProvider] Messages object keys (first 10):',
      Object.keys(activeMessages || {}).slice(0, 10)
    );
    logger.log(
      '[IntlProvider] Has navigation.scheduledVisits:',
      'navigation.scheduledVisits' in (activeMessages || {})
    );
    if (activeMessages && activeMessages['navigation.scheduledVisits']) {
      logger.log(
        '[IntlProvider] navigation.scheduledVisits value:',
        activeMessages['navigation.scheduledVisits']
      );
    }
  }

  // Show loading state while detecting (optional - can be removed if not needed)
  if (!isInitialized) {
    // Return with default locale while detecting
    return (
      <ReactIntlProvider
        locale={defaultLocale}
        messages={messages[defaultLocale]}
        defaultLocale={defaultLocale}
      >
        {children}
      </ReactIntlProvider>
    );
  }

  return (
    <ReactIntlProvider
      locale={activeLocale}
      messages={activeMessages}
      defaultLocale={defaultLocale}
      key={activeLocale} // Force re-render when locale changes
    >
      {children}
    </ReactIntlProvider>
  );
};

export default IntlProvider;
