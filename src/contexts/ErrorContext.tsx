import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { AppError, ErrorCodes } from '../utils/errorHandler';

// Error state interface
interface ErrorState {
  errors: Array<{
    id: string;
    error: Error;
    context: string;
    timestamp: Date;
    dismissed: boolean;
  }>;
  hasErrors: boolean;
}

// Error actions
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: { id: string; error: Error; context: string; timestamp: Date } }
  | { type: 'DISMISS_ERROR'; payload: { id: string } }
  | { type: 'CLEAR_ERROR'; payload: { id: string } }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'CLEAR_DISMISSED_ERRORS' };

// Error context interface
interface ErrorContextType {
  state: ErrorState;
  addError: (error: Error, context: string) => string;
  dismissError: (id: string) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  clearDismissedErrors: () => void;
  getActiveErrors: () => Array<{ id: string; error: Error; context: string; timestamp: Date }>;
  hasActiveErrors: boolean;
}

// Initial state
const initialState: ErrorState = {
  errors: [],
  hasErrors: false,
};

// Error reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, { ...action.payload, dismissed: false }],
        hasErrors: true,
      };

    case 'DISMISS_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload.id ? { ...error, dismissed: true } : error
        ),
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload.id),
        hasErrors: state.errors.filter(error => error.id !== action.payload.id).length > 0,
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: [],
        hasErrors: false,
      };

    case 'CLEAR_DISMISSED_ERRORS':
      return {
        ...state,
        errors: state.errors.filter(error => !error.dismissed),
        hasErrors: state.errors.filter(error => !error.dismissed).length > 0,
      };

    default:
      return state;
  }
}

// Create context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Error provider component
interface ErrorProviderProps {
  children: React.ReactNode;
  maxErrors?: number;
  autoDismissDelay?: number;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxErrors = 10,
  autoDismissDelay = 10000,
}) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = useCallback(
    (error: Error, context: string): string => {
      const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();

      dispatch({
        type: 'ADD_ERROR',
        payload: { id, error, context, timestamp },
      });

      // Auto-dismiss after delay
      if (autoDismissDelay > 0) {
        setTimeout(() => {
          dispatch({ type: 'DISMISS_ERROR', payload: { id } });
        }, autoDismissDelay);
      }

      // Limit number of errors
      if (state.errors.length >= maxErrors) {
        const oldestError = state.errors[0];
        if (oldestError) {
          dispatch({ type: 'CLEAR_ERROR', payload: { id: oldestError.id } });
        }
      }

      return id;
    },
    [state.errors.length, maxErrors, autoDismissDelay]
  );

  const dismissError = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: { id } });
  }, []);

  const clearError = useCallback((id: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: { id } });
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  const clearDismissedErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_DISMISSED_ERRORS' });
  }, []);

  const getActiveErrors = useCallback(() => {
    return state.errors
      .filter(error => !error.dismissed)
      .map(({ id, error, context, timestamp }) => ({ id, error, context, timestamp }));
  }, [state.errors]);

  const hasActiveErrors = getActiveErrors().length > 0;

  const value: ErrorContextType = {
    state,
    addError,
    dismissError,
    clearError,
    clearAllErrors,
    clearDismissedErrors,
    getActiveErrors,
    hasActiveErrors,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

// Hook to use error context
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Hook for handling specific error types
export const useErrorHandler = (context: string) => {
  const { addError, clearError } = useError();

  const handleError = useCallback(
    (error: Error) => {
      return addError(error, context);
    },
    [addError, context]
  );

  const handleAsyncError = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error as Error);
        return null;
      }
    },
    [handleError]
  );

  const clearErrorById = useCallback(
    (id: string) => {
      clearError(id);
    },
    [clearError]
  );

  return {
    handleError,
    handleAsyncError,
    clearErrorById,
  };
};

// Global error handler for unhandled errors
export const setupGlobalErrorHandler = () => {
  // Import logger dynamically to avoid circular dependencies
  const logGlobalError = async (message: string, error: any) => {
    const { logger } = await import('../utils/logger');
    logger.error(message, error);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    logGlobalError('Unhandled promise rejection:', event.reason);

    // You could dispatch to a global error store here
    // or show a notification to the user
  });

  // Handle uncaught errors
  window.addEventListener('error', event => {
    logGlobalError('Uncaught error:', event.error);

    // You could dispatch to a global error store here
    // or show a notification to the user
  });
};
