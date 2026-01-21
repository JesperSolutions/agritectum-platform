import React from 'react';
import { cn } from '../../../lib/utils';

interface ListCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Standardized list card component using Material Design tokens
 * Uses: Material Design elevation, 4dp border radius, slate colors
 */
const ListCard: React.FC<ListCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={cn(
        'rounded-material border border-slate-200 bg-white shadow-material-2 p-6 transition-shadow duration-material',
        onClick && 'cursor-pointer hover:shadow-material-3',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ListCard;
