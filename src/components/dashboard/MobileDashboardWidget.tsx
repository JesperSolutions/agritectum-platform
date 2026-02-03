import React, { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { ChevronDown } from 'lucide-react';

interface MobileDashboardWidgetProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  isEmpty?: boolean;
}

/**
 * Mobile-optimized dashboard widget wrapper
 * Stacks vertically on mobile, with collapsible sections to save space
 */
export const MobileDashboardWidget: React.FC<MobileDashboardWidgetProps> = ({
  title,
  icon,
  children,
  expandable = false,
  defaultExpanded = true,
  action,
  isEmpty = false,
}) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  if (isEmpty) {
    return null;
  }

  if (!isMobile) {
    // Desktop - show normally
    return (
      <div className='bg-white rounded-lg shadow border border-gray-200 overflow-hidden'>
        <div className='px-4 py-4 sm:px-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {icon && <div className='text-blue-600'>{icon}</div>}
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
            </div>
            {action && (
              <button
                onClick={action.onClick}
                className='text-sm text-blue-600 hover:text-blue-700 font-medium'
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
        <div className='border-t border-gray-200 px-4 py-4 sm:px-6'>
          {children}
        </div>
      </div>
    );
  }

  // Mobile - with optional collapse
  return (
    <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
      >
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          {icon && <div className='text-blue-600 flex-shrink-0'>{icon}</div>}
          <h3 className='text-base font-semibold text-gray-900'>{title}</h3>
        </div>
        {expandable && (
          <ChevronDown
            className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
          />
        )}
      </button>

      {(!expandable || isExpanded) && (
        <>
          <div className='border-t border-gray-200 px-4 py-4'>
            {children}
          </div>
          {action && (
            <div className='border-t border-gray-200 px-4 py-3 bg-gray-50'>
              <button
                onClick={action.onClick}
                className='w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2'
              >
                {action.label}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface ResponsiveDashboardGridProps {
  children: ReactNode;
}

/**
 * Responsive grid that stacks on mobile, multi-column on desktop
 */
export const ResponsiveDashboardGrid: React.FC<ResponsiveDashboardGridProps> = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <div className='space-y-4'>{children}</div>;
  }

  return <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>{children}</div>;
};

/**
 * Compact stats display optimized for mobile
 */
interface StatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const CompactStat: React.FC<StatProps> = ({ label, value, icon, trend }) => {
  const isMobile = useIsMobile();

  return (
    <div className='flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-b-0'>
      <div className='flex items-center gap-2 flex-1'>
        {icon && <div className='text-blue-600 flex-shrink-0'>{icon}</div>}
        <span className='text-sm text-gray-600'>{label}</span>
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} text-gray-900`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600'
                : trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
};
