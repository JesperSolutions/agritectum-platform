import React from 'react';
import { cn } from '../../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standardized dark blue gradient page header — consistent design across all pages.
 * Uses from-slate-900 to-slate-700 gradient with white text.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, className = '', children }) => {
  return (
    <div className={cn('bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl shadow-lg p-8 text-white', className)}>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
          {subtitle && <p className='text-white/80 mt-2 text-base font-light'>{subtitle}</p>}
        </div>
        {children && <div className='flex items-center gap-3'>{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
