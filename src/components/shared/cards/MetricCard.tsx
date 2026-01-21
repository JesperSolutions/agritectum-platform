import React from 'react';
import { LucideIcon } from 'lucide-react';
import { getCardClasses } from '../../../design-system/components';
import { card, typography } from '../../../design-system/tokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

/**
 * MetricCard component using design system tokens
 * Displays a metric with optional icon, trend, and subtitle
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-slate-600',
  trend,
  className = '',
  onClick,
}) => {
  const cardClasses = onClick
    ? `${getCardClasses('inner')} cursor-pointer hover:shadow-md transition-all ${className}`
    : `${getCardClasses('inner')} ${className}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          {Icon && (
            <div className='flex items-center mb-2'>
              <div
                className={`w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className={`text-slate-600 text-sm font-medium`}>{title}</p>
            </div>
          )}
          {!Icon && <p className={`text-slate-600 text-sm font-medium mb-2`}>{title}</p>}
          <p className={`text-3xl font-bold text-slate-900 mb-1`}>{value}</p>
          {subtitle && <p className={`text-slate-500 text-sm flex items-center`}>{subtitle}</p>}
          {trend && (
            <p
              className={`text-sm flex items-center mt-1 ${
                trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive !== false ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
