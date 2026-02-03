/**
 * Accessibility React Components
 * Reusable components for screen readers, keyboard navigation, and ARIA
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Skip Link for Keyboard Navigation
// ============================================================================

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children = 'Skip to main content',
}) => (
  <a
    href={`#${targetId}`}
    className={cn(
      'fixed top-0 left-0 z-[9999] px-4 py-2 bg-slate-900 text-white',
      'transform -translate-y-full focus:translate-y-0',
      'transition-transform duration-200',
      'focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
    )}
  >
    {children}
  </a>
);

// ============================================================================
// Screen Reader Announcements
// ============================================================================

interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  politeness = 'polite',
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement('');
      const timer = setTimeout(() => setAnnouncement(message), 100);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role='status'
      aria-live={politeness}
      aria-atomic='true'
      className='sr-only'
    >
      {announcement}
    </div>
  );
};

// ============================================================================
// Visually Hidden (Screen Reader Only)
// ============================================================================

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, ...props }) => (
  <span className='sr-only' {...props}>
    {children}
  </span>
);

// ============================================================================
// Focus Trap
// ============================================================================

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  returnFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  returnFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    previousActiveElement.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, returnFocus]);

  return <div ref={containerRef}>{children}</div>;
};

// ============================================================================
// Loading State Accessibility
// ============================================================================

interface AccessibleLoadingOverlayProps {
  loading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const AccessibleLoadingOverlay: React.FC<AccessibleLoadingOverlayProps> = ({
  loading,
  message = 'Loading...',
  children,
}) => {
  return (
    <div className='relative' aria-busy={loading}>
      {children}
      {loading && (
        <>
          <div
            className='absolute inset-0 bg-white/60 flex items-center justify-center z-10'
            aria-hidden='true'
          >
            <div className='h-8 w-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin' />
          </div>
          <VisuallyHidden role='status'>{message}</VisuallyHidden>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Announce Hook
// ============================================================================

export const useAnnounce = () => {
  const [message, setMessage] = useState('');

  const announce = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 1000);
  }, []);

  return { message, announce, Announcer: () => <ScreenReaderAnnouncer message={message} /> };
};

export default SkipLink;
