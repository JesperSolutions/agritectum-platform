/**
 * Submit Button Component
 * Enhanced button with loading states, preventing double-submissions
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  state?: SubmitState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  loading = false,
  state = 'idle',
  loadingText = 'Processing...',
  successText = 'Success!',
  errorText = 'Failed',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const isLoading = loading || state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isDisabled = disabled || isLoading;

  const baseStyles = cn(
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    fullWidth && 'w-full'
  );

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-lg',
  };

  const variantStyles = {
    primary: cn(
      'bg-slate-800 text-white shadow-sm',
      'hover:bg-slate-700 active:bg-slate-900',
      'focus-visible:ring-slate-500',
      isSuccess && 'bg-green-600 hover:bg-green-600',
      isError && 'bg-red-600 hover:bg-red-600'
    ),
    secondary: cn(
      'bg-slate-100 text-slate-900 shadow-sm',
      'hover:bg-slate-200 active:bg-slate-300',
      'focus-visible:ring-slate-500'
    ),
    outline: cn(
      'border-2 border-slate-300 bg-transparent text-slate-700',
      'hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
      'focus-visible:ring-slate-500'
    ),
    ghost: cn(
      'bg-transparent text-slate-700',
      'hover:bg-slate-100 active:bg-slate-200',
      'focus-visible:ring-slate-500'
    ),
    danger: cn(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 active:bg-red-800',
      'focus-visible:ring-red-500'
    ),
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
          <span>{loadingText}</span>
        </>
      );
    }

    if (isSuccess) {
      return (
        <>
          <CheckCircle className='h-4 w-4' aria-hidden='true' />
          <span>{successText}</span>
        </>
      );
    }

    if (isError) {
      return (
        <>
          <XCircle className='h-4 w-4' aria-hidden='true' />
          <span>{errorText}</span>
        </>
      );
    }

    return (
      <>
        {icon}
        {children}
      </>
    );
  };

  return (
    <button
      type='submit'
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

// Button group for form actions
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
  className,
}) => {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-slate-200 mt-6',
        alignStyles[align],
        className
      )}
    >
      {children}
    </div>
  );
};

// Cancel button
interface CancelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  children = 'Cancel',
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      type='button'
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default SubmitButton;
