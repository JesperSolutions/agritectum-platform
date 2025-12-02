import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface EnhancedErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  showContactSupport?: boolean;
  title?: string;
  className?: string;
}

const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({
  error,
  onRetry,
  onGoHome,
  showContactSupport = true,
  title = 'Something went wrong',
  className = '',
}) => {
  const getErrorMessage = (error: string | Error): string => {
    if (typeof error === 'string') return error;

    const message = error.message || 'An unexpected error occurred';

    // Provide user-friendly messages for common errors
    if (message.includes('permission')) {
      return "You don't have permission to perform this action. Please contact your administrator.";
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found. It may have been moved or deleted.';
    }

    if (message.includes('timeout')) {
      return 'The request timed out. Please try again in a moment.';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'You are not authorized to access this resource. Please log in again.';
    }

    if (message.includes('server error') || message.includes('500')) {
      return 'A server error occurred. Our team has been notified and is working to fix it.';
    }

    if (message.includes('validation')) {
      return 'Please check your input and try again. Some required fields may be missing.';
    }

    return message;
  };

  const errorMessage = getErrorMessage(error);

  const getErrorType = (
    error: string | Error
  ): 'network' | 'permission' | 'validation' | 'server' | 'unknown' => {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }

    if (
      message.includes('permission') ||
      message.includes('unauthorized') ||
      message.includes('401')
    ) {
      return 'permission';
    }

    if (message.includes('validation') || message.includes('required')) {
      return 'validation';
    }

    if (message.includes('server error') || message.includes('500')) {
      return 'server';
    }

    return 'unknown';
  };

  const errorType = getErrorType(error);

  const getErrorColor = () => {
    switch (errorType) {
      case 'network':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'permission':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'validation':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'server':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return '🌐';
      case 'permission':
        return '🔒';
      case 'validation':
        return '📝';
      case 'server':
        return '⚙️';
      default:
        return '⚠️';
    }
  };

  const getSuggestedActions = () => {
    switch (errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again',
        ];
      case 'permission':
        return [
          'Log out and log back in',
          'Contact your administrator',
          'Check if your account has the required permissions',
        ];
      case 'validation':
        return [
          'Check all required fields are filled',
          'Verify your input format',
          'Try a different approach',
        ];
      case 'server':
        return [
          'Wait a few minutes and try again',
          'Contact support if the issue persists',
          'Check our status page for updates',
        ];
      default:
        return [
          'Try refreshing the page',
          'Check your internet connection',
          'Contact support if the issue continues',
        ];
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className={`rounded-lg border p-6 ${getErrorColor()}`}>
        {/* Error Icon and Title */}
        <div className='flex items-center space-x-3 mb-4'>
          <div className='text-2xl'>{getErrorIcon()}</div>
          <div>
            <h3 className='font-semibold text-lg'>{title}</h3>
            <p className='text-sm opacity-90'>We encountered an issue</p>
          </div>
        </div>

        {/* Error Message */}
        <div className='mb-4'>
          <p className='text-sm leading-relaxed'>{errorMessage}</p>
        </div>

        {/* Suggested Actions */}
        <div className='mb-6'>
          <h4 className='font-medium text-sm mb-2'>Suggested actions:</h4>
          <ul className='text-xs space-y-1 opacity-90'>
            {getSuggestedActions().map((action, index) => (
              <li key={index} className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
              >
                <RefreshCw className='h-4 w-4' />
                <span>Try Again</span>
              </Button>
            )}

            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
              >
                <Home className='h-4 w-4' />
                <span>Go Home</span>
              </Button>
            )}
          </div>

          {/* Contact Support */}
          {showContactSupport && (
            <div className='pt-3 border-t border-current border-opacity-20'>
              <p className='text-xs opacity-90 mb-2'>Still having trouble?</p>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4' />
                <a
                  href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com'}?subject=Technical Support Request`}
                  className='text-xs underline hover:no-underline flex items-center space-x-1'
                >
                  <span>Contact Support</span>
                  <ExternalLink className='h-3 w-3' />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedErrorDisplay;
