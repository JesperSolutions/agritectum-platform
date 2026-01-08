import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { getFormInputClass, getTypographyClasses } from '../../../design-system/components';
import { typography } from '../../../design-system/tokens';

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Enhanced FormField component using design system tokens
 * Provides consistent form field styling with validation states
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  touched,
  required = false,
  helpText,
  className = '',
  children,
}) => {
  const hasError = touched && error;
  const fieldId = React.useId();

  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={fieldId} 
        className={required ? typography.label.required : typography.label.default}
      >
        {label}
      </label>

      <div className='relative'>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-invalid': hasError ? 'true' : 'false',
          'aria-describedby': hasError
            ? `${fieldId}-error`
            : helpText
              ? `${fieldId}-help`
              : undefined,
          className: `${(children as React.ReactElement).props.className || ''} ${
            hasError
              ? getFormInputClass(true)
              : getFormInputClass(false)
          }`,
        })}

        {hasError && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <AlertCircle className='h-5 w-5 text-red-500' />
          </div>
        )}
      </div>

      {hasError && (
        <p id={`${fieldId}-error`} className='text-sm text-red-600' role='alert'>
          {error}
        </p>
      )}

      {helpText && !hasError && (
        <p id={`${fieldId}-help`} className='text-sm text-slate-500'>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;
