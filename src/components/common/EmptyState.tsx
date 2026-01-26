/**
 * Empty State Component
 *
 * Consistent empty states across the application with Swedish text
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && <Icon className='w-16 h-16 text-gray-400 mb-4' aria-hidden='true' />}
      <h3 className='text-lg font-medium text-gray-900 mb-2'>{title}</h3>
      {description && (
        <p className='text-sm text-gray-500 text-center max-w-md mb-4'>{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className='mt-4 px-4 py-2 text-sm font-medium text-slate-900 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
