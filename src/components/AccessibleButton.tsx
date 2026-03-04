import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ariaLabel,
      ariaDescribedBy,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-[#7DA8CC] text-white hover:bg-[#6890b3] focus:ring-[#7DA8CC]',
      secondary: 'bg-[#956098] text-white hover:bg-[#7f5182] focus:ring-[#956098]',
      danger: 'bg-[#DA5062] text-white hover:bg-[#c23d4f] focus:ring-[#DA5062]',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      link: 'bg-transparent text-[#7DA8CC] hover:text-[#6890b3] hover:underline focus:ring-[#7DA8CC]',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className='w-4 h-4 mr-2 animate-spin' aria-hidden='true' />}

        {!loading && leftIcon && (
          <span className='mr-2' aria-hidden='true'>
            {leftIcon}
          </span>
        )}

        <span>{loading ? loadingText || 'Loading...' : children}</span>

        {!loading && rightIcon && (
          <span className='ml-2' aria-hidden='true'>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
