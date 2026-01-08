import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useIntl } from '../hooks/useIntl';

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
  title = undefined,
  className = '',
}) => {
  const { t } = useIntl();
  
  const getErrorMessage = (error: string | Error): string => {
    if (typeof error === 'string') return error;

    const message = error.message || t('errors.general.unexpected');

    // Provide user-friendly messages for common errors
    if (message.includes('permission')) {
      return t('errors.permissionDenied');
    }

    if (message.includes('network') || message.includes('fetch')) {
      return t('errors.network.description');
    }

    if (message.includes('not found') || message.includes('404')) {
      return t('errors.network.notFound');
    }

    if (message.includes('timeout')) {
      return t('errors.network.timeout');
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return t('errors.network.unauthorized');
    }

    if (message.includes('server error') || message.includes('500')) {
      return t('errors.network.serverError');
    }

    if (message.includes('validation')) {
      return t('errors.form.validationFailed');
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
          t('errors.suggestions.network.checkConnection'),
          t('errors.suggestions.network.refreshPage'),
          t('errors.suggestions.network.waitAndRetry'),
        ];
      case 'permission':
        return [
          t('errors.suggestions.permission.relogin'),
          t('errors.suggestions.permission.contactAdmin'),
          t('errors.suggestions.permission.checkPermissions'),
        ];
      case 'validation':
        return [
          t('errors.suggestions.validation.checkFields'),
          t('errors.suggestions.validation.verifyFormat'),
          t('errors.suggestions.validation.tryDifferent'),
        ];
      case 'server':
        return [
          t('errors.suggestions.server.waitAndRetry'),
          t('errors.suggestions.server.contactSupport'),
          t('errors.suggestions.server.checkStatus'),
        ];
      default:
        return [
          t('errors.suggestions.general.refreshPage'),
          t('errors.suggestions.general.checkConnection'),
          t('errors.suggestions.general.contactSupport'),
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
            <h3 className='font-semibold text-lg'>{title || t('errors.general.title')}</h3>
            <p className='text-sm opacity-90'>{t('errors.display.encounteredIssue')}</p>
          </div>
        </div>

        {/* Error Message */}
        <div className='mb-4'>
          <p className='text-sm leading-relaxed'>{errorMessage}</p>
        </div>

        {/* Suggested Actions */}
        <div className='mb-6'>
          <h4 className='font-medium text-sm mb-2'>{t('errors.display.suggestedActions')}</h4>
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
                <span>{t('common.errorState.retry')}</span>
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
                <span>{t('common.goToDashboard')}</span>
              </Button>
            )}
          </div>

          {/* Contact Support */}
          {showContactSupport && (
            <div className='pt-3 border-t border-current border-opacity-20'>
              <p className='text-xs opacity-90 mb-2'>{t('errors.display.stillHavingTrouble')}</p>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4' />
                <a
                  href={`mailto:support@taklaget.app?subject=${encodeURIComponent(t('errors.display.supportSubject'))}`}
                  className='text-xs underline hover:no-underline flex items-center space-x-1'
                >
                  <span>{t('errors.display.contactSupport')}</span>
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
