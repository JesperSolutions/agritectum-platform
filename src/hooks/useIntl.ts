import { useIntl as useReactIntl } from 'react-intl';
import { formatCurrency as formatCurrencyUtil, getCurrencyCode } from '../utils/currency';
import type { SupportedLocale } from '../utils/geolocation';
import { logger } from '../utils/logger';

export const useIntl = () => {
  const intl = useReactIntl();
  const locale = intl.locale as SupportedLocale;

  if (import.meta.env.DEV) {
    logger.log('[useIntl] intl.locale:', intl.locale, 'Type:', typeof intl.locale);
  }

  return {
    t: (id: string, values?: Record<string, any>) => {
      try {
        const result = intl.formatMessage({ id }, values);
        // In development, log if the key wasn't found (formatMessage returns the key if not found)
        if (import.meta.env.DEV && result === id) {
          console.warn(`[useIntl] Translation key not found: "${id}" for locale "${locale}"`);
        }
        return result;
      } catch (error) {
        // If formatMessage throws, log and return the key
        if (import.meta.env.DEV) {
          console.error(`[useIntl] Error translating key "${id}":`, error);
        }
        return id;
      }
    },
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      intl.formatNumber(value, options),
    formatCurrency: (value: number, currency?: string) => {
      const currencyCode = currency || getCurrencyCode(locale);
      return formatCurrencyUtil(value, locale);
    },
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      intl.formatDate(date, options),
    formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      intl.formatTime(date, options),
    formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      intl.formatRelativeTime(value, unit),
    formatPlural: (value: number, options: Record<string, string>) =>
      intl.formatPlural(value, options),
    locale: intl.locale,
  };
};

export default useIntl;
