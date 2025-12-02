import React from 'react';
import { AlertTriangle, X, RefreshCw, Info, CheckCircle } from 'lucide-react';
import AccessibleButton from './AccessibleButton';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
  'aria-label'?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'error',
  title,
  message,
  details,
  onRetry,
  onDismiss,
  showDetails = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [showFullDetails, setShowFullDetails] = React.useState(showDetails);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className='w-5 h-5' aria-hidden='true' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5' aria-hidden='true' />;
      case 'info':
        return <Info className='w-5 h-5' aria-hidden='true' />;
      case 'success':
        return <CheckCircle className='w-5 h-5' aria-hidden='true' />;
      default:
        return <AlertTriangle className='w-5 h-5' aria-hidden='true' />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColorClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-red-400';
    }
  };

  return (
    <div
      className={`
        rounded-lg border p-4
        ${getColorClasses()}
        ${className}
      `}
      role='alert'
      aria-label={ariaLabel}
    >
      <div className='flex'>
        <div className={`flex-shrink-0 ${getIconColorClasses()}`}>{getIcon()}</div>

        <div className='ml-3 flex-1'>
          {title && <h3 className='text-sm font-medium mb-1'>{title}</h3>}

          <div className='text-sm'>
            <p>{message}</p>

            {details && (
              <div className='mt-2'>
                <button
                  type='button'
                  className='text-sm underline hover:no-underline focus:outline-none focus:underline'
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  aria-expanded={showFullDetails}
                  aria-controls='error-details'
                >
                  {showFullDetails ? 'Hide details' : 'Show details'}
                </button>

                {showFullDetails && (
                  <div
                    id='error-details'
                    className='mt-2 p-3 bg-white bg-opacity-50 rounded text-xs font-mono'
                  >
                    {details}
                  </div>
                )}
              </div>
            )}
          </div>

          {(onRetry || onDismiss) && (
            <div className='mt-3 flex space-x-2'>
              {onRetry && (
                <AccessibleButton
                  variant='secondary'
                  size='sm'
                  onClick={onRetry}
                  leftIcon={<RefreshCw className='w-4 h-4' />}
                  aria-label='Retry operation'
                >
                  Retry
                </AccessibleButton>
              )}

              {onDismiss && (
                <AccessibleButton
                  variant='ghost'
                  size='sm'
                  onClick={onDismiss}
                  leftIcon={<X className='w-4 h-4' />}
                  aria-label='Dismiss error'
                >
                  Dismiss
                </AccessibleButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline error component for form fields
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => (
  <div className={`text-sm text-red-600 mt-1 ${className}`} role='alert' aria-live='polite'>
    {message}
  </div>
);

// Error boundary fallback component
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  context = 'component',
}) => (
  <ErrorDisplay
    type='error'
    title='Something went wrong'
    message={`An error occurred in the ${context}. Please try refreshing the page or contact support if the problem persists.`}
    details={error.message}
    onRetry={resetError}
    showDetails={process.env.NODE_ENV === 'development'}
  />
);

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
  onGoOffline?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  onGoOffline: _onGoOffline,
}) => (
  <ErrorDisplay
    type='error'
    title='Connection Error'
    message='Unable to connect to the server. Please check your internet connection and try again.'
    onRetry={onRetry}
    showDetails={false}
  />
);

// Validation error component
interface ValidationErrorProps {
  errors: Record<string, string>;
  onDismiss?: () => void;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ errors, onDismiss }) => {
  const errorCount = Object.keys(errors).length;
  const errorMessages = Object.values(errors);

  return (
    <ErrorDisplay
      type='error'
      title={`Form has ${errorCount} validation error${errorCount > 1 ? 's' : ''}`}
      message={errorMessages.join(', ')}
      onDismiss={onDismiss}
      showDetails={errorCount > 1}
    />
  );
};

// Success message component
interface SuccessMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title = 'Success',
  message,
  onDismiss,
  autoHide = true,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss, duration]);

  return <ErrorDisplay type='success' title={title} message={message} onDismiss={onDismiss} />;
};

export default ErrorDisplay;
