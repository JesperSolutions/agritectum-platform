/**
 * Enhanced Form Field Component
 * Provides consistent form inputs with validation feedback, labels, and help text
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  showSuccess?: boolean;
  touched?: boolean;
  validateOnBlur?: boolean;
  validator?: (value: string) => string | undefined;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helpText,
      showSuccess = false,
      touched = false,
      validateOnBlur = false,
      validator,
      className,
      id,
      required,
      disabled,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const [localError, setLocalError] = useState<string | undefined>();
    const [localTouched, setLocalTouched] = useState(false);

    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const hasError = error || localError;
    const isTouched = touched || localTouched;
    const showError = hasError && isTouched;
    const showSuccessState = showSuccess && isTouched && !hasError && props.value;

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setLocalTouched(true);
        if (validateOnBlur && validator) {
          setLocalError(validator(e.target.value));
        }
        onBlur?.(e);
      },
      [validateOnBlur, validator, onBlur]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Clear error on change
        if (localError) {
          setLocalError(undefined);
        }
        onChange?.(e);
      },
      [localError, onChange]
    );

    return (
      <div className={cn('space-y-1.5', className)}>
        {/* Label */}
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium transition-colors',
            disabled ? 'text-slate-400' : 'text-slate-700',
            showError && 'text-red-600'
          )}
        >
          {label}
          {required && <span className='text-red-500 ml-0.5'>*</span>}
        </label>

        {/* Input wrapper */}
        <div className='relative'>
          <input
            ref={ref}
            id={fieldId}
            disabled={disabled}
            required={required}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={
              showError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
            }
            className={cn(
              'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200',
              'placeholder:text-slate-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100',
              // Default state
              !showError && !showSuccessState && 'border-slate-300 focus-visible:ring-slate-500',
              // Error state
              showError &&
                'border-red-400 bg-red-50/50 text-red-900 placeholder:text-red-300 focus-visible:ring-red-500 pr-10',
              // Success state
              showSuccessState &&
                'border-green-400 bg-green-50/30 focus-visible:ring-green-500 pr-10'
            )}
            {...props}
          />

          {/* Status icon */}
          {(showError || showSuccessState) && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
              {showError ? (
                <AlertCircle className='h-4 w-4 text-red-500' aria-hidden='true' />
              ) : (
                <CheckCircle className='h-4 w-4 text-green-500' aria-hidden='true' />
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {showError && (
          <p
            id={`${fieldId}-error`}
            className='text-sm text-red-600 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200'
            role='alert'
          >
            <AlertCircle className='h-3.5 w-3.5 flex-shrink-0' />
            {hasError}
          </p>
        )}

        {/* Help text */}
        {helpText && !showError && (
          <p
            id={`${fieldId}-help`}
            className='text-sm text-slate-500 flex items-center gap-1.5'
          >
            <HelpCircle className='h-3.5 w-3.5 flex-shrink-0 text-slate-400' />
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Enhanced textarea variant
interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  touched?: boolean;
}

export const FormTextArea = React.forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, helpText, touched = false, className, id, required, disabled, ...props }, ref) => {
    const [localTouched, setLocalTouched] = useState(false);
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const showError = error && (touched || localTouched);

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium transition-colors',
            disabled ? 'text-slate-400' : 'text-slate-700',
            showError && 'text-red-600'
          )}
        >
          {label}
          {required && <span className='text-red-500 ml-0.5'>*</span>}
        </label>

        <div className='relative'>
          <textarea
            ref={ref}
            id={fieldId}
            disabled={disabled}
            required={required}
            onBlur={() => setLocalTouched(true)}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
            className={cn(
              'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200 resize-y',
              'placeholder:text-slate-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100',
              !showError && 'border-slate-300 focus-visible:ring-slate-500',
              showError && 'border-red-400 bg-red-50/50 text-red-900 focus-visible:ring-red-500'
            )}
            {...props}
          />
        </div>

        {showError && (
          <p
            id={`${fieldId}-error`}
            className='text-sm text-red-600 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200'
            role='alert'
          >
            <AlertCircle className='h-3.5 w-3.5 flex-shrink-0' />
            {error}
          </p>
        )}

        {helpText && !showError && (
          <p id={`${fieldId}-help`} className='text-sm text-slate-500 flex items-center gap-1.5'>
            <HelpCircle className='h-3.5 w-3.5 flex-shrink-0 text-slate-400' />
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormTextArea.displayName = 'FormTextArea';

// Enhanced select variant
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  touched?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    { label, error, helpText, touched = false, options, placeholder, className, id, required, disabled, ...props },
    ref
  ) => {
    const [localTouched, setLocalTouched] = useState(false);
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const showError = error && (touched || localTouched);

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium transition-colors',
            disabled ? 'text-slate-400' : 'text-slate-700',
            showError && 'text-red-600'
          )}
        >
          {label}
          {required && <span className='text-red-500 ml-0.5'>*</span>}
        </label>

        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          required={required}
          onBlur={() => setLocalTouched(true)}
          aria-invalid={showError ? 'true' : 'false'}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100',
            !showError && 'border-slate-300 focus-visible:ring-slate-500',
            showError && 'border-red-400 bg-red-50/50 text-red-900 focus-visible:ring-red-500'
          )}
          {...props}
        >
          {placeholder && (
            <option value='' disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {showError && (
          <p
            id={`${fieldId}-error`}
            className='text-sm text-red-600 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200'
            role='alert'
          >
            <AlertCircle className='h-3.5 w-3.5 flex-shrink-0' />
            {error}
          </p>
        )}

        {helpText && !showError && (
          <p id={`${fieldId}-help`} className='text-sm text-slate-500 flex items-center gap-1.5'>
            <HelpCircle className='h-3.5 w-3.5 flex-shrink-0 text-slate-400' />
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormField;
