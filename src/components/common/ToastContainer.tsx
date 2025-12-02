import React from 'react';
import { useToast, Toast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          iconComponent: CheckCircle,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          iconComponent: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          iconComponent: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          iconComponent: Info,
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${styles.bg} ${styles.border} shadow-lg animate-in slide-in-from-right-full duration-300`}
    >
      <IconComponent className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
      <div className={`flex-1 text-sm ${styles.text}`}>{toast.message}</div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

