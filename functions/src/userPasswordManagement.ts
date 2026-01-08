import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface ResetPasswordRequest {
  userId: string;
  newPassword?: string; // Optional - if not provided, generates a random password
}

interface ViewPasswordRequest {
  userId: string;
}

/**
 * Reset user password
 * Allows branch admins to reset passwords for users in their branch
 * Allows superadmins to reset any user's password
 */
export const resetUserPassword = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Unauthorized - User must be authenticated');
    }

    const decodedToken = request.auth;
    
    // Get requester's user record to check permissions
    const requesterRecord = await admin.auth().getUser(decodedToken.uid);
    const requesterClaims = requesterRecord.customClaims || {};
    const requesterRole = requesterClaims.role;
    const requesterBranchId = requesterClaims.branchId;

    // Only branch admins and superadmins can reset passwords
    if (requesterRole !== 'branchAdmin' && requesterRole !== 'superadmin') {
      throw new Error('Forbidden - Only branch admins and superadmins can reset passwords');
    }

    const { userId, newPassword }: ResetPasswordRequest = request.data;

    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    // Get target user's record
    const targetUserRecord = await admin.auth().getUser(userId);
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!targetUserDoc.exists) {
      throw new Error('User not found in Firestore');
    }

    const targetUserData = targetUserDoc.data();
    const targetBranchId = targetUserData?.branchId;

    // Branch admins can only reset passwords for users in their branch
    if (requesterRole === 'branchAdmin' && requesterBranchId !== targetBranchId) {
      throw new Error('Forbidden - Cannot reset password for user outside your branch');
    }

    // Generate password if not provided
    let passwordToSet: string;
    if (newPassword) {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      passwordToSet = newPassword;
    } else {
      // Generate a secure random password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      passwordToSet = '';
      for (let i = 0; i < 12; i++) {
        passwordToSet += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Update password
    await admin.auth().updateUser(userId, {
      password: passwordToSet
    });

    // Store password in Firestore for viewing (encrypted or plain - for admin convenience)
    // Note: In production, you might want to encrypt this or use a secure vault
    await admin.firestore().collection('users').doc(userId).update({
      temporaryPassword: passwordToSet,
      passwordLastReset: admin.firestore.FieldValue.serverTimestamp(),
      passwordResetBy: decodedToken.uid,
      passwordResetByName: requesterRecord.displayName || requesterRecord.email || 'Admin',
    });

    console.log(`✅ Password reset for user ${userId} by ${decodedToken.uid}`);

    return {
      success: true,
      password: passwordToSet, // Return password so admin can view it
      message: 'Password reset successfully'
    };

  } catch (error: any) {
    console.error('❌ Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
});

/**
 * View user password (temporary password stored in Firestore)
 * Allows branch admins to view passwords for users in their branch
 * Allows superadmins to view any user's password
 */
export const viewUserPassword = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Unauthorized - User must be authenticated');
    }

    const decodedToken = request.auth;
    
    // Get requester's user record to check permissions
    const requesterRecord = await admin.auth().getUser(decodedToken.uid);
    const requesterClaims = requesterRecord.customClaims || {};
    const requesterRole = requesterClaims.role;
    const requesterBranchId = requesterClaims.branchId;

    // Only branch admins and superadmins can view passwords
    if (requesterRole !== 'branchAdmin' && requesterRole !== 'superadmin') {
      throw new Error('Forbidden - Only branch admins and superadmins can view passwords');
    }

    const { userId } = request.data as ViewPasswordRequest;

    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    // Get target user's document
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!targetUserDoc.exists) {
      throw new Error('User not found');
    }

    const targetUserData = targetUserDoc.data();
    const targetBranchId = targetUserData?.branchId;

    // Branch admins can only view passwords for users in their branch
    if (requesterRole === 'branchAdmin' && requesterBranchId !== targetBranchId) {
      throw new Error('Forbidden - Cannot view password for user outside your branch');
    }

    const temporaryPassword = targetUserData?.temporaryPassword;
    const passwordLastReset = targetUserData?.passwordLastReset;

    if (!temporaryPassword) {
      return {
        success: false,
        error: 'No temporary password found. Password may need to be reset first.',
        password: null
      };
    }

    return {
      success: true,
      password: temporaryPassword,
      lastReset: passwordLastReset,
      message: 'Password retrieved successfully'
    };

  } catch (error: any) {
    console.error('❌ Error viewing password:', error);
    throw new Error(error.message || 'Failed to view password');
  }
});

