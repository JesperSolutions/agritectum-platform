import React, { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

// Material Design 3 Form Field Component
interface MaterialFormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'outlined' | 'filled';
}

const MaterialFormField: React.FC<MaterialFormFieldProps> = ({
  label,
  error,
  touched,
  required = false,
  helpText,
  className = '',
  children,
  variant = 'outlined',
}) => {
  const hasError = touched && error;
  const fieldId = React.useId();

  return (
    <div className={`relative ${className}`}>
      <div className={`relative ${variant === 'filled' ? 'bg-gray-50 rounded-t-lg' : ''}`}>
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
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
          }`,
        })}
        
        {/* Static Label */}
        <label
          htmlFor={fieldId}
          className={`absolute left-3 -top-2 text-xs text-gray-600 bg-white px-1 z-10 pointer-events-none ${
            hasError ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Error Icon */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}

      {/* Help Text */}
      {helpText && !hasError && (
        <p id={`${fieldId}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Material Design 3 Input Component
interface MaterialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  touched?: boolean;
  variant?: 'outlined' | 'filled';
}

const MaterialInput = forwardRef<HTMLInputElement, MaterialInputProps>(
  ({ error, touched, variant = 'outlined', className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <input
        ref={ref}
        className={`
          block w-full px-3 py-3 text-gray-900
          border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          sm:text-sm
          ${variant === 'filled' ? 'bg-gray-50 border-b-2 border-gray-300 rounded-t-lg rounded-b-none' : 'border-gray-300'}
          ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

MaterialInput.displayName = 'MaterialInput';

// Material Design 3 Textarea Component
interface MaterialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  touched?: boolean;
  variant?: 'outlined' | 'filled';
}

const MaterialTextarea = forwardRef<HTMLTextAreaElement, MaterialTextareaProps>(
  ({ error, touched, variant = 'outlined', className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <textarea
        ref={ref}
        className={`
          block w-full px-3 py-3 text-gray-900
          border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          sm:text-sm resize-vertical
          ${variant === 'filled' ? 'bg-gray-50 border-b-2 border-gray-300 rounded-t-lg rounded-b-none' : 'border-gray-300'}
          ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

MaterialTextarea.displayName = 'MaterialTextarea';

// Material Design 3 Select Component
interface MaterialSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  touched?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  variant?: 'outlined' | 'filled';
}

const MaterialSelect = forwardRef<HTMLSelectElement, MaterialSelectProps>(
  ({ error, touched, options, placeholder, variant = 'outlined', className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <select
        ref={ref}
        className={`
          block w-full px-3 py-3 text-gray-900
          border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          sm:text-sm appearance-none bg-white
          ${variant === 'filled' ? 'bg-gray-50 border-b-2 border-gray-300 rounded-t-lg rounded-b-none' : 'border-gray-300'}
          ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

MaterialSelect.displayName = 'MaterialSelect';

// Material Design 3 Password Input Component
interface MaterialPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  touched?: boolean;
  variant?: 'outlined' | 'filled';
}

const MaterialPasswordInput = forwardRef<HTMLInputElement, MaterialPasswordInputProps>(
  ({ error, touched, variant = 'outlined', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = touched && error;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`
            block w-full px-3 py-3 pr-10 text-gray-900
            border rounded-lg shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            sm:text-sm
            ${variant === 'filled' ? 'bg-gray-50 border-b-2 border-gray-300 rounded-t-lg rounded-b-none' : 'border-gray-300'}
            ${
              hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
            }
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    );
  }
);

MaterialPasswordInput.displayName = 'MaterialPasswordInput';

// Material Design 3 Date Input Component
interface MaterialDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  touched?: boolean;
  variant?: 'outlined' | 'filled';
}

const MaterialDateInput = forwardRef<HTMLInputElement, MaterialDateInputProps>(
  ({ error, touched, variant = 'outlined', className = '', ...props }, ref) => {
    const hasError = touched && error;

    return (
      <input
        ref={ref}
        type="date"
        className={`
          block w-full px-3 py-3 text-gray-900
          border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          sm:text-sm
          ${variant === 'filled' ? 'bg-gray-50 border-b-2 border-gray-300 rounded-t-lg rounded-b-none' : 'border-gray-300'}
          ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

MaterialDateInput.displayName = 'MaterialDateInput';

export {
  MaterialFormField,
  MaterialInput,
  MaterialTextarea,
  MaterialSelect,
  MaterialPasswordInput,
  MaterialDateInput,
};
