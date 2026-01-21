/**
 * Shared Error Handler Utility
 *
 * Provides consistent error handling and user-friendly error messages
 * across the entire application.
 */

import { logger } from './logger';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (
  error: unknown,
  translations?: {
    permissionDenied?: string;
    networkError?: string;
    quotaExceeded?: string;
    validationError?: string;
    unknownError?: string;
  }
): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Permission errors
  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('denied') ||
    lowerMessage.includes('unauthorized')
  ) {
    return (
      translations?.permissionDenied ||
      'Du saknar behörighet för denna åtgärd. Kontrollera dina användarrättigheter.'
    );
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('failed to fetch')
  ) {
    return (
      translations?.networkError ||
      'Nätverksfel uppstod. Kontrollera din internetanslutning och försök igen.'
    );
  }

  // Quota errors
  if (lowerMessage.includes('quota') || lowerMessage.includes('limit exceeded')) {
    return (
      translations?.quotaExceeded ||
      'Kvoten har överskridits. Kontakta administratören för mer information.'
    );
  }

  // Validation errors
  if (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('invalid')
  ) {
    return (
      translations?.validationError ||
      'Ett valideringsfel uppstod. Kontrollera att alla obligatoriska fält är korrekt ifyllda.'
    );
  }

  // Firestore not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
    return 'Det begärda objektet kunde inte hittas.';
  }

  // Generic error
  return translations?.unknownError || `Ett oväntat fel uppstod: ${errorMessage.slice(0, 100)}`;
};

/**
 * Handle error with optional toast notification and logging
 */
export const handleError = async (
  error: unknown,
  options: ErrorHandlerOptions = {}
): Promise<string> => {
  const { showToast = false, logError = true, fallbackMessage } = options;

  const errorMessage = getErrorMessage(error);

  // Log error if enabled
  if (logError) {
    console.error('Error handled:', error);
  }

  // Show toast if enabled (requires toast context)
  if (showToast) {
    try {
      const { useToast } = await import('../contexts/ToastContext');
      // Note: This will need to be called from within a component with toast context
      // For now, this is a placeholder for the pattern
    } catch {
      // Toast context not available
    }
  }

  return fallbackMessage || errorMessage;
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (
  error: unknown,
  type: 'permission' | 'network' | 'quota' | 'validation' | 'notFound'
): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  switch (type) {
    case 'permission':
      return (
        lowerMessage.includes('permission') ||
        lowerMessage.includes('denied') ||
        lowerMessage.includes('unauthorized')
      );
    case 'network':
      return (
        lowerMessage.includes('network') ||
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('failed to fetch')
      );
    case 'quota':
      return lowerMessage.includes('quota') || lowerMessage.includes('limit exceeded');
    case 'validation':
      return (
        lowerMessage.includes('validation') ||
        lowerMessage.includes('required') ||
        lowerMessage.includes('invalid')
      );
    case 'notFound':
      return lowerMessage.includes('not found') || lowerMessage.includes('does not exist');
    default:
      return false;
  }
};

/**
 * Error codes for categorization
 */
export enum ErrorCodes {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_DELETE_FAILED = 'FILE_DELETE_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class with error code
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCodes,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Log error with context
 */
export const logError = (error: Error | unknown, context?: string) => {
  const message = context
    ? `${context}: ${error instanceof Error ? error.message : String(error)}`
    : error instanceof Error
      ? error.message
      : String(error);
  logger.error(message, error);
};
