import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  UserX,
  UserCheck,
  X,
} from 'lucide-react';
import { getButtonClasses } from '../../../design-system/components';
import { colors } from '../../../design-system/tokens';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: 'trash' | 'edit' | 'user-x' | 'user-check' | 'alert' | 'check';
  isLoading?: boolean;
}

/**
 * Enhanced ConfirmDialog component using design system tokens
 * Provides consistent modal styling with semantic types
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon = 'alert',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    const iconClass = 'h-6 w-6';
    switch (icon) {
      case 'trash':
        return <Trash2 className={`${iconClass} text-red-600`} />;
      case 'edit':
        return <Edit className={`${iconClass} text-blue-600`} />;
      case 'user-x':
        return <UserX className={`${iconClass} text-red-600`} />;
      case 'user-check':
        return <UserCheck className={`${iconClass} text-green-600`} />;
      case 'check':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      default:
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'danger':
        return {
          container: colors.semantic.error.bg,
          icon: colors.semantic.error.text,
          confirmButton: colors.button.danger.className,
        };
      case 'warning':
        return {
          container: colors.semantic.warning.bg,
          icon: colors.semantic.warning.text,
          confirmButton: getButtonClasses('primary'),
        };
      case 'info':
        return {
          container: colors.semantic.info.bg,
          icon: colors.semantic.info.text,
          confirmButton: getButtonClasses('primary'),
        };
      case 'success':
        return {
          container: colors.semantic.success.bg,
          icon: colors.semantic.success.text,
          confirmButton: getButtonClasses('primary'),
        };
      default:
        return {
          container: colors.semantic.error.bg,
          icon: colors.semantic.error.text,
          confirmButton: colors.button.danger.className,
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className='fixed inset-0 bg-slate-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center'>
      <div className='relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors'
          aria-label='Close dialog'
        >
          <X className='h-5 w-5' />
        </button>

        <div className='text-center'>
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${typeClasses.container} mb-4`}
          >
            {getIcon()}
          </div>
          <h3 className='text-lg font-semibold text-slate-900 mb-2'>{title}</h3>
          <div className='mb-6'>
            <p className='text-sm text-slate-600'>{message}</p>
          </div>
          <div className='flex justify-center space-x-4'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={getButtonClasses('secondary')}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`${typeClasses.confirmButton} disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
