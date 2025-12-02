/**
 * Notification Service
 * 
 * Handles all notification-related operations including:
 * - Creating, reading, updating, and deleting notifications
 * - Real-time notification subscriptions
 * - Notification statistics and analytics
 * - Event-triggered notifications for reports, users, emails, and system events
 * 
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2024-09-22
 */

import { 
  db, 
  auth 
} from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { User } from 'firebase/auth';

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  const cleanedEntries = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

  return cleanedEntries as T;
};

/**
 * Notification Interface
 * 
 * Defines the structure of a notification object stored in Firestore
 */
export interface Notification {
  id: string;                    // Unique notification identifier
  userId: string;                // ID of the user who owns this notification
  type: 'info' | 'warning' | 'success' | 'error' | 'urgent';  // Notification type for styling
  title: string;                 // Notification title (displayed in bold)
  message: string;               // Notification message content
  timestamp: Date;               // When the notification was created
  read: boolean;                 // Whether the user has read this notification
  action?: {                     // Optional action button
    label: string;               // Text for the action button
    onClick: string;             // URL or action identifier
    type: 'navigate' | 'api' | 'modal';  // Type of action
  };
  metadata?: {                   // Additional notification metadata
    reportId?: string;           // Associated report ID
    userId?: string;             // Associated user ID
    branchId?: string;           // Associated branch ID
    customerId?: string;         // Associated customer ID
    priority?: 'low' | 'medium' | 'high' | 'urgent';  // Notification priority
    category?: 'report' | 'user' | 'system' | 'email' | 'security';  // Notification category
  };
  expiresAt?: Date;              // Optional expiration date for the notification
  createdAt: Date;              // When the notification was created in the database
  updatedAt: Date;              // When the notification was last updated
}

export interface NotificationFilters {
  type?: string;
  read?: boolean;
  category?: string;
  priority?: string;
  limit?: number;
  startAfter?: string; // Document ID for pagination
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  recent: Notification[];
}

/**
 * Create a new notification
 */
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'read'>
): Promise<string> => {
  try {
    const sanitizedNotification = removeUndefinedFields({
      ...notification,
      ...(notification.metadata
        ? { metadata: removeUndefinedFields(notification.metadata) }
        : {}),
    });

    const notificationData = {
      ...sanitizedNotification,
      userId,
      timestamp: serverTimestamp(),
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Notification created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Create multiple notifications in a batch
 */
export const createBatchNotifications = async (
  notifications: Array<{
    userId: string;
    notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'read'>;
  }>
): Promise<string[]> => {
  try {
    const batch = writeBatch(db);
    const notificationIds: string[] = [];

    notifications.forEach(({ userId, notification }) => {
      const docRef = doc(collection(db, 'notifications'));
      notificationIds.push(docRef.id);
      
      const sanitizedNotification = removeUndefinedFields({
        ...notification,
        ...(notification.metadata
          ? { metadata: removeUndefinedFields(notification.metadata) }
          : {}),
      });

      const notificationData = {
        ...sanitizedNotification,
        userId,
        timestamp: serverTimestamp(),
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(docRef, notificationData);
    });

    await batch.commit();
    console.log('✅ Batch notifications created:', notificationIds.length);
    return notificationIds;
  } catch (error) {
    console.error('❌ Error creating batch notifications:', error);
    throw error;
  }
};

/**
 * Get notifications for a user with filters
 */
export const getNotifications = async (
  userId: string,
  filters: NotificationFilters = {}
): Promise<Notification[]> => {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    if (filters.read !== undefined) {
      q = query(q, where('read', '==', filters.read));
    }

    if (filters.category) {
      q = query(q, where('metadata.category', '==', filters.category));
    }

    if (filters.priority) {
      q = query(q, where('metadata.priority', '==', filters.priority));
    }

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp?.toDate() || new Date(),
        read: data.read || false,
        action: data.action,
        metadata: data.metadata,
        expiresAt: data.expiresAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // Sort manually in JavaScript (newest first)
    notifications.sort((a, b) => {
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    console.log(`✅ Retrieved ${notifications.length} notifications for user ${userId}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    throw error;
  }
};

/**
 * Get real-time notifications for a user
 */
export const subscribeToNotifications = (
  userId: string,
  filters: NotificationFilters = {},
  callback: (notifications: Notification[]) => void
): (() => void) => {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(filters.limit || 50) // Default limit of 50 notifications
    );

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    if (filters.read !== undefined) {
      q = query(q, where('read', '==', filters.read));
    }

    if (filters.category) {
      q = query(q, where('metadata.category', '==', filters.category));
    }

    if (filters.priority) {
      q = query(q, where('metadata.priority', '==', filters.priority));
    }

    // Limit is already applied in the base query

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const notifications: Notification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false,
          action: data.action,
          metadata: data.metadata,
          expiresAt: data.expiresAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      // Sort manually in JavaScript (newest first)
      notifications.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      console.log(`📡 Real-time update: ${notifications.length} notifications for user ${userId}`);
      callback(notifications);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up notification subscription:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark multiple notifications as read
 */
export const markNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const docRef = doc(db, 'notifications', id);
      batch.update(docRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('✅ Marked notifications as read:', notificationIds.length);
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notifications = await getNotifications(userId, { read: false });
    const notificationIds = notifications.map(n => n.id);
    
    if (notificationIds.length > 0) {
      await markNotificationsAsRead(notificationIds);
    }
    
    console.log('✅ All notifications marked as read for user:', userId);
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    console.log('✅ Notification deleted:', notificationId);
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete multiple notifications
 */
export const deleteNotifications = async (notificationIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const docRef = doc(db, 'notifications', id);
      batch.delete(docRef);
    });

    await batch.commit();
    console.log('✅ Deleted notifications:', notificationIds.length);
  } catch (error) {
    console.error('❌ Error deleting notifications:', error);
    throw error;
  }
};

/**
 * Delete old notifications (cleanup)
 */
export const deleteOldNotifications = async (olderThanDays: number = 30): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const q = query(
      collection(db, 'notifications'),
      where('createdAt', '<', Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(q);
    const notificationIds: string[] = [];

    snapshot.forEach((doc) => {
      notificationIds.push(doc.id);
    });

    if (notificationIds.length > 0) {
      await deleteNotifications(notificationIds);
      console.log(`✅ Deleted ${notificationIds.length} old notifications`);
    } else {
      console.log('✅ No old notifications to delete');
    }
  } catch (error) {
    console.error('❌ Error deleting old notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId: string): Promise<NotificationStats> => {
  try {
    const allNotifications = await getNotifications(userId);
    
    const stats: NotificationStats = {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.read).length,
      byType: {},
      byCategory: {},
      recent: allNotifications.slice(0, 5),
    };

    // Count by type
    allNotifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      if (notification.metadata?.category) {
        stats.byCategory[notification.metadata.category] = 
          (stats.byCategory[notification.metadata.category] || 0) + 1;
      }
    });

    console.log('✅ Notification stats retrieved for user:', userId);
    return stats;
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    throw error;
  }
};

/**
 * Create notification for report events
 */
export const createReportNotification = async (
  userId: string,
  reportId: string,
  eventType: 'created' | 'updated' | 'completed' | 'approved' | 'rejected',
  reportTitle: string,
  branchId?: string
): Promise<string> => {
  const eventMessages = {
    created: 'En ny rapport har skapats',
    updated: 'En rapport har uppdaterats',
    completed: 'En rapport har slutförts',
    approved: 'En rapport har godkänts',
    rejected: 'En rapport har avvisats',
  };

  const eventTypes = {
    created: 'info',
    updated: 'info',
    completed: 'success',
    approved: 'success',
    rejected: 'error',
  } as const;

  return createNotification(userId, {
    type: eventTypes[eventType],
    title: `Rapport ${eventType === 'created' ? 'skapad' : eventType === 'updated' ? 'uppdaterad' : eventType === 'completed' ? 'slutförd' : eventType === 'approved' ? 'godkänd' : 'avvisad'}`,
    message: `${eventMessages[eventType]}: ${reportTitle || 'Untitled Report'}`,
    action: {
      label: 'Visa rapport',
      onClick: `/report/view/${reportId}`,
      type: 'navigate',
    },
    metadata: {
      reportId,
      branchId,
      category: 'report',
      priority: eventType === 'rejected' ? 'high' : 'medium',
    },
  });
};

/**
 * Notify branch managers when a report is created/updated/completed
 * This creates notifications for all branch admins in the report's branch
 */
export const notifyBranchManagersOnReportCreation = async (
  branchId: string | undefined,
  reportId: string,
  reportTitle: string,
  eventType: 'created' | 'updated' | 'completed' = 'created'
): Promise<void> => {
  try {
    if (!branchId) {
      console.warn('⚠️ No branchId provided, skipping branch manager notifications');
      return;
    }

    // Import here to avoid circular dependencies
    const { getBranchManagersForNotification } = await import('./notificationHelper');
    const branchManagerIds = await getBranchManagersForNotification(branchId);

    if (branchManagerIds.length === 0) {
      console.log(`ℹ️ No branch managers found for branch ${branchId}`);
      return;
    }

    // Create notifications for all branch managers
    const notificationType: 'info' | 'success' = eventType === 'completed' ? 'success' : 'info';
    const notifications = branchManagerIds.map(userId => ({
      userId,
      notification: {
        type: notificationType,
        title: `Rapport ${eventType === 'created' ? 'skapad' : eventType === 'updated' ? 'uppdaterad' : 'slutförd'}`,
        message: `En ${eventType === 'created' ? 'ny rapport har skapats' : eventType === 'updated' ? 'rapport har uppdaterats' : 'rapport har slutförts'}: ${reportTitle}`,
        action: {
          label: 'Visa rapport',
          onClick: `/report/view/${reportId}`,
          type: 'navigate' as const,
        },
        metadata: {
          reportId,
          branchId,
          category: 'report' as const,
          priority: 'medium' as const,
        },
      },
    }));

    await createBatchNotifications(notifications);
    console.log(`✅ Notified ${branchManagerIds.length} branch manager(s) about report ${reportId}`);
  } catch (error) {
    console.error('❌ Error notifying branch managers:', error);
    // Don't throw - notification failure should not block report creation
  }
};

/**
 * Create notification for user events
 */
export const createUserNotification = async (
  userId: string,
  eventType: 'created' | 'updated' | 'deleted' | 'role_changed',
  userName: string,
  branchId?: string
): Promise<string> => {
  const eventMessages = {
    created: 'En ny användare har skapats',
    updated: 'En användare har uppdaterats',
    deleted: 'En användare har tagits bort',
    role_changed: 'En användares roll har ändrats',
  };

  return createNotification(userId, {
    type: 'info',
    title: `Användare ${eventType === 'created' ? 'skapad' : eventType === 'updated' ? 'uppdaterad' : eventType === 'deleted' ? 'borttagen' : 'roll ändrad'}`,
    message: `${eventMessages[eventType]}: ${userName}`,
    action: {
      label: 'Visa användare',
      onClick: '/admin/users',
      type: 'navigate',
    },
    metadata: {
      userId,
      branchId,
      category: 'user',
      priority: 'medium',
    },
  });
};

/**
 * Create notification for system events
 */
export const createSystemNotification = async (
  userId: string,
  eventType: 'maintenance' | 'update' | 'security' | 'backup',
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<string> => {
  return createNotification(userId, {
    type: priority === 'urgent' ? 'urgent' : priority === 'high' ? 'error' : 'info',
    title,
    message,
    metadata: {
      category: 'system',
      priority,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
};

/**
 * Create notification for email events
 */
export const createEmailNotification = async (
  userId: string,
  eventType: 'sent' | 'failed' | 'delivered' | 'bounced',
  recipient: string,
  subject: string,
  branchId?: string
): Promise<string> => {
  const eventMessages = {
    sent: 'E-post skickat',
    failed: 'E-post misslyckades',
    delivered: 'E-post levererat',
    bounced: 'E-post returnerat',
  };

  const eventTypes = {
    sent: 'success',
    failed: 'error',
    delivered: 'success',
    bounced: 'warning',
  } as const;

  return createNotification(userId, {
    type: eventTypes[eventType],
    title: eventMessages[eventType],
    message: `Till: ${recipient} - ${subject}`,
    metadata: {
      branchId,
      category: 'email',
      priority: eventType === 'failed' || eventType === 'bounced' ? 'high' : 'low',
    },
  });
};

/**
 * Create notification for service agreements due this week
 */
export const createServiceAgreementDueNotification = async (
  userId: string,
  agreementCount: number,
  branchId?: string
): Promise<string> => {
  return createNotification(userId, {
    type: agreementCount > 5 ? 'warning' : 'info',
    title: 'Serviceavtal förfaller snart',
    message: `${agreementCount} serviceavtal förfaller denna vecka. Kontrollera dem i Serviceavtal-modulen.`,
    action: {
      label: 'Visa serviceavtal',
      onClick: '/admin/service-agreements',
      type: 'navigate',
    },
    metadata: {
      branchId,
      category: 'serviceAgreement',
      priority: agreementCount > 5 ? 'high' : 'medium',
    },
  });
};