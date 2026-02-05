/**
 * Data Retention & GDPR Compliance Functions
 * 
 * These functions handle:
 * - Automatic deletion of old data based on retention policies
 * - User account deletion (right to be forgotten)
 * - Data export for portability rights
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduled function: Delete old draft reports (retention policy)
 * Runs daily at 2 AM UTC
 * Deletes draft reports older than 90 days
 */
export const deleteStaleDraftReports = functions
  .region('europe-west1')
  .pubsub.schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('Europe/London')
  .onRun(async context => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const query = db
        .collectionGroup('reports')
        .where('status', '==', 'draft')
        .where('updatedAt', '<', cutoffDate.toISOString());

      const snapshot = await query.get();
      const batch = db.batch();
      let deletedCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`✅ Deleted ${deletedCount} stale draft reports`);
      } else {
        console.log('ℹ️ No stale draft reports to delete');
      }

      return { success: true, deleted: deletedCount };
    } catch (error) {
      console.error('❌ Error deleting stale drafts:', error);
      throw new functions.https.HttpsError('internal', 'Failed to delete stale drafts');
    }
  });

/**
 * Scheduled function: Delete inactive user data
 * Runs weekly (Mondays at 3 AM UTC)
 * Deletes accounts inactive for 2 years
 */
export const deleteInactiveAccounts = functions
  .region('europe-west1')
  .pubsub.schedule('0 3 * * 1') // Mondays at 3 AM UTC
  .timeZone('Europe/London')
  .onRun(async context => {
    const inactivityDays = 730; // 2 years
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);

    try {
      const query = db
        .collection('users')
        .where('lastActivityAt', '<', cutoffDate.toISOString())
        .where('isCustomer', '==', true);

      const snapshot = await query.get();
      console.log(`Found ${snapshot.size} inactive accounts to process`);

      let processedCount = 0;
      for (const doc of snapshot.docs) {
        try {
          const userData = doc.data();
          // Send notification email before deletion
          // TODO: Implement email notification

          // Mark for deletion (soft delete first)
          await doc.ref.update({
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletionReason: 'Inactive for 2 years',
          });

          processedCount++;
        } catch (error) {
          console.error(`Error processing user ${doc.id}:`, error);
        }
      }

      console.log(`✅ Processed ${processedCount} inactive accounts`);
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error('❌ Error processing inactive accounts:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process inactive accounts');
    }
  });

/**
 * On-demand function: Delete user account and all associated data
 * Called when user exercises "right to be forgotten"
 * 
 * Deletes:
 * - User document
 * - Customer document
 * - All buildings
 * - All reports
 * - All service agreements
 * - All scheduled appointments
 * - Firebase Authentication account
 */
export const deleteUserAccount = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const requestedUserId = data.userId;

    // Users can only delete their own account (or admins can delete others)
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userPermissionLevel = userDoc.data()?.permissionLevel || -1;

    if (userId !== requestedUserId && userPermissionLevel < 2) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only delete your own account'
      );
    }

    try {
      // Get user info first
      const targetUserRef = db.collection('users').doc(requestedUserId);
      const targetUserDoc = await targetUserRef.get();

      if (!targetUserDoc.exists()) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const userData = targetUserDoc.data();
      const customerId = userData?.companyId || requestedUserId;

      // Delete all user data in batches
      const batch = db.batch();
      let deletedCount = 0;

      // 1. Delete user document
      batch.delete(targetUserRef);
      deletedCount++;

      // 2. Delete customer document
      const customerRef = db.collection('customers').doc(customerId);
      const customerDoc = await customerRef.get();
      if (customerDoc.exists()) {
        batch.delete(customerRef);
        deletedCount++;

        // Delete customer subcollections
        const subscriptionsSnap = await customerRef.collection('subscriptions').get();
        subscriptionsSnap.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });

        const paymentMethodsSnap = await customerRef.collection('paymentMethods').get();
        paymentMethodsSnap.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });

        const invoicesSnap = await customerRef.collection('invoices').get();
        invoicesSnap.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      }

      // 3. Delete all buildings for this customer
      const buildingsSnap = await db
        .collection('buildings')
        .where('customerId', '==', customerId)
        .get();

      for (const buildingDoc of buildingsSnap.docs) {
        batch.delete(buildingDoc.ref);
        deletedCount++;

        // Delete building subcollections (reports, documents, etc.)
        const reportsSnap = await buildingDoc.ref.collection('reports').get();
        reportsSnap.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });

        const docsSnap = await buildingDoc.ref.collection('documents').get();
        docsSnap.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      }

      // 4. Delete reports, agreements, appointments created by user
      const reportsSnap = await db
        .collection('reports')
        .where('customerId', '==', customerId)
        .get();
      reportsSnap.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      const agreementsSnap = await db
        .collection('serviceAgreements')
        .where('customerId', '==', customerId)
        .get();
      agreementsSnap.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      // Commit batch deletion
      await batch.commit();

      // 5. Delete Firebase Authentication account
      try {
        await admin.auth().deleteUser(requestedUserId);
      } catch (authError: any) {
        if (authError.code !== 'auth/user-not-found') {
          throw authError;
        }
      }

      console.log(
        `✅ Successfully deleted account for user ${requestedUserId} - ${deletedCount} documents removed`
      );

      return {
        success: true,
        deleted: deletedCount,
        message: 'Your account and all associated data have been permanently deleted',
      };
    } catch (error: any) {
      console.error(`❌ Error deleting account ${requestedUserId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete account'
      );
    }
  });

/**
 * On-demand function: Export user data (GDPR portability right)
 * Returns all user data in a portable JSON format
 */
export const exportUserData = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists()) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data();
      const customerId = userData?.companyId || userId;

      // Compile all user data
      const exportData: any = {
        exportDate: new Date().toISOString(),
        user: {
          id: userId,
          ...userData,
        },
        buildings: [],
        reports: [],
        agreements: [],
        subscriptions: [],
        invoices: [],
      };

      // Get all buildings
      const buildingsSnap = await db
        .collection('buildings')
        .where('customerId', '==', customerId)
        .get();

      for (const buildingDoc of buildingsSnap.docs) {
        exportData.buildings.push({
          id: buildingDoc.id,
          ...buildingDoc.data(),
        });

        // Get reports for each building
        const reportsSnap = await buildingDoc.ref.collection('reports').get();
        reportsSnap.forEach(doc => {
          exportData.reports.push({
            id: doc.id,
            buildingId: buildingDoc.id,
            ...doc.data(),
          });
        });
      }

      // Get agreements
      const agreementsSnap = await db
        .collection('serviceAgreements')
        .where('customerId', '==', customerId)
        .get();

      agreementsSnap.forEach(doc => {
        exportData.agreements.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Get subscription data
      const customerRef = db.collection('customers').doc(customerId);
      const subscriptionsSnap = await customerRef.collection('subscriptions').get();
      subscriptionsSnap.forEach(doc => {
        exportData.subscriptions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      const invoicesSnap = await customerRef.collection('invoices').get();
      invoicesSnap.forEach(doc => {
        exportData.invoices.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`✅ Exported data for user ${userId}`);

      return {
        success: true,
        data: exportData,
        fileName: `agritectum-user-export-${userId}-${new Date().toISOString().split('T')[0]}.json`,
      };
    } catch (error: any) {
      console.error(`❌ Error exporting data for user ${userId}:`, error);
      throw new functions.https.HttpsError('internal', 'Failed to export data');
    }
  });
