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
        return <Trash2 className={`${iconClass} text-[#DA5062]`} />;
      case 'edit':
        return <Edit className={`${iconClass} text-[#7DA8CC]`} />;
      case 'user-x':
        return <UserX className={`${iconClass} text-[#DA5062]`} />;
      case 'user-check':
        return <UserCheck className={`${iconClass} text-[#A1BA53]`} />;
      case 'check':
        return <CheckCircle className={`${iconClass} text-[#A1BA53]`} />;
      default:
        return <AlertTriangle className={`${iconClass} text-[#DA5062]`} />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'danger':
        return {
          container: 'bg-[#DA5062]/15',
          icon: 'text-[#DA5062]',
          confirmButton: 'bg-[#DA5062] hover:bg-[#c23d4f] text-white',
        };
      case 'warning':
        return {
          container: 'bg-[#DA5062]/10',
          icon: 'text-[#DA5062]',
          confirmButton: 'bg-[#DA5062] hover:bg-[#c23d4f] text-white',
        };
      case 'info':
        return {
          container: 'bg-[#7DA8CC]/15',
          icon: 'text-[#7DA8CC]',
          confirmButton: 'bg-[#7DA8CC] hover:bg-[#6890b3] text-white',
        };
      case 'success':
        return {
          container: 'bg-[#A1BA53]/15',
          icon: 'text-[#A1BA53]',
          confirmButton: 'bg-[#A1BA53] hover:bg-[#8a9f47] text-white',
        };
      default:
        return {
          container: 'bg-[#DA5062]/15',
          icon: 'text-[#DA5062]',
          confirmButton: 'bg-[#DA5062] hover:bg-[#c23d4f] text-white',
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
              className='px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium shadow-sm disabled:opacity-50'
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
