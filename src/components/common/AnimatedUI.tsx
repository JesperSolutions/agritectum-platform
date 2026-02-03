/**
 * Animated UI Components
 * Reusable components with built-in micro-interactions
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Animated Card with hover lift effect
interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: 'lift' | 'glow' | 'scale' | 'border' | 'none';
  children: React.ReactNode;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  hover = 'lift',
  className,
  children,
  ...props
}) => {
  const hoverStyles = {
    lift: 'hover:-translate-y-1 hover:shadow-material-3',
    glow: 'hover:shadow-[0_0_15px_rgba(71,85,105,0.15)]',
    scale: 'hover:scale-[1.02]',
    border: 'hover:border-slate-400',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-material-1 border border-slate-200',
        'transition-all duration-200 ease-out',
        hoverStyles[hover],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Animated button with ripple effect placeholder
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantStyles = {
    primary: cn(
      'bg-slate-800 text-white',
      'hover:bg-slate-700 active:scale-[0.98]',
      'focus-visible:ring-slate-500'
    ),
    secondary: cn(
      'bg-slate-100 text-slate-900',
      'hover:bg-slate-200 active:scale-[0.98]',
      'focus-visible:ring-slate-500'
    ),
    ghost: cn(
      'bg-transparent text-slate-700',
      'hover:bg-slate-100 active:scale-[0.98]',
      'focus-visible:ring-slate-500'
    ),
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Fade-in wrapper for staggered animations
interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  children: React.ReactNode;
}

export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  duration = 200,
  direction = 'up',
  className,
  children,
  style,
  ...props
}) => {
  const directionStyles = {
    up: 'animate-slide-up',
    down: 'animate-slide-down',
    left: 'animate-[slide-left_0.25s_ease-out]',
    right: 'animate-[slide-right_0.25s_ease-out]',
    none: 'animate-fade-in',
  };

  return (
    <div
      className={cn(directionStyles[direction], className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Stagger container for animating list items
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  children: React.ReactNode;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  staggerDelay = 50,
  className,
  children,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <FadeIn key={index} delay={index * staggerDelay}>
              {child}
            </FadeIn>
          );
        }
        return child;
      })}
    </div>
  );
};

// Pulse indicator for attention
interface PulseIndicatorProps {
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'slate';
  size?: 'sm' | 'md' | 'lg';
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  color = 'green',
  size = 'md',
}) => {
  const colorStyles = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  return (
    <span className='relative inline-flex'>
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
          colorStyles[color]
        )}
      />
      <span className={cn('relative inline-flex rounded-full', colorStyles[color], sizeStyles[size])} />
    </span>
  );
};

// Hover scale wrapper
interface HoverScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number;
  children: React.ReactNode;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  scale = 1.02,
  className,
  children,
  style,
  ...props
}) => (
  <div
    className={cn('transition-transform duration-200 ease-out', className)}
    style={{
      ...style,
      '--hover-scale': scale,
    } as React.CSSProperties}
    onMouseEnter={e => {
      (e.currentTarget.style.transform = `scale(${scale})`);
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'scale(1)';
    }}
    {...props}
  >
    {children}
  </div>
);

// Icon button with hover animation
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'filled';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const variantStyles = {
    ghost: 'hover:bg-slate-100 active:bg-slate-200',
    outline: 'border border-slate-300 hover:bg-slate-50 hover:border-slate-400',
    filled: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300',
  };

  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-slate-600',
        'transition-all duration-150 ease-out',
        'hover:text-slate-900 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
};

// Badge with optional pulse
interface AnimatedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  pulse?: boolean;
  children: React.ReactNode;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  variant = 'default',
  pulse = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        'transition-colors duration-150',
        pulse && 'animate-pulse-subtle',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default AnimatedCard;
