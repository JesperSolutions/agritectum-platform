import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className='flex flex-col items-center space-y-2'>
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        {text && <p className='text-sm text-gray-600 animate-pulse'>{text}</p>}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'>
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Pre-built loading components for common use cases
export const LoadingCard: React.FC<{ text?: string; className?: string }> = ({
  text = 'Loading...',
  className = '',
}) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <LoadingSpinner size='lg' text={text} />
  </div>
);

export const LoadingTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <div className='px-6 py-4 border-b border-gray-200'>
      <div className='flex space-x-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='h-4 bg-gray-200 rounded animate-pulse flex-1' />
        ))}
      </div>
    </div>
    <div className='divide-y divide-gray-200'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='px-6 py-4'>
          <div className='flex space-x-4'>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className='h-4 bg-gray-200 rounded animate-pulse flex-1' />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LoadingButton: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ loading = false, children, className = '', disabled = false }) => (
  <button
    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    disabled={disabled || loading}
  >
    {loading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
    {children}
  </button>
);

export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}> = ({ loading, children, text = 'Loading...', className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
    {loading && (
      <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10'>
        <LoadingSpinner size='lg' text={text} />
      </div>
    )}
  </div>
);

export default LoadingSpinner;
