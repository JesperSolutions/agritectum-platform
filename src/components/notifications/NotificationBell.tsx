import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  Notification,
} from '../../services/notificationService';
import { useIntl } from '../../hooks/useIntl';

export const NotificationBell: React.FC = () => {
  const { t } = useIntl();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications and subscribe to real-time updates
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications(currentUser.uid, { limit: 20 });
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(currentUser.uid, { limit: 20 }, data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.uid) return;
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    // Check if there's an action with navigate type
    if (notification.action?.type === 'navigate' && notification.action.onClick) {
      window.location.href = notification.action.onClick;
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_completed':
        return '📄';
      case 'esg_report_completed':
        return '🌱';
      case 'service_agreement_created':
        return '📋';
      case 'appointment_scheduled':
      case 'appointment_reminder':
        return '📅';
      default:
        return '🔔';
    }
  };

  if (!currentUser) return null;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors'
        aria-label='Notifications'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900'>
              {t('notifications.title') || 'Notifications'}
            </h3>
            <div className='flex items-center space-x-2'>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                >
                  {t('notifications.markAllRead') || 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className='p-1 text-gray-400 hover:text-gray-600 rounded'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <div className='flex items-center justify-center p-8'>
                <div className='w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin' />
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
                <Bell className='w-12 h-12 mb-2 text-gray-300' />
                <p>{t('notifications.empty') || 'No notifications yet'}</p>
              </div>
            ) : (
              <div className='divide-y divide-gray-100'>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className='flex items-start space-x-3'>
                      <div className='flex-shrink-0 text-2xl'>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <p
                            className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={e => handleMarkAsRead(notification.id, e)}
                              className='ml-2 p-1 text-blue-600 hover:text-blue-700 rounded'
                              title={t('notifications.markRead') || 'Mark as read'}
                            >
                              <Check className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                        <p className='mt-1 text-sm text-gray-600 line-clamp-2'>
                          {notification.message}
                        </p>
                        <p className='mt-1 text-xs text-gray-400'>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='p-3 border-t border-gray-200 text-center'>
              <button
                onClick={() => {
                  window.location.href = '/portal/notifications';
                  setIsOpen(false);
                }}
                className='text-sm text-blue-600 hover:text-blue-700 font-medium'
              >
                {t('notifications.viewAll') || 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
