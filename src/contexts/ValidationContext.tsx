import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Validation state interface
interface ValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

// Validation actions
type ValidationAction =
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_TOUCHED'; field: string; touched: boolean }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET' };

// Validation context interface
interface ValidationContextType {
  state: ValidationState;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  setTouched: (field: string, touched: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearAllErrors: () => void;
  reset: () => void;
  getFieldError: (field: string) => string | undefined;
  isFieldTouched: (field: string) => boolean;
  isFieldValid: (field: string) => boolean;
}

// Initial state
const initialState: ValidationState = {
  errors: {},
  touched: {},
  isValid: true,
};

// Validation reducer
function validationReducer(state: ValidationState, action: ValidationAction): ValidationState {
  switch (action.type) {
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error,
        },
        isValid: false,
      };

    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.field];
      return {
        ...state,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.field]: action.touched,
        },
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
        isValid: Object.keys(action.errors).length === 0,
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {},
        isValid: true,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Create context
const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

// Validation provider component
interface ValidationProviderProps {
  children: React.ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(validationReducer, initialState);

  const setError = useCallback((field: string, error: string) => {
    dispatch({ type: 'SET_ERROR', field, error });
  }, []);

  const clearError = useCallback((field: string) => {
    dispatch({ type: 'CLEAR_ERROR', field });
  }, []);

  const setTouched = useCallback((field: string, touched: boolean) => {
    dispatch({ type: 'SET_TOUCHED', field, touched });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', errors });
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const getFieldError = useCallback(
    (field: string) => {
      return state.errors[field];
    },
    [state.errors]
  );

  const isFieldTouched = useCallback(
    (field: string) => {
      return state.touched[field] || false;
    },
    [state.touched]
  );

  const isFieldValid = useCallback(
    (field: string) => {
      return !state.errors[field];
    },
    [state.errors]
  );

  const value: ValidationContextType = {
    state,
    setError,
    clearError,
    setTouched,
    setErrors,
    clearAllErrors,
    reset,
    getFieldError,
    isFieldTouched,
    isFieldValid,
  };

  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
};

// Hook to use validation context
export const useValidation = (): ValidationContextType => {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

// Hook for field-specific validation
export const useFieldValidation = (field: string) => {
  const { getFieldError, isFieldTouched, isFieldValid, setError, clearError, setTouched } =
    useValidation();

  const error = getFieldError(field);
  const touched = isFieldTouched(field);
  const isValid = isFieldValid(field);

  const handleBlur = useCallback(() => {
    setTouched(field, true);
  }, [field, setTouched]);

  const handleChange = useCallback(() => {
    if (touched && error) {
      clearError(field);
    }
  }, [field, touched, error, clearError]);

  return {
    error,
    touched,
    isValid,
    handleBlur,
    handleChange,
    setError: (error: string) => setError(field, error),
    clearError: () => clearError(field),
    setTouched: (touched: boolean) => setTouched(field, touched),
  };
};
