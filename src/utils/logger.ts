export type OfferEvent =
  | { type: 'offer_view'; offerId: string }
  | { type: 'offer_accept_click'; offerId: string }
  | { type: 'offer_confirm_success'; offerId: string }
  | { type: 'offer_reject'; offerId: string };

export function logOfferEvent(event: OfferEvent) {
  try {
    // Hook for GA or other analytics
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: event.type, ...event });
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('analytics', event);
    }
  } catch {
    // no-op
  }
}

// Enhanced logging utility that gates logs by environment
// Uses Vite's import.meta.env for proper environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Check if debug mode is enabled (via localStorage or URL param)
const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('debug') === 'true' ||
      new URLSearchParams(window.location.search).has('debug')
    );
  } catch {
    return false;
  }
};

/**
 * Logger utility that gates logs by environment
 * - error: Always logs (critical errors should be visible)
 * - warn: Only logs in development
 * - info: Only logs in development
 * - debug: Only logs in development
 * - log: Only logs in development
 * 
 * Production builds suppress all non-error logs for performance and security.
 */
export const logger = {
  error: (message: string, ...args: unknown[]) => {
    // Always log errors - they're critical
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    // Only log warnings in development
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    // Only log info in development
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    // Only log debug messages in development
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  // Log method for backward compatibility
  log: (message: string, ...args: unknown[]) => {
    // Only log in development
    if (isDevelopment) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },
};
