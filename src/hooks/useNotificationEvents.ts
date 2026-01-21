/**
 * Notification Event Hooks
 *
 * Custom hooks for triggering notifications based on application events.
 * Provides easy-to-use functions for creating notifications when:
 * - Reports are created, updated, completed, approved, or rejected
 * - Users are created, updated, deleted, or have role changes
 * - System events occur (maintenance, updates, security alerts)
 * - Email events happen (sent, failed, delivered, bounced)
 *
 * These hooks automatically handle user context and error handling.
 *
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2024-09-22
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntl } from './useIntl';
import {
  createReportNotification,
  createUserNotification,
  createSystemNotification,
  createEmailNotification,
} from '../services/notificationService';
import { Report } from '../types';
import { logger } from '../utils/logger';

/**
 * Hook to handle report-related notifications
 */
export const useReportNotifications = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();

  const notifyReportCreated = useCallback(
    async (report: Report) => {
      if (!currentUser?.uid) return;

      try {
        await createReportNotification(
          currentUser.uid,
          report.id,
          'created',
          report.title || t('form.defaults.untitledReport'),
          report.branchId
        );
      } catch (error) {
        console.error('Error creating report notification:', error);
      }
    },
    [currentUser?.uid, t]
  );

  const notifyReportUpdated = useCallback(
    async (report: Report) => {
      if (!currentUser?.uid) return;

      try {
        await createReportNotification(
          currentUser.uid,
          report.id,
          'updated',
          report.title || t('form.defaults.untitledReport'),
          report.branchId
        );
      } catch (error) {
        console.error('Error creating report update notification:', error);
      }
    },
    [currentUser?.uid, t]
  );

  const notifyReportCompleted = useCallback(
    async (report: Report) => {
      if (!currentUser?.uid) return;

      try {
        await createReportNotification(
          currentUser.uid,
          report.id,
          'completed',
          report.title || t('form.defaults.untitledReport'),
          report.branchId
        );
      } catch (error) {
        console.error('Error creating report completion notification:', error);
      }
    },
    [currentUser?.uid, t]
  );

  const notifyReportApproved = useCallback(
    async (report: Report) => {
      if (!currentUser?.uid) return;

      try {
        await createReportNotification(
          currentUser.uid,
          report.id,
          'approved',
          report.title || t('form.defaults.untitledReport'),
          report.branchId
        );
      } catch (error) {
        console.error('Error creating report approval notification:', error);
      }
    },
    [currentUser?.uid, t]
  );

  const notifyReportRejected = useCallback(
    async (report: Report) => {
      if (!currentUser?.uid) return;

      try {
        await createReportNotification(
          currentUser.uid,
          report.id,
          'rejected',
          report.title || t('form.defaults.untitledReport'),
          report.branchId
        );
      } catch (error) {
        console.error('Error creating report rejection notification:', error);
      }
    },
    [currentUser?.uid, t]
  );

  return {
    notifyReportCreated,
    notifyReportUpdated,
    notifyReportCompleted,
    notifyReportApproved,
    notifyReportRejected,
  };
};

/**
 * Hook to handle user-related notifications
 */
export const useUserNotifications = () => {
  const { currentUser } = useAuth();

  const notifyUserCreated = useCallback(
    async (userName: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createUserNotification(currentUser.uid, 'created', userName, branchId);
      } catch (error) {
        console.error('Error creating user notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyUserUpdated = useCallback(
    async (userName: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createUserNotification(currentUser.uid, 'updated', userName, branchId);
      } catch (error) {
        console.error('Error creating user update notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyUserDeleted = useCallback(
    async (userName: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createUserNotification(currentUser.uid, 'deleted', userName, branchId);
      } catch (error) {
        console.error('Error creating user deletion notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyRoleChanged = useCallback(
    async (userName: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createUserNotification(currentUser.uid, 'role_changed', userName, branchId);
      } catch (error) {
        console.error('Error creating role change notification:', error);
      }
    },
    [currentUser?.uid]
  );

  return {
    notifyUserCreated,
    notifyUserUpdated,
    notifyUserDeleted,
    notifyRoleChanged,
  };
};

/**
 * Hook to handle system notifications
 */
export const useSystemNotifications = () => {
  const { currentUser } = useAuth();

  const notifyMaintenance = useCallback(
    async (title: string, message: string) => {
      if (!currentUser?.uid) return;

      try {
        await createSystemNotification(currentUser.uid, 'maintenance', title, message, 'medium');
      } catch (error) {
        console.error('Error creating maintenance notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyUpdate = useCallback(
    async (title: string, message: string) => {
      if (!currentUser?.uid) return;

      try {
        await createSystemNotification(currentUser.uid, 'update', title, message, 'low');
      } catch (error) {
        console.error('Error creating update notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifySecurity = useCallback(
    async (title: string, message: string) => {
      if (!currentUser?.uid) return;

      try {
        await createSystemNotification(currentUser.uid, 'security', title, message, 'urgent');
      } catch (error) {
        console.error('Error creating security notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyBackup = useCallback(
    async (title: string, message: string) => {
      if (!currentUser?.uid) return;

      try {
        await createSystemNotification(currentUser.uid, 'backup', title, message, 'low');
      } catch (error) {
        console.error('Error creating backup notification:', error);
      }
    },
    [currentUser?.uid]
  );

  return {
    notifyMaintenance,
    notifyUpdate,
    notifySecurity,
    notifyBackup,
  };
};

/**
 * Hook to handle email notifications
 */
export const useEmailNotifications = () => {
  const { currentUser } = useAuth();

  const notifyEmailSent = useCallback(
    async (recipient: string, subject: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createEmailNotification(currentUser.uid, 'sent', recipient, subject, branchId);
      } catch (error) {
        console.error('Error creating email sent notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyEmailFailed = useCallback(
    async (recipient: string, subject: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createEmailNotification(currentUser.uid, 'failed', recipient, subject, branchId);
      } catch (error) {
        console.error('Error creating email failed notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyEmailDelivered = useCallback(
    async (recipient: string, subject: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createEmailNotification(currentUser.uid, 'delivered', recipient, subject, branchId);
      } catch (error) {
        console.error('Error creating email delivered notification:', error);
      }
    },
    [currentUser?.uid]
  );

  const notifyEmailBounced = useCallback(
    async (recipient: string, subject: string, branchId?: string) => {
      if (!currentUser?.uid) return;

      try {
        await createEmailNotification(currentUser.uid, 'bounced', recipient, subject, branchId);
      } catch (error) {
        console.error('Error creating email bounced notification:', error);
      }
    },
    [currentUser?.uid]
  );

  return {
    notifyEmailSent,
    notifyEmailFailed,
    notifyEmailDelivered,
    notifyEmailBounced,
  };
};

/**
 * Hook to handle all notification events
 */
export const useNotificationEvents = () => {
  const reportNotifications = useReportNotifications();
  const userNotifications = useUserNotifications();
  const systemNotifications = useSystemNotifications();
  const emailNotifications = useEmailNotifications();

  return {
    ...reportNotifications,
    ...userNotifications,
    ...systemNotifications,
    ...emailNotifications,
  };
};
