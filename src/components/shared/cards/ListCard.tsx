import React from 'react';
import { cn } from '../../../lib/utils';

interface ListCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Standardized list card component matching reference design
 * Uses: bg-white rounded-lg shadow p-6 border border-slate-200
 * Hover effect: hover:shadow-lg transition-shadow
 */
const ListCard: React.FC<ListCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow p-6 border border-slate-200',
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ListCard;
