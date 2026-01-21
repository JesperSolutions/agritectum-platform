import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const getReports = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { buildingId, customerId } = data;

  if (!buildingId && !customerId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'buildingId or customerId is required'
    );
  }

  try {
    // Get user to check permissions
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new functions.https.HttpsError('failed-precondition', 'User document not found');
    }

    const userCompanyId = context.auth.token.companyId || userData.companyId;
    const isCustomer = context.auth.token.permissionLevel === -1;
    const isBranchAdmin = context.auth.token.permissionLevel >= 1;
    const branchId = context.auth.token.branchId || userData.branchId;

    let query: FirebaseFirestore.Query = db.collection('reports');

    // For customers: only fetch reports for their company
    if (isCustomer) {
      if (buildingId) {
        query = query.where('buildingId', '==', buildingId).where('companyId', '==', userCompanyId);
      } else if (customerId) {
        query = query.where('customerId', '==', userCompanyId);
      }
    }
    // For branch admins: fetch reports for their branch
    else if (isBranchAdmin) {
      if (buildingId) {
        query = query.where('buildingId', '==', buildingId).where('branchId', '==', branchId);
      } else if (customerId) {
        query = query.where('customerId', '==', customerId).where('branchId', '==', branchId);
      }
    }
    // For other users: deny access
    else {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not have permission to access reports'
      );
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt descending
    reports.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    return {
      success: true,
      data: reports,
      count: reports.length,
    };
  } catch (error: any) {
    console.error('Error in getReports function:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to fetch reports: ' + error.message);
  }
});
