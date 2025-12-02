import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to set custom claims for users
 * This can be called from the Firebase Console or via HTTP
 */
export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users with superadmin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Get the current user's custom claims
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const currentClaims = userRecord.customClaims || {};
  
  // Only superadmins can set custom claims
  if (currentClaims.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only superadmins can set custom claims');
  }

  const { uid, claims } = data;

  if (!uid || !claims) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and claims are required');
  }

  try {
    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(uid, claims);
    
    // Also update the user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      ...claims,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, message: `Custom claims set for user ${uid}` };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set custom claims');
  }
});

/**
 * HTTP endpoint to set custom claims (for testing)
 * POST /setUserClaims
 * Body: { uid: string, claims: { role: string, permissionLevel: number, branchId?: string } }
 */
export const setUserClaimsHttp = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { uid, claims } = req.body;

  if (!uid || !claims) {
    res.status(400).send('uid and claims are required');
    return;
  }

  try {
    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(uid, claims);
    
    // Also update the user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      ...claims,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.status(200).json({ success: true, message: `Custom claims set for user ${uid}` });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    res.status(500).json({ success: false, error: 'Failed to set custom claims' });
  }
});

