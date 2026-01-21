/**
 * Toast Context
 * Provides global toast notification management throughout the application.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));

    // Clear timeout if it exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      };

      setToasts(prev => [...prev, newToast]);

      // Auto-remove toast after duration
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, duration);

        timeoutRefs.current.set(id, timeoutId);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string) => {
      return showToast(message, 'success', 4000);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      return showToast(message, 'error', 5000); // Errors stay longer for readability
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      return showToast(message, 'warning', 4000);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      return showToast(message, 'info', 4000);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};
