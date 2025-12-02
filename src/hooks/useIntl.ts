import { useIntl as useReactIntl } from 'react-intl';

export const useIntl = () => {
  const intl = useReactIntl();

  return {
    t: (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      intl.formatNumber(value, options),
    formatCurrency: (value: number, currency = 'SEK') =>
      intl.formatNumber(value, { style: 'currency', currency, localeMatcher: 'best fit' }) || 
      new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value),
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
