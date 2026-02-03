import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * Simple tooltip component with hover activation
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getPositionStyles = (): React.CSSProperties => {
    if (!triggerRef.current || !isVisible) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const offset = 8;

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          left: triggerRect.left + triggerRect.width / 2 - 50,
          top: triggerRect.top - offset - 32,
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: triggerRect.left + triggerRect.width / 2 - 50,
          top: triggerRect.bottom + offset,
        };
      case 'left':
        return {
          ...baseStyle,
          left: triggerRect.left - offset - 100,
          top: triggerRect.top + triggerRect.height / 2 - 16,
        };
      case 'right':
        return {
          ...baseStyle,
          left: triggerRect.right + offset,
          top: triggerRect.top + triggerRect.height / 2 - 16,
        };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${className}`}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={getPositionStyles()}
          className='animate-in fade-in zoom-in-95 duration-100'
        >
          {content}
        </div>
      )}
    </>
  );
};

interface HelpIconProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Help icon with integrated tooltip
 */
export const HelpIcon: React.FC<HelpIconProps> = ({
  content,
  title,
  position = 'top',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const tooltipContent = title ? `${title}: ${content}` : content;

  return (
    <Tooltip content={tooltipContent} position={position}>
      <HelpCircle className={`${sizeMap[size]} text-gray-400 hover:text-gray-600 cursor-help transition-colors`} />
    </Tooltip>
  );
};

/**
 * Inline help text - appears below form field
 */
interface InlineHelpProps {
  children: React.ReactNode;
  className?: string;
}

export const InlineHelp: React.FC<InlineHelpProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-xs text-gray-500 mt-1 flex items-start gap-1 ${className}`}>
      <HelpCircle className='w-3 h-3 flex-shrink-0 mt-0.5' />
      <span>{children}</span>
    </p>
  );
};

/**
 * Info box - appears above sections with helpful context
 */
interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'tip' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantConfig = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-600',
  },
  tip: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-800',
    icon: 'text-cyan-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
  },
};

export const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const config = variantConfig[variant];

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 mb-4`}>
      <div className='flex gap-3'>
        <HelpCircle className={`w-5 h-5 ${config.icon} flex-shrink-0`} />
        <div className='flex-1'>
          {title && <h4 className={`font-medium ${config.text} mb-1`}>{title}</h4>}
          <div className={`text-sm ${config.text} leading-relaxed`}>{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 text-gray-400 hover:text-gray-600 ml-2`}
            aria-label='Dismiss'
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Contextual help panel - appears in sidebars or modals
 */
interface HelpPanelProps {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    icon?: React.ComponentType<{ className: string }>;
  }>;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ title, sections }) => {
  return (
    <div className='bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4'>
      <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
        <HelpCircle className='w-4 h-4' />
        {title}
      </h3>

      <div className='space-y-4'>
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index}>
              <div className='flex items-start gap-2 mb-1'>
                {Icon && <Icon className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />}
                <h4 className='text-xs font-semibold text-gray-900'>{section.heading}</h4>
              </div>
              <p className='text-xs text-gray-600 leading-relaxed'>{section.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
