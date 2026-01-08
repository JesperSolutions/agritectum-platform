import { useIntl as useReactIntl } from 'react-intl';
import { formatCurrency as formatCurrencyUtil, getCurrencyCode } from '../utils/currency';
import type { SupportedLocale } from '../utils/geolocation';

export const useIntl = () => {
  const intl = useReactIntl();
  const locale = intl.locale as SupportedLocale;

  return {
    t: (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values),
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
