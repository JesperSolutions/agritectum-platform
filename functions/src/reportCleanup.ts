/**
 * Report Cleanup Functions
 *
 * Handles:
 * - Automatic deletion of soft-deleted reports after 48-hour recovery window
 * - Cleanup of draft reports that exceed 30-day expiration
 * - Audit trail for deleted reports
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Cleanup function - runs daily to delete expired reports
 * Deletes reports that:
 * 1. Were soft-deleted more than 48 hours ago
 * 2. Are draft reports older than 30 days
 */
export const cleanupExpiredReports = onSchedule(
  '0 2 * * *', // Run daily at 2 AM UTC
  async () => {
    try {
      logger.info('Starting expired reports cleanup');

      const now = admin.firestore.Timestamp.now();
      const recoveryWindowMs = 48 * 60 * 60 * 1000; // 48 hours
      const expirationWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days

      const recoveryThreshold = new Date(now.toMillis() - recoveryWindowMs);
      const expirationThreshold = new Date(now.toMillis() - expirationWindowMs);

      let deletedCount = 0;
      let expiredCount = 0;

      // Batch process for performance
      const batchSize = 100;
      let batch = db.batch();
      let batchCount = 0;

      // 1. Delete soft-deleted reports beyond recovery window
      logger.info('Checking for reports to hard-delete (beyond 48-hour recovery window)');
      const softDeletedSnapshot = await db
        .collectionGroup('reports')
        .where('isDeleted', '==', true)
        .where('deletedAt', '<', recoveryThreshold)
        .limit(1000) // Process up to 1000 reports per run
        .get();

      for (const doc of softDeletedSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        deletedCount++;

        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      // 2. Delete old draft reports (30-day expiration)
      logger.info('Checking for expired draft reports (older than 30 days)');
      const expiredDraftsSnapshot = await db
        .collectionGroup('reports')
        .where('status', '==', 'draft')
        .where('isDeleted', '==', false)
        .where('createdAt', '<', expirationThreshold)
        .limit(1000) // Process up to 1000 reports per run
        .get();

      for (const doc of expiredDraftsSnapshot.docs) {
        // Mark as deleted instead of hard-deleting, giving final 48-hour recovery window
        batch.update(doc.ref, {
          isDeleted: true,
          deletedAt: admin.firestore.Timestamp.now(),
          lastEdited: admin.firestore.Timestamp.now(),
          expirationReason: 'Auto-expired after 30 days of inactivity',
        });
        batchCount++;
        expiredCount++;

        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Final batch commit
      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `Cleanup completed: ${deletedCount} hard-deleted, ${expiredCount} marked for expiration`
      );
    } catch (error) {
      logger.error('Error during report cleanup:', error);
      throw new Error(`Report cleanup failed: ${error}`);
    }
  }
);

/**
 * HTTP callable function to manually trigger cleanup
 * Useful for testing and manual cleanup
 */
export const triggerReportCleanup = onCall(
  async request => {
    // Verify the user is authenticated and is an admin
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    try {
      // Check if user is admin (you may need to adjust based on custom claims)
      const user = await admin.auth().getUser(request.auth.uid);
      const customClaims = user.customClaims || {};
      
      if (!customClaims.superadmin) {
        throw new Error('Only superadmins can trigger cleanup');
      }

      const now = admin.firestore.Timestamp.now();
      const recoveryWindowMs = 48 * 60 * 60 * 1000;
      const expirationWindowMs = 30 * 24 * 60 * 60 * 1000;

      const recoveryThreshold = new Date(now.toMillis() - recoveryWindowMs);
      const expirationThreshold = new Date(now.toMillis() - expirationWindowMs);

      let deletedCount = 0;
      let expiredCount = 0;

      // Hard delete soft-deleted reports
      const softDeletedSnapshot = await db
        .collectionGroup('reports')
        .where('isDeleted', '==', true)
        .where('deletedAt', '<', recoveryThreshold)
        .get();

      let batch = db.batch();
      let batchCount = 0;

      for (const doc of softDeletedSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        deletedCount++;

        if (batchCount >= 100) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Mark expired drafts for deletion
      const expiredDraftsSnapshot = await db
        .collectionGroup('reports')
        .where('status', '==', 'draft')
        .where('isDeleted', '==', false)
        .where('createdAt', '<', expirationThreshold)
        .get();

      for (const doc of expiredDraftsSnapshot.docs) {
        batch.update(doc.ref, {
          isDeleted: true,
          deletedAt: admin.firestore.Timestamp.now(),
          lastEdited: admin.firestore.Timestamp.now(),
          expirationReason: 'Manual cleanup by superadmin',
        });
        batchCount++;
        expiredCount++;

        if (batchCount >= 100) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `Manual cleanup completed: ${deletedCount} hard-deleted, ${expiredCount} marked for expiration`
      );

      return {
        success: true,
        hardDeleted: deletedCount,
        expired: expiredCount,
        message: 'Cleanup completed successfully',
      };
    } catch (error: any) {
      logger.error('Error during manual cleanup:', error);
      throw new Error(error.message || 'Cleanup failed');
    }
  }
);
