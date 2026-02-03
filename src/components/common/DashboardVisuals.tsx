/**
 * Dashboard Visual Components
 * Enhanced graphical components for the Building Owner Portal dashboard
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// ANIMATED STAT CARD
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  badges?: Array<{ label: string; value: number }>;
  linkText?: string;
  linkHref?: string;
  delay?: number;
  accentColor?: 'slate' | 'green' | 'blue' | 'amber' | 'red';
  helpText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badges,
  linkText,
  linkHref,
  delay = 0,
  accentColor = 'slate',
  helpText,
}) => {
  const accentStyles = {
    slate: 'from-slate-500 to-slate-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
  };

  const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;
  const trendColor = trend ? (trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-slate-500') : '';

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl shadow-sm border border-slate-200',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
        'overflow-hidden group animate-fade-in'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent gradient bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', accentStyles[accentColor])} />
      
      <div className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium text-slate-600'>{title}</p>
              {helpText && (
                <div className='group/tooltip relative'>
                  <span className='w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center cursor-help'>?</span>
                  <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity w-48 z-10'>
                    {helpText}
                  </div>
                </div>
              )}
            </div>
            
            <div className='flex items-baseline gap-2 mt-2'>
              <span className='text-3xl font-bold text-slate-900 tabular-nums'>{value}</span>
              {trend && TrendIcon && (
                <span className={cn('flex items-center gap-0.5 text-sm font-medium', trendColor)}>
                  <TrendIcon className='w-4 h-4' />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            
            {subtitle && (
              <p className='text-xs text-slate-500 mt-1'>{subtitle}</p>
            )}
            
            {trend && (
              <p className='text-xs text-slate-500 mt-1'>{trend.label}</p>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br', accentStyles[accentColor],
              'group-hover:scale-110 transition-transform duration-300'
            )}>
              <Icon className='w-6 h-6 text-white' />
            </div>
          )}
        </div>
        
        {badges && badges.length > 0 && (
          <div className='flex flex-wrap gap-1.5 mt-4'>
            {badges.map((badge, i) => (
              <span
                key={i}
                className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200'
              >
                {badge.value}{badge.label}
              </span>
            ))}
          </div>
        )}
        
        {linkText && linkHref && (
          <a
            href={linkHref}
            className='inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800 mt-4 group/link'
          >
            {linkText}
            <svg className='w-4 h-4 transition-transform group-hover/link:translate-x-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CIRCULAR PROGRESS RING
// ============================================================================

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  showAnimation?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 'lg',
  strokeWidth = 8,
  label,
  sublabel,
  grade,
  showAnimation = true,
}) => {
  const sizeMap = {
    sm: 64,
    md: 96,
    lg: 128,
    xl: 160,
  };
  
  const diameter = sizeMap[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference - (percent * circumference);
  
  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A': return { stroke: '#059669', bg: 'bg-green-50', text: 'text-green-700' };
      case 'B': return { stroke: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'C': return { stroke: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'D': return { stroke: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700' };
      case 'F': return { stroke: '#dc2626', bg: 'bg-red-50', text: 'text-red-700' };
      default: return { stroke: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700' };
    }
  };
  
  const colors = grade ? getGradeColor(grade) : { stroke: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700' };
  
  return (
    <div className='flex flex-col items-center'>
      <div className='relative' style={{ width: diameter, height: diameter }}>
        <svg
          className='transform -rotate-90'
          width={diameter}
          height={diameter}
        >
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill='none'
            stroke='#e2e8f0'
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill='none'
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={showAnimation ? offset : circumference}
            strokeLinecap='round'
            className={showAnimation ? 'transition-[stroke-dashoffset] duration-1000 ease-out' : ''}
            style={showAnimation ? { animation: 'progress-ring 1s ease-out forwards' } : {}}
          />
        </svg>
        
        {/* Center content */}
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          {grade ? (
            <>
              <span className={cn('text-3xl font-bold', colors.text)}>{grade}</span>
              <span className='text-sm font-semibold text-slate-600'>{value}</span>
            </>
          ) : (
            <>
              <span className='text-2xl font-bold text-slate-900'>{value}</span>
              {label && <span className='text-xs text-slate-500'>{label}</span>}
            </>
          )}
        </div>
      </div>
      {sublabel && (
        <p className='text-sm text-slate-600 mt-2 text-center'>{sublabel}</p>
      )}
    </div>
  );
};

// ============================================================================
// GRADE DISTRIBUTION BAR
// ============================================================================

interface GradeDistributionProps {
  grades: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  showLabels?: boolean;
  showCounts?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export const GradeDistribution: React.FC<GradeDistributionProps> = ({
  grades,
  showLabels = true,
  showCounts = true,
  height = 'md',
}) => {
  const total = Object.values(grades).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  
  const heightMap = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  
  const gradeColors = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };
  
  const gradeBgColors = {
    A: 'bg-green-50 border-green-200 text-green-700',
    B: 'bg-blue-50 border-blue-200 text-blue-700',
    C: 'bg-amber-50 border-amber-200 text-amber-700',
    D: 'bg-orange-50 border-orange-200 text-orange-700',
    F: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className='space-y-3'>
      {/* Stacked bar */}
      <div className={cn('flex rounded-full overflow-hidden', heightMap[height])}>
        {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
          const count = grades[grade];
          if (count === 0) return null;
          const percent = (count / total) * 100;
          return (
            <div
              key={grade}
              className={cn(gradeColors[grade], 'transition-all duration-500 ease-out')}
              style={{ width: `${percent}%` }}
              title={`Grade ${grade}: ${count} (${Math.round(percent)}%)`}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      {(showLabels || showCounts) && (
        <div className='flex flex-wrap gap-2'>
          {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
            const count = grades[grade];
            if (count === 0) return null;
            return (
              <div
                key={grade}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                  gradeBgColors[grade]
                )}
              >
                {showLabels && <span>{grade}</span>}
                {showCounts && <span className='font-bold'>{count}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STATUS INDICATOR WITH PULSE
// ============================================================================

interface StatusIndicatorProps {
  status: 'good' | 'warning' | 'urgent' | 'neutral';
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = false,
  size = 'md',
}) => {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const pulseSizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  
  const statusColors = {
    good: 'bg-green-500',
    warning: 'bg-amber-500',
    urgent: 'bg-red-500',
    neutral: 'bg-slate-400',
  };
  
  const pulseColors = {
    good: 'bg-green-400',
    warning: 'bg-amber-400',
    urgent: 'bg-red-400',
    neutral: 'bg-slate-300',
  };
  
  return (
    <div className='flex items-center gap-2'>
      <span className='relative flex'>
        {pulse && status !== 'good' && (
          <span className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            pulseSizeMap[size],
            pulseColors[status]
          )} />
        )}
        <span className={cn('relative inline-flex rounded-full', sizeMap[size], statusColors[status])} />
      </span>
      {label && <span className='text-sm text-slate-600'>{label}</span>}
    </div>
  );
};

// ============================================================================
// MINI SPARKLINE CHART
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 32,
  color = '#64748b',
  showArea = true,
}) => {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  
  return (
    <svg width={width} height={height} className='overflow-visible'>
      {showArea && (
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <polyline
        points={points}
        fill='none'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className,
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// ============================================================================
// GRADIENT SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accentColor?: 'slate' | 'green' | 'blue' | 'amber' | 'red';
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  accentColor = 'slate',
  action,
}) => {
  const iconBgColors = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };
  
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBgColors[accentColor])}>
            <Icon className='w-5 h-5' />
          </div>
        )}
        <div>
          <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
          {subtitle && <p className='text-sm text-slate-500'>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};
