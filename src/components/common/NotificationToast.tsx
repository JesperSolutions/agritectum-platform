import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'error':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-gray-800';
    }
  };

  if (!isVisible || !mounted) return null;

  return createPortal(
    <div
      className={`fixed top-4 right-4 max-w-sm w-full ${getBackgroundColor()} border rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ zIndex: 100000 }}
    >
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>{getIcon()}</div>
          <div className='ml-3 w-0 flex-1'>
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
          </div>
          <div className='ml-4 flex-shrink-0 flex'>
            <button
              className='inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150'
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationToast;
