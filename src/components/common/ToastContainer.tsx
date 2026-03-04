import React from 'react';
import { useToast, Toast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-[#A1BA53]/10',
          border: 'border-[#A1BA53]/30',
          text: 'text-[#5c6a2f]',
          icon: 'text-[#A1BA53]',
          iconComponent: CheckCircle,
        };
      case 'error':
        return {
          bg: 'bg-[#DA5062]/10',
          border: 'border-[#DA5062]/30',
          text: 'text-[#872a38]',
          icon: 'text-[#DA5062]',
          iconComponent: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-[#DA5062]/10',
          border: 'border-[#DA5062]/30',
          text: 'text-[#872a38]',
          icon: 'text-[#DA5062]',
          iconComponent: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#7DA8CC]/10',
          border: 'border-[#7DA8CC]/30',
          text: 'text-[#476279]',
          icon: 'text-[#7DA8CC]',
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
        aria-label='Close'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-20 right-4 z-50 space-y-2 max-w-md'>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
