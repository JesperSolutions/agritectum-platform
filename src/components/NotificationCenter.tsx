/**
 * Notification Center Component
 *
 * A comprehensive notification management interface that provides:
 * - Real-time notification display
 * - Interactive notification actions
 * - Notification management (mark as read, delete)
 * - Settings panel integration
 * - Swedish localization support
 *
 * Features:
 * - Live updates from Firestore
 * - Priority-based styling
 * - Action buttons for navigation
 * - Unread count badge
 * - Responsive design
 *
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2024-09-22
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Settings,
  Trash2,
} from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationSettings from './NotificationSettings';
import { logger } from '../utils/logger';

const NotificationCenter: React.FC = () => {
  const { t } = useIntl();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleActionClick = async (notification: any) => {
    // Mark as read when action is clicked
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Handle navigation
    if (notification.action?.type === 'navigate' && notification.action?.onClick) {
      window.location.href = notification.action.onClick;
    } else if (notification.action?.onClick) {
      // Handle other action types
      logger.log('Action clicked:', notification.action.onClick);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-600' />;
      case 'error':
        return <AlertTriangle className='w-5 h-5 text-red-600' />;
      case 'urgent':
        return <AlertTriangle className='w-5 h-5 text-red-600' />;
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'info':
        return <Info className='w-5 h-5 text-blue-600' />;
      default:
        return <Info className='w-5 h-5 text-gray-600' />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (!read) {
      return 'bg-blue-50 border-blue-200';
    }

    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { count: diffInMinutes });
    if (diffInMinutes < 1440)
      return t('notifications.hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    return t('notifications.daysAgo', { count: Math.floor(diffInMinutes / 1440) });
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Modal Overlay - Rendered via Portal to always be on top */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'
            style={{ zIndex: 99999 }}
            onClick={() => setIsOpen(false)}
          >
            {/* Notification Panel */}
            <div
              className='bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col'
              style={{ zIndex: 100000 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className='p-4 border-b border-gray-200 flex-shrink-0'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {t('notifications.title')}
                  </h3>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => setShowSettings(true)}
                      className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                      title={t('notifications.settings')}
                    >
                      <Settings className='w-4 h-4' />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className='text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition-colors'
                      >
                        {t('notifications.markAllAsRead')}
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className='flex-1 overflow-y-auto'>
                {loading ? (
                  <div className='p-4 text-center text-gray-500'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2'></div>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : error ? (
                  <div className='p-4 text-center text-red-500'>
                    <AlertTriangle className='w-6 h-6 mx-auto mb-2' />
                    <p>{error}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className='p-4 text-center text-gray-500'>
                    <Bell className='w-8 h-8 mx-auto mb-2 text-gray-300' />
                    <p>{t('notifications.noNotifications')}</p>
                  </div>
                ) : (
                  <div className='divide-y divide-gray-200'>
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${getBgColor(
                          notification.type,
                          notification.read
                        )}`}
                      >
                        <div className='flex items-start space-x-3'>
                          <div className='flex-shrink-0 mt-0.5'>{getIcon(notification.type)}</div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0'>
                              <p
                                className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <div className='flex items-center justify-between sm:justify-end space-x-2'>
                                <span className='text-xs text-gray-500'>
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className='text-gray-400 hover:text-red-600'
                                  title={t('notifications.delete')}
                                >
                                  <Trash2 className='w-3 h-3' />
                                </button>
                              </div>
                            </div>
                            <p className='text-sm text-gray-600 mt-1 break-words'>
                              {notification.message}
                            </p>
                            {notification.action && (
                              <button
                                onClick={() => handleActionClick(notification)}
                                className='mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
                              >
                                {notification.action.label}
                              </button>
                            )}
                            {notification.metadata?.priority && (
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                  notification.metadata.priority === 'urgent'
                                    ? 'bg-red-100 text-red-800'
                                    : notification.metadata.priority === 'high'
                                      ? 'bg-orange-100 text-orange-800'
                                      : notification.metadata.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {t(`notifications.priority.${notification.metadata.priority}`)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='p-4 border-t border-gray-200 flex-shrink-0'>
                <button className='w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2'>
                  <Download className='w-4 h-4' />
                  <span>{t('notifications.exportNotifications')}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <NotificationSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default NotificationCenter;
