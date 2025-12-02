import { Report, Issue, RecommendedAction, Customer } from '../../types';

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Map of field names to error messages */
  errors: Record<string, string>;
}

/**
 * A validation rule for a specific field
 * @template T - The type of data being validated
 */
export interface ValidationRule<T> {
  /** The field to validate */
  field: keyof T;
  /** Error message to display if validation fails */
  message: string;
  /** Function that returns true if the value is valid */
  validator: (value: any, data: T) => boolean;
}

/**
 * Common validation functions that can be used with form fields
 */
export const validators = {
  /**
   * Validates that a value is not empty
   * @param value - The value to validate
   * @returns True if the value is not empty
   */
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  },

  minLength:
    (min: number) =>
    (value: string): boolean => {
      return typeof value === 'string' && value.trim().length >= min;
    },

  maxLength:
    (max: number) =>
    (value: string): boolean => {
      return typeof value === 'string' && value.trim().length <= max;
    },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: string): boolean => {
    const phoneRegex = /^[+]?[0-9\s\-()]{8,}$/;
    return phoneRegex.test(value);
  },

  positiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0;
  },

  nonNegativeNumber: (value: number): boolean => {
    return typeof value === 'number' && value >= 0;
  },

  date: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  futureDate: (value: string): boolean => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  pastDate: (value: string): boolean => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};

// Report validation rules
export const reportValidationRules: ValidationRule<Report>[] = [
  {
    field: 'customerName',
    message: 'Customer name is required',
    validator: value => validators.required(value) && validators.minLength(2)(value),
  },
  {
    field: 'customerAddress',
    message: 'Customer address is required',
    validator: value => validators.required(value) && validators.minLength(5)(value),
  },
  {
    field: 'customerEmail',
    message: 'Please enter a valid email address',
    validator: value => !value || validators.email(value),
  },
  {
    field: 'customerPhone',
    message: 'Please enter a valid phone number',
    validator: value => !value || validators.phone(value),
  },
  {
    field: 'inspectionDate',
    message: 'Inspection date is required',
    validator: value => validators.required(value) && validators.date(value),
  },
  {
    field: 'roofType',
    message: 'Roof type is required',
    validator: value => validators.required(value),
  },
  {
    field: 'roofAge',
    message: 'Roof age must be a positive number',
    validator: value => !value || validators.positiveNumber(value),
  },
  {
    field: 'conditionNotes',
    message: 'Condition notes are required',
    validator: value => validators.required(value) && validators.minLength(10)(value),
  },
  {
    field: 'issuesFound',
    message: 'At least one issue must be documented',
    validator: value => Array.isArray(value) && value.length > 0,
  },
  {
    field: 'recommendedActions',
    message: 'At least one recommended action is required',
    validator: value => Array.isArray(value) && value.length > 0,
  },
];

// Issue validation rules
export const issueValidationRules: ValidationRule<Issue>[] = [
  {
    field: 'type',
    message: 'Issue type is required',
    validator: value => validators.required(value),
  },
  {
    field: 'severity',
    message: 'Issue severity is required',
    validator: value => validators.required(value),
  },
  {
    field: 'description',
    message: 'Issue description is required',
    validator: value => validators.required(value) && validators.minLength(10)(value),
  },
  {
    field: 'location',
    message: 'Issue location is required',
    validator: value => validators.required(value) && validators.minLength(3)(value),
  },
];

// Recommended action validation rules
export const recommendedActionValidationRules: ValidationRule<RecommendedAction>[] = [
  {
    field: 'priority',
    message: 'Action priority is required',
    validator: value => validators.required(value),
  },
  {
    field: 'description',
    message: 'Action description is required',
    validator: value => validators.required(value) && validators.minLength(10)(value),
  },
  {
    field: 'urgency',
    message: 'Action urgency is required',
    validator: value => validators.required(value),
  },
  {
    field: 'estimatedCost',
    message: 'Estimated cost must be a non-negative number',
    validator: value => !value || validators.nonNegativeNumber(value),
  },
];

// Customer validation rules
export const customerValidationRules: ValidationRule<Customer>[] = [
  {
    field: 'name',
    message: 'Customer name is required',
    validator: value => validators.required(value) && validators.minLength(2)(value),
  },
  {
    field: 'email',
    message: 'Please enter a valid email address',
    validator: value => !value || validators.email(value),
  },
  {
    field: 'phone',
    message: 'Please enter a valid phone number',
    validator: value => !value || validators.phone(value),
  },
  {
    field: 'address',
    message: 'Address is required',
    validator: value => !value || validators.minLength(5)(value),
  },
];

// Generic validation function
export function validateData<T>(data: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: Record<string, string> = {};

  rules.forEach(rule => {
    const value = data[rule.field];
    if (!rule.validator(value, data)) {
      errors[rule.field as string] = rule.message;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Specific validation functions
export function validateReport(report: Partial<Report>): ValidationResult {
  return validateData(report as Report, reportValidationRules);
}

export function validateIssue(issue: Partial<Issue>): ValidationResult {
  return validateData(issue as Issue, issueValidationRules);
}

export function validateRecommendedAction(action: Partial<RecommendedAction>): ValidationResult {
  return validateData(action as RecommendedAction, recommendedActionValidationRules);
}

export function validateCustomer(customer: Partial<Customer>): ValidationResult {
  return validateData(customer as Customer, customerValidationRules);
}

// Real-time validation hook
export function useValidation<T>(
  data: T,
  rules: ValidationRule<T>[],
  validateOnChange: boolean = true
) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validate = React.useCallback(() => {
    const result = validateData(data, rules);
    setErrors(result.errors);
    return result.isValid;
  }, [data, rules]);

  const validateField = React.useCallback(
    (field: keyof T) => {
      const fieldRules = rules.filter(rule => rule.field === field);
      const result = validateData(data, fieldRules);
      setErrors(prev => ({
        ...prev,
        [field as string]: result.errors[field as string] || '',
      }));
      return result.isValid;
    },
    [data, rules]
  );

  const setFieldTouched = React.useCallback(
    (field: keyof T) => {
      setTouched(prev => ({
        ...prev,
        [field as string]: true,
      }));
      if (validateOnChange) {
        validateField(field);
      }
    },
    [validateField, validateOnChange]
  );

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = React.useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  React.useEffect(() => {
    if (validateOnChange) {
      validate();
    }
  }, [data, validate, validateOnChange]);

  return {
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    validate,
    validateField,
    setFieldTouched,
    clearErrors,
    clearFieldError,
  };
}

// Form field validation hook
export function useFieldValidation<T>(data: T, field: keyof T, rules: ValidationRule<T>[]) {
  const [error, setError] = React.useState<string>('');
  const [touched, setTouched] = React.useState<boolean>(false);

  const validate = React.useCallback(() => {
    const fieldRules = rules.filter(rule => rule.field === field);
    const result = validateData(data, fieldRules);
    const fieldError = result.errors[field as string] || '';
    setError(fieldError);
    return !fieldError;
  }, [data, field, rules]);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  const handleChange = React.useCallback(() => {
    if (touched) {
      validate();
    }
  }, [touched, validate]);

  React.useEffect(() => {
    if (touched) {
      validate();
    }
  }, [data, field, validate, touched]);

  return {
    error,
    touched,
    isValid: !error,
    validate,
    handleBlur,
    handleChange,
    setTouched,
  };
}

// Import React for hooks
import React from 'react';
