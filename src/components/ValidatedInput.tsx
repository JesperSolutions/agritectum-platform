import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useInputValidation, ValidationRule } from '../hooks/useInputValidation';
import { formAccessibility } from '../utils/accessibility';

interface ValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  rules: ValidationRule<any>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnFocus?: boolean;
  debounceMs?: number;
  showValidationIcon?: boolean;
  helpText?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, error: string) => void;
  className?: string;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      rules,
      validateOnChange = true,
      validateOnBlur = true,
      validateOnFocus = false,
      debounceMs = 300,
      showValidationIcon = true,
      helpText,
      required = false,
      onChange,
      onValidationChange,
      className = '',
      value: controlledValue,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const initialValue = controlledValue || defaultValue || '';

    const {
      value,
      error,
      touched,
      isValid,
      isDirty,
      isFocused: _isFocused,
      handleChange,
      handleBlur,
      handleFocus,
      setValue,
    } = useInputValidation({
      rules,
      validateOnChange,
      validateOnBlur,
      validateOnFocus,
      debounceMs,
      initialValue: String(initialValue),
    });

    // Handle controlled value changes
    React.useEffect(() => {
      if (controlledValue !== undefined && String(controlledValue) !== value) {
        setValue(String(controlledValue));
      }
    }, [controlledValue, value, setValue]);

    // Notify parent of validation changes
    React.useEffect(() => {
      if (onValidationChange) {
        onValidationChange(isValid, error);
      }
    }, [isValid, error, onValidationChange]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      handleChange(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    const fieldId = formAccessibility.generateId('input');
    const errorId = formAccessibility.getErrorId(fieldId);
    const helpId = formAccessibility.getHelpId(fieldId);
    const hasError = touched && error;
    const hasHelp = helpText && !hasError;

    const inputAttributes = formAccessibility.getFieldAttributes(fieldId, hasError, hasHelp);

    const getValidationIcon = () => {
      if (!showValidationIcon || !touched) return null;

      if (isDirty && isValid) {
        return <CheckCircle className='w-5 h-5 text-[#A1BA53]' aria-hidden='true' />;
      }

      if (hasError) {
        return <AlertCircle className='w-5 h-5 text-[#DA5062]' aria-hidden='true' />;
      }

      return null;
    };

    const getInputClasses = () => {
      const baseClasses =
        'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm';

      if (hasError) {
        return `${baseClasses} border-[#DA5062]/40 focus:border-[#DA5062] focus:ring-[#DA5062] pr-10`;
      }

      if (isValid && isDirty) {
        return `${baseClasses} border-[#A1BA53]/40 focus:border-[#A1BA53] focus:ring-[#A1BA53] pr-10`;
      }

      return `${baseClasses} border-gray-300 focus:border-[#7DA8CC] focus:ring-[#7DA8CC] ${showValidationIcon ? 'pr-10' : ''}`;
    };

    return (
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={fieldId} className='block text-sm font-medium text-gray-700 truncate-smart'>
          {label}
          {required && (
            <span className='text-[#DA5062] ml-1 flex-shrink-0' aria-hidden='true'>
              *
            </span>
          )}
        </label>

        <div className='relative'>
          <input
            ref={ref}
            id={fieldId}
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={getInputClasses()}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : hasHelp ? helpId : undefined}
            {...inputAttributes}
            {...props}
          />

          {showValidationIcon && (
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none flex-shrink-0'>
              {getValidationIcon()}
            </div>
          )}
        </div>

        {hasError && (
          <p id={errorId} className='text-xs sm:text-sm text-[#DA5062] break-words' role='alert'>
            {error}
          </p>
        )}

        {hasHelp && (
          <p id={helpId} className='text-xs sm:text-sm text-gray-500 break-words'>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Validated textarea component
interface ValidatedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  rules: ValidationRule<any>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnFocus?: boolean;
  debounceMs?: number;
  showValidationIcon?: boolean;
  helpText?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, error: string) => void;
  className?: string;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  (
    {
      label,
      rules,
      validateOnChange = true,
      validateOnBlur = true,
      validateOnFocus = false,
      debounceMs = 300,
      showValidationIcon = true,
      helpText,
      required = false,
      onChange,
      onValidationChange,
      className = '',
      value: controlledValue,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const initialValue = controlledValue || defaultValue || '';

    const {
      value,
      error,
      touched,
      isValid,
      isDirty,
      isFocused: _isFocused,
      handleChange,
      handleBlur,
      handleFocus,
      setValue,
    } = useInputValidation({
      rules,
      validateOnChange,
      validateOnBlur,
      validateOnFocus,
      debounceMs,
      initialValue: String(initialValue),
    });

    // Handle controlled value changes
    React.useEffect(() => {
      if (controlledValue !== undefined && String(controlledValue) !== value) {
        setValue(String(controlledValue));
      }
    }, [controlledValue, value, setValue]);

    // Notify parent of validation changes
    React.useEffect(() => {
      if (onValidationChange) {
        onValidationChange(isValid, error);
      }
    }, [isValid, error, onValidationChange]);

    // Handle textarea change
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      handleChange(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    const fieldId = formAccessibility.generateId('textarea');
    const errorId = formAccessibility.getErrorId(fieldId);
    const helpId = formAccessibility.getHelpId(fieldId);
    const hasError = touched && error;
    const hasHelp = helpText && !hasError;

    const inputAttributes = formAccessibility.getFieldAttributes(fieldId, hasError, hasHelp);

    const getValidationIcon = () => {
      if (!showValidationIcon || !touched) return null;

      if (isDirty && isValid) {
        return <CheckCircle className='w-5 h-5 text-[#A1BA53]' aria-hidden='true' />;
      }

      if (hasError) {
        return <AlertCircle className='w-5 h-5 text-[#DA5062]' aria-hidden='true' />;
      }

      return null;
    };

    const getTextareaClasses = () => {
      const baseClasses =
        'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm';

      if (hasError) {
        return `${baseClasses} border-[#DA5062]/40 focus:border-[#DA5062] focus:ring-[#DA5062]`;
      }

      if (isValid && isDirty) {
        return `${baseClasses} border-[#A1BA53]/40 focus:border-[#A1BA53] focus:ring-[#A1BA53]`;
      }

      return `${baseClasses} border-gray-300 focus:border-[#7DA8CC] focus:ring-[#7DA8CC]`;
    };

    return (
      <div className={`space-y-1 ${className}`}>
        <label htmlFor={fieldId} className='block text-sm font-medium text-gray-700'>
          {label}
          {required && <span className='text-[#DA5062] ml-1'>*</span>}
        </label>

        <div className='relative'>
          <textarea
            ref={ref}
            id={fieldId}
            value={value}
            onChange={handleTextareaChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={getTextareaClasses()}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : hasHelp ? helpId : undefined}
            {...inputAttributes}
            {...props}
          />

          {showValidationIcon && (
            <div className='absolute top-2 right-2 pointer-events-none'>{getValidationIcon()}</div>
          )}
        </div>

        {hasError && (
          <p id={errorId} className='text-sm text-[#DA5062]' role='alert'>
            {error}
          </p>
        )}

        {hasHelp && (
          <p id={helpId} className='text-sm text-gray-500'>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

export default ValidatedInput;
