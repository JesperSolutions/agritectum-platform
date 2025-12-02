import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Edit, UserX, UserCheck } from 'lucide-react';

interface ConfirmationDialogProps {
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

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
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
          container: 'bg-red-100',
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          container: 'bg-yellow-100',
          icon: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'info':
        return {
          container: 'bg-blue-100',
          icon: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'success':
        return {
          container: 'bg-green-100',
          icon: 'text-green-600',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
        };
      default:
        return {
          container: 'bg-red-100',
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
        <div className='mt-3 text-center'>
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${typeClasses.container}`}
          >
            {getIcon()}
          </div>
          <h3 className='text-lg font-medium text-gray-900 mt-4'>{title}</h3>
          <div className='mt-2 px-7 py-3'>
            <p className='text-sm text-gray-500'>{message}</p>
          </div>
          <div className='flex justify-center space-x-4 mt-4'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className='px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50'
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${typeClasses.confirmButton}`}
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

export default ConfirmationDialog;
