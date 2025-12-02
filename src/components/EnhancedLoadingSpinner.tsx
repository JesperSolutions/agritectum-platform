import React from 'react';
import { Loader2, FileText, Mail, Users, BarChart3 } from 'lucide-react';

interface EnhancedLoadingSpinnerProps {
  message?: string;
  type?: 'default' | 'email' | 'report' | 'data' | 'analytics';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  message,
  type = 'default',
  size = 'md',
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'email':
        return <Mail className={`text-blue-500 ${getSizeClasses().icon}`} />;
      case 'report':
        return <FileText className={`text-green-500 ${getSizeClasses().icon}`} />;
      case 'data':
        return <Users className={`text-purple-500 ${getSizeClasses().icon}`} />;
      case 'analytics':
        return <BarChart3 className={`text-orange-500 ${getSizeClasses().icon}`} />;
      default:
        return <Loader2 className={`text-blue-500 ${getSizeClasses().spinner} animate-spin`} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          spinner: 'h-4 w-4',
          icon: 'h-4 w-4',
          text: 'text-sm',
        };
      case 'lg':
        return {
          container: 'p-8',
          spinner: 'h-12 w-12',
          icon: 'h-12 w-12',
          text: 'text-lg',
        };
      default:
        return {
          container: 'p-6',
          spinner: 'h-8 w-8',
          icon: 'h-8 w-8',
          text: 'text-base',
        };
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'email':
        return 'Sending email...';
      case 'report':
        return 'Loading report...';
      case 'data':
        return 'Loading data...';
      case 'analytics':
        return 'Loading analytics...';
      default:
        return 'Loading...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div
      className={`flex flex-col items-center justify-center ${getSizeClasses().container} ${className}`}
    >
      <div className='relative'>
        {type === 'default' && (
          <div className='absolute inset-0 rounded-full border-2 border-blue-100'></div>
        )}
        <div className='flex items-center justify-center'>{getIcon()}</div>
        {type === 'default' && (
          <div className='absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin'></div>
        )}
      </div>

      <div className={`mt-4 text-center ${getSizeClasses().text}`}>
        <p className='text-gray-600 font-medium'>{displayMessage}</p>
        {type === 'default' && (
          <div className='mt-2 flex items-center justify-center space-x-1'>
            <div className='w-1 h-1 bg-blue-500 rounded-full animate-bounce'></div>
            <div
              className='w-1 h-1 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className='w-1 h-1 bg-blue-500 rounded-full animate-bounce'
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized loading components for common use cases
export const EmailLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <EnhancedLoadingSpinner type='email' message={message} />
);

export const ReportLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <EnhancedLoadingSpinner type='report' message={message} />
);

export const DataLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <EnhancedLoadingSpinner type='data' message={message} />
);

export const AnalyticsLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <EnhancedLoadingSpinner type='analytics' message={message} />
);

export default EnhancedLoadingSpinner;
