import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface CreateCustomerRequest {
  uid: string; // Firebase Auth UID (created on client)
  email: string;
  displayName: string;
  customerId: string; // Customer record ID from Firestore
  phone?: string;
  address?: string;
}

export const createCustomerWithAuth = onRequest({ region: 'europe-west1' }, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    return;
  }

  try {
    const { uid, email, displayName, customerId, phone, address }: CreateCustomerRequest = req.body;

    // Validate required fields
    if (!uid || !email || !displayName || !customerId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: uid, email, displayName, customerId'
      });
      return;
    }

    console.log('🔍 Setting up customer account:', { email, customerId });

    // Verify user exists in Firebase Auth
    const firebaseUser = await admin.auth().getUser(uid);
    if (!firebaseUser) {
      res.status(404).json({
        success: false,
        error: 'User not found in Firebase Auth'
      });
      return;
    }

    // Set custom claims for customer role
    const customClaims = {
      role: 'customer',
      permissionLevel: -1,
      customerId: customerId,
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    console.log('✅ Custom claims set for customer:', uid);

    // Update user document in Firestore if it exists
    const userQuery = await admin.firestore()
      .collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        role: 'customer',
        permissionLevel: -1,
        customerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ User document updated:', userDoc.id);
    }

    // Update customer record
    const customerRef = admin.firestore().collection('customers').doc(customerId);
    await customerRef.update({
      uid: uid,
      userId: uid,
      isRegistered: true,
      email: email,
      phone: phone || admin.firestore.FieldValue.delete(),
      address: address || admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Customer record updated:', customerId);

    // Return success response
    res.status(200).json({
      success: true,
      customerId: customerId,
      firebaseUid: uid,
      message: 'Customer account setup successfully'
    });

  } catch (error: any) {
    console.error('❌ Error setting up customer account:', error);

    // Generic error response
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to setup customer account'
    });
  }
});

