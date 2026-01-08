import React from 'react';
import { cn } from '../../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Standardized page header component matching reference design
 * Title: text-3xl font-bold text-gray-900
 * Subtitle: mt-2 text-gray-600
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
