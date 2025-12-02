import React, { useEffect, useRef, forwardRef } from 'react';
import { X } from 'lucide-react';
import AccessibleButton from './AccessibleButton';
import { focusManagement, modalAccessibility } from '../utils/accessibility';
import { useIntl } from '../hooks/useIntl';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const AccessibleModal = forwardRef<HTMLDivElement, AccessibleModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      className = '',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const { t } = useIntl();
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const titleId = React.useId();
    const modalId = React.useId();

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    };

    // Handle escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, onClose, closeOnEscape]);

    // Handle focus management
    useEffect(() => {
      if (isOpen) {
        // Store the previously focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Focus the modal
        if (modalRef.current) {
          focusManagement.focusFirstElement(modalRef.current);
        }
      } else {
        // Restore focus to the previously focused element
        if (previousActiveElement.current) {
          focusManagement.restoreFocus(previousActiveElement.current);
        }
      }
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Handle focus trap
    useEffect(() => {
      if (!isOpen || !modalRef.current) return;

      const modal = modalRef.current;
      const focusTrap = focusManagement.focusFirstElement(modal);

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      modal.addEventListener('keydown', handleTabKey);
      return () => modal.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div
        className='fixed inset-0 z-50 overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
      >
        {/* Overlay */}
        <div
          className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
          onClick={handleOverlayClick}
          aria-hidden='true'
        />

        {/* Modal container */}
        <div className='flex min-h-full items-center justify-center p-4'>
          <div
            ref={modalRef}
            className={`
            relative bg-white rounded-lg shadow-xl w-full
            ${sizeClasses[size]}
            ${className}
          `}
            {...modalAccessibility.getModalAttributes(modalId, titleId)}
            {...props}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h2
                id={titleId}
                className='text-lg font-semibold text-gray-900'
                {...modalAccessibility.getHeaderAttributes(titleId)}
              >
                {title}
              </h2>

              {showCloseButton && (
                <AccessibleButton
                  variant='ghost'
                  size='sm'
                  onClick={onClose}
                  aria-label={t('common.closeModal')}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='w-5 h-5' aria-hidden='true' />
                </AccessibleButton>
              )}
            </div>

            {/* Content */}
            <div className='p-6'>{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

AccessibleModal.displayName = 'AccessibleModal';

export default AccessibleModal;
