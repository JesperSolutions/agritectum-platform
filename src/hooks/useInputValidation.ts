import { useState, useCallback, useEffect, useRef } from 'react';
import { validators, ValidationRule } from '../utils/validation';

export interface InputValidationState {
  value: string;
  error: string;
  touched: boolean;
  isValid: boolean;
  isDirty: boolean;
  isFocused: boolean;
}

export interface InputValidationOptions {
  rules: ValidationRule<any>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnFocus?: boolean;
  debounceMs?: number;
  initialValue?: string;
}

export const useInputValidation = (options: InputValidationOptions) => {
  const {
    rules,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnFocus = false,
    debounceMs = 300,
    initialValue = '',
  } = options;

  const [state, setState] = useState<InputValidationState>({
    value: initialValue,
    error: '',
    touched: false,
    isValid: true,
    isDirty: false,
    isFocused: false,
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef<string>(initialValue);

  // Validate input value
  const validate = useCallback(
    (value: string): string => {
      for (const rule of rules) {
        if (!rule.validator(value, { [rule.field]: value })) {
          return rule.message;
        }
      }
      return '';
    },
    [rules]
  );

  // Debounced validation
  const debouncedValidate = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const error = validate(value);
        setState(prev => ({
          ...prev,
          error,
          isValid: !error,
        }));
      }, debounceMs);
    },
    [validate, debounceMs]
  );

  // Handle value change
  const handleChange = useCallback(
    (value: string) => {
      setState(prev => ({
        ...prev,
        value,
        isDirty: value !== initialValue,
      }));

      if (validateOnChange) {
        if (debounceMs > 0) {
          debouncedValidate(value);
        } else {
          const error = validate(value);
          setState(prev => ({
            ...prev,
            error,
            isValid: !error,
          }));
        }
      }
    },
    [initialValue, validateOnChange, debounceMs, debouncedValidate, validate]
  );

  // Handle blur
  const handleBlur = useCallback(() => {
    setState(prev => ({
      ...prev,
      touched: true,
      isFocused: false,
    }));

    if (validateOnBlur) {
      const error = validate(state.value);
      setState(prev => ({
        ...prev,
        error,
        isValid: !error,
      }));
    }
  }, [state.value, validateOnBlur, validate]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFocused: true,
    }));

    if (validateOnFocus) {
      const error = validate(state.value);
      setState(prev => ({
        ...prev,
        error,
        isValid: !error,
      }));
    }
  }, [state.value, validateOnFocus, validate]);

  // Reset validation state
  const reset = useCallback(() => {
    setState({
      value: initialValue,
      error: '',
      touched: false,
      isValid: true,
      isDirty: false,
      isFocused: false,
    });
    previousValueRef.current = initialValue;
  }, [initialValue]);

  // Set value programmatically
  const setValue = useCallback(
    (value: string) => {
      handleChange(value);
    },
    [handleChange]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: '',
      isValid: true,
    }));
  }, []);

  // Force validation
  const forceValidate = useCallback(() => {
    const error = validate(state.value);
    setState(prev => ({
      ...prev,
      error,
      isValid: !error,
      touched: true,
    }));
    return !error;
  }, [state.value, validate]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    handleChange,
    handleBlur,
    handleFocus,
    reset,
    setValue,
    clearError,
    forceValidate,
  };
};

// Hook for form-level validation
export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, ValidationRule<T>[]>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = formData[field];
      for (const rule of rules) {
        if (!rule.validator(value, formData)) {
          newErrors[field] = rule.message;
          isValid = false;
          break;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validationRules]);

  // Validate single field
  const validateField = useCallback(
    (field: keyof T): boolean => {
      const rules = validationRules[field];
      if (!rules) return true;

      const value = formData[field];
      for (const rule of rules) {
        if (!rule.validator(value, formData)) {
          setErrors(prev => ({
            ...prev,
            [field]: rule.message,
          }));
          return false;
        }
      }

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    },
    [formData, validationRules]
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (field: keyof T, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (field: keyof T) => {
      setTouched(prev => ({
        ...prev,
        [field]: true,
      }));
      validateField(field);
    },
    [validateField]
  );

  // Set field touched
  const setFieldTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: touched,
    }));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  // Submit form with validation
  const submitForm = useCallback(
    async (onSubmit: (data: T) => Promise<void> | void): Promise<boolean> => {
      setIsSubmitting(true);

      try {
        const isValid = validateForm();
        if (!isValid) {
          return false;
        }

        await onSubmit(formData);
        return true;
      } catch (error) {
        console.error('Form submission error:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm]
  );

  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    validateForm,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    setFieldTouched,
    clearAllErrors,
    clearFieldError,
    resetForm,
    submitForm,
    setFormData,
  };
};

// Hook for real-time validation with debouncing
export const useRealTimeValidation = <T>(
  value: T,
  rules: ValidationRule<T>[],
  debounceMs: number = 300
) => {
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validate = useCallback(
    (val: T): string => {
      for (const rule of rules) {
        if (!rule.validator(val, { [rule.field]: val })) {
          return rule.message;
        }
      }
      return '';
    },
    [rules]
  );

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsValidating(true);
    debounceTimeoutRef.current = setTimeout(() => {
      const errorMessage = validate(value);
      setError(errorMessage);
      setIsValidating(false);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, validate, debounceMs]);

  return {
    error,
    isValid: !error,
    isValidating,
  };
};
