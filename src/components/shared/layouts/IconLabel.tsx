import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IconLabelProps {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
  className?: string;
  iconClassName?: string;
}

/**
 * Standardized icon + label component matching reference design
 * Used in card layouts for displaying metadata (Date & Time, Location, Inspector, etc.)
 */
const IconLabel: React.FC<IconLabelProps> = ({
  icon: Icon,
  label,
  value,
  className = '',
  iconClassName = 'w-4 h-4 text-gray-400',
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Icon className={iconClassName} />
      <div>
        <p className='text-sm font-medium text-gray-600'>{label}</p>
        <p className='text-gray-900'>{value}</p>
      </div>
    </div>
  );
};

export default IconLabel;
