import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const getReports = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { buildingId, customerId } = request.data;

  if (!buildingId && !customerId) {
    throw new HttpsError(
      'invalid-argument',
      'buildingId or customerId is required'
    );
  }

  try {
    // Get user to check permissions
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new HttpsError('failed-precondition', 'User document not found');
    }

    const userCompanyId = request.auth.token.companyId || userData.companyId;
    const isCustomer = request.auth.token.permissionLevel === -1;
    const isBranchAdmin = request.auth.token.permissionLevel >= 1;
    const branchId = request.auth.token.branchId || userData.branchId;

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
      throw new HttpsError(
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
    reports.sort((a: any, b: any) => {
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

    if (error.code) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to fetch reports: ' + error.message);
  }
});
