import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

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
      <label htmlFor={fieldId} className='block text-sm font-medium text-gray-700'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
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
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`,
        })}

        {hasError && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <AlertCircle className='h-5 w-5 text-red-500' />
          </div>
        )}
      </div>

      {hasError && (
        <p id={`${fieldId}-error`} className='text-sm text-red-600'>
          {error}
        </p>
      )}

      {helpText && !hasError && (
        <p id={`${fieldId}-help`} className='text-sm text-gray-500'>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Input component with validation
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  touched?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, touched, className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <input
        ref={ref}
        className={`
        block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
        focus:outline-none focus:ring-1 sm:text-sm
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// Textarea component with validation
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  touched?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, touched, className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <textarea
        ref={ref}
        className={`
        block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
        focus:outline-none focus:ring-1 sm:text-sm
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// Select component with validation
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  touched?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, touched, options, placeholder, className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <select
        ref={ref}
        className={`
        block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
        {...props}
      >
        {placeholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

// Number input component with validation
interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  touched?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ error, touched, className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <input
        ref={ref}
        type='number'
        className={`
        block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
        focus:outline-none focus:ring-1 sm:text-sm
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

// Date input component with validation
interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  touched?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ error, touched, className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <input
        ref={ref}
        type='date'
        className={`
        block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
        focus:outline-none focus:ring-1 sm:text-sm
        ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';

export { FormField, Input, Textarea, Select, NumberInput, DateInput };
