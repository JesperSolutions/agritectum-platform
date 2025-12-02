import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Deletes documents from the 'reports' collection created by a specific user.
 * This function is HTTP-triggered for manual execution.
 *
 * IMPORTANT: This function performs destructive actions.
 * - Always run a dry-run first (by commenting out `batch.delete()` and `batch.commit()`)
 * - Ensure you have a backup of your data before executing.
 * - For production, consider adding authentication/authorization to this endpoint.
 */
export const deleteLinusReports = functions.https.onRequest(async (req, res) => {
    // --- Configuration ---
    // You'll need the actual User ID (UID) of "Linus Holberg".
    // This is NOT his name, but the unique ID Firebase Authentication assigns him (e.g., 'someRandomUID123').
    // You can find this in Firebase Authentication console, or in your 'users' collection.
    const targetUserId = 'YOUR_LINUS_HOLBERG_USER_ID'; // <--- REPLACE THIS WITH THE ACTUAL UID!

    const collectionPath = 'reports';
    const batchSize = 500; // Max number of operations in a single Firestore batch

    console.log(`Starting deletion process for user: ${targetUserId} in collection: ${collectionPath}`);
    let documentsDeleted = 0;

    try {
        let lastDoc = null;
        let query = db.collection(collectionPath)
                      .where('createdBy', '==', targetUserId)
                      .orderBy('__name__') // Always order for consistent pagination
                      .limit(batchSize);

        while (true) {
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();

            // If no documents left, break the loop
            if (snapshot.empty) {
                break;
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            documentsDeleted += snapshot.size;
            lastDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document for the next iteration

            console.log(`Deleted ${snapshot.size} documents in this batch. Total deleted: ${documentsDeleted}`);
        }

        console.log(`Successfully deleted ${documentsDeleted} documents created by ${targetUserId}.`);
        res.status(200).send(`Successfully deleted ${documentsDeleted} documents created by ${targetUserId}.`);

    } catch (error: any) {
        console.error('Error during bulk deletion:', error);
        res.status(500).send(`Error deleting documents: ${error.message}`);
    }
});

/**
 * Alternative function to delete reports by email instead of UID
 * This searches for the user by email first, then deletes their reports
 */
export const deleteLinusReportsByEmail = functions.https.onRequest(async (req, res) => {
    const targetEmail = 'linus.hollberg@taklagetentreprenad.se';
    const collectionPath = 'reports';
    const batchSize = 500;

    console.log(`Starting deletion process for user with email: ${targetEmail}`);

    try {
        // First, find the user by email in the users collection
        const usersSnapshot = await db.collection('users')
            .where('email', '==', targetEmail)
            .get();

        if (usersSnapshot.empty) {
            res.status(404).send(`User with email ${targetEmail} not found in users collection`);
            return;
        }

        const userDoc = usersSnapshot.docs[0];
        const targetUserId = userDoc.id;
        const userData = userDoc.data();

        console.log(`Found user: ${userData.displayName} (${userData.email}) with UID: ${targetUserId}`);

        let documentsDeleted = 0;
        let lastDoc = null;
        let query = db.collection(collectionPath)
                      .where('createdBy', '==', targetUserId)
                      .orderBy('__name__')
                      .limit(batchSize);

        while (true) {
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                break;
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            documentsDeleted += snapshot.size;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            console.log(`Deleted ${snapshot.size} documents in this batch. Total deleted: ${documentsDeleted}`);
        }

        console.log(`Successfully deleted ${documentsDeleted} documents created by ${targetEmail} (UID: ${targetUserId}).`);
        res.status(200).send(`Successfully deleted ${documentsDeleted} documents created by ${targetEmail} (UID: ${targetUserId}).`);

    } catch (error: any) {
        console.error('Error during bulk deletion:', error);
        res.status(500).send(`Error deleting documents: ${error.message}`);
    }
});

/**
 * Dry-run function to see what would be deleted without actually deleting
 * This is useful for testing and verification
 */
export const dryRunLinusReports = functions.https.onRequest(async (req, res) => {
    const targetEmail = 'linus.hollberg@taklagetentreprenad.se';
    const collectionPath = 'reports';

    console.log(`Starting DRY RUN for user with email: ${targetEmail}`);

    try {
        // First, find the user by email in the users collection
        const usersSnapshot = await db.collection('users')
            .where('email', '==', targetEmail)
            .get();

        if (usersSnapshot.empty) {
            res.status(404).send(`User with email ${targetEmail} not found in users collection`);
            return;
        }

        const userDoc = usersSnapshot.docs[0];
        const targetUserId = userDoc.id;
        const userData = userDoc.data();

        console.log(`Found user: ${userData.displayName} (${userData.email}) with UID: ${targetUserId}`);

        // Get all reports created by this user
        const reportsSnapshot = await db.collection(collectionPath)
            .where('createdBy', '==', targetUserId)
            .get();

        const reports = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'No title',
            customerName: doc.data().customerName || 'No customer',
            status: doc.data().status || 'No status',
            createdAt: doc.data().createdAt,
            isTemp: doc.id.startsWith('temp_')
        }));

        console.log(`DRY RUN: Found ${reports.length} reports that would be deleted:`);
        reports.forEach((report, index) => {
            console.log(`  ${index + 1}. ${report.id} - ${report.title} (${report.status}) ${report.isTemp ? '🚨TEMP' : ''}`);
        });

        res.status(200).json({
            message: `DRY RUN: Found ${reports.length} reports that would be deleted`,
            user: {
                uid: targetUserId,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                permissionLevel: userData.permissionLevel,
                branchId: userData.branchId
            },
            reports: reports
        });

    } catch (error: any) {
        console.error('Error during dry run:', error);
        res.status(500).send(`Error during dry run: ${error.message}`);
    }
});