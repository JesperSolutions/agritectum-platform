/**
 * Notification Context
 *
 * Provides real-time notification management throughout the application.
 * Handles notification state, real-time updates, and user interactions.
 *
 * Features:
 * - Real-time Firestore subscriptions
 * - Notification CRUD operations
 * - Statistics and analytics
 * - Error handling and loading states
 * - Automatic cleanup on unmount
 *
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2024-09-22
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { logger } from '../utils/logger';
import {
  Notification,
  subscribeToNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationStats,
} from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showError: showToastError } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notification stats
  const loadStats = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const notificationStats = await getNotificationStats(currentUser.uid);
      setStats(notificationStats);
    } catch (err: any) {
      logger.error('Error loading notification stats:', err);
      // Don't show toast for background stats loading
    }
  }, [currentUser?.uid]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);

    try {
      await loadStats();
    } catch (err: any) {
      logger.error('Error refreshing notifications:', err);
      const errorMessage = 'Failed to refresh notifications';
      setError(errorMessage);
      showToastError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, loadStats]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotificationAsRead(notificationId);

        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );

        // Update stats
        if (stats) {
          setStats(prev =>
            prev
              ? {
                  ...prev,
                  unread: Math.max(0, prev.unread - 1),
                }
              : null
          );
        }
      } catch (err: any) {
        logger.error('Error marking notification as read:', err);
        const errorMessage = 'Failed to mark notification as read';
        setError(errorMessage);
        showToastError(errorMessage);
      }
    },
    [stats]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Update stats
      setStats(prev =>
        prev
          ? {
              ...prev,
              unread: 0,
            }
          : null
      );
    } catch (err: any) {
      logger.error('Error marking all notifications as read:', err);
      const errorMessage = 'Failed to mark all notifications as read';
      setError(errorMessage);
      showToastError(errorMessage);
    }
  }, [currentUser?.uid]);

  // Delete notification
  const deleteNotificationHandler = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification(notificationId);

        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // Update stats
        if (stats) {
          const deletedNotification = notifications.find(n => n.id === notificationId);
          setStats(prev =>
            prev
              ? {
                  ...prev,
                  total: prev.total - 1,
                  unread:
                    deletedNotification && !deletedNotification.read
                      ? Math.max(0, prev.unread - 1)
                      : prev.unread,
                }
              : null
          );
        }
      } catch (err: any) {
        logger.error('Error deleting notification:', err);
        const errorMessage = 'Failed to delete notification';
        setError(errorMessage);
        showToastError(errorMessage);
      }
    },
    [notifications, stats]
  );

  // Set up real-time listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Subscribe to real-time notifications
      const unsubscribeFn = subscribeToNotifications(
        currentUser.uid,
        { limit: 50 }, // Limit to 50 most recent notifications
        newNotifications => {
          setNotifications(newNotifications);
          setLoading(false);
        }
      );

      setUnsubscribe(() => unsubscribeFn);

      // Load initial stats
      loadStats();
    } catch (err: any) {
      logger.error('Error setting up notification listener:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }

    // Cleanup on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    };
  }, [currentUser?.uid, loadStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const value: NotificationContextType = {
    notifications,
    stats,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationHandler,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
