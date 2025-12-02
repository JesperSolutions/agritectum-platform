import { useState, useCallback, useRef } from 'react';
import { AppError, ErrorCodes, getErrorMessage } from '../utils/errorHandler';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  context: string | null;
  timestamp: Date | null;
}

export interface ErrorHandlerOptions {
  onError?: (error: Error, context: string) => void;
  onRetry?: (error: Error, context: string) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorId: null,
    context: null,
    timestamp: null,
  });

  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null,
      context: null,
      timestamp: null,
    });
    retryCountRef.current = 0;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const handleError = useCallback(
    (error: Error, context: string = 'unknown') => {
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setErrorState({
        hasError: true,
        error,
        errorId,
        context,
        timestamp: new Date(),
      });

      // Call custom error handler
      if (options.onError) {
        options.onError(error, context);
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error in ${context}:`, error);
      }
    },
    [options]
  );

  const retry = useCallback(
    async (retryFn: () => Promise<void>) => {
      const maxRetries = options.maxRetries || 3;
      const retryDelay = options.retryDelay || 1000;

      if (retryCountRef.current >= maxRetries) {
        handleError(
          new AppError(ErrorCodes.UNKNOWN_ERROR, 'Maximum retry attempts exceeded'),
          'retry'
        );
        return;
      }

      retryCountRef.current += 1;

      try {
        await retryFn();
        clearError();
      } catch (error) {
        if (retryCountRef.current < maxRetries) {
          // Wait before retrying
          retryTimeoutRef.current = setTimeout(() => {
            retry(retryFn);
          }, retryDelay * retryCountRef.current);
        } else {
          handleError(error as Error, 'retry');
        }
      }
    },
    [options, handleError, clearError]
  );

  const createErrorHandler = useCallback(
    (context: string) => {
      return (error: Error) => {
        handleError(error, context);
      };
    },
    [handleError]
  );

  const createAsyncErrorHandler = useCallback(
    (context: string) => {
      return async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
        try {
          return await asyncFn();
        } catch (error) {
          handleError(error as Error, context);
          return null;
        }
      };
    },
    [handleError]
  );

  const createRetryableHandler = useCallback(
    (context: string) => {
      return async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
        const retryableFn = async () => {
          const result = await asyncFn();
          return result;
        };

        try {
          return await retry(retryableFn);
        } catch (error) {
          return null;
        }
      };
    },
    [retry]
  );

  return {
    errorState,
    clearError,
    handleError,
    retry,
    createErrorHandler,
    createAsyncErrorHandler,
    createRetryableHandler,
    isRetrying: retryCountRef.current > 0,
  };
};

// Hook for handling form validation errors
export const useValidationErrorHandler = () => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, error: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const hasErrors = Object.keys(validationErrors).length > 0;
  const getFieldError = (field: string) => validationErrors[field];

  return {
    validationErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasErrors,
    getFieldError,
  };
};

// Hook for handling network errors
export const useNetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleNetworkError = useCallback((error: Error) => {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      setNetworkError('Network connection failed. Please check your internet connection.');
    } else {
      setNetworkError(error.message);
    }
  }, []);

  const clearNetworkError = useCallback(() => {
    setNetworkError(null);
  }, []);

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('You are currently offline. Some features may not be available.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    networkError,
    handleNetworkError,
    clearNetworkError,
  };
};

// Import React for useEffect
import React from 'react';
