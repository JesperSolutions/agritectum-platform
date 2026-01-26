import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Cloud Function triggered when a customer user document is created in Firestore
 * Sets custom claims for customer users
 */
export const onCustomerUserCreate = onDocumentCreated('users/{userId}', async event => {
  const userData = event.data?.data();
  const userId = event.params.userId;

  if (!userData) {
    console.error('No user data found for userId:', userId);
    return;
  }

  // Only process customer users
  if (userData.userType !== 'customer' && userData.role !== 'customer') {
    console.log('Skipping non-customer user:', userId);
    return;
  }

  try {
    console.log('Setting custom claims for customer user:', userId);

    const customClaims = {
      role: 'customer',
      permissionLevel: -1,
      userType: 'customer',
      email: userData.email || null,
      companyId: userData.companyId || null,
      branchId: userData.branchId || null,
    };

    await admin.auth().setCustomUserClaims(userId, customClaims);

    console.log('✅ Custom claims set for customer user:', userId);
  } catch (error) {
    console.error('❌ Error setting custom claims for customer user:', userId, error);
    throw error;
  }
});
