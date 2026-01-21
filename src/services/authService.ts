import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Re-authenticate user with current password (required before password change)
 * Firebase security best practice
 */
export const reauthenticateUser = async (email: string, currentPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);
};

/**
 * Update user password
 * Must call reauthenticateUser first for security
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  await updatePassword(user, newPassword);
};

/**
 * Send password reset email to user
 * @param email - User's email address
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!email) {
    throw new Error('Email is required');
  }

  // Get the current domain for the action URL
  const actionCodeSettings = {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: false, // Open link in browser, not app
  };

  await sendPasswordResetEmail(auth, email, actionCodeSettings);
};

/**
 * Verify password reset code from email link
 * @param code - The action code from the email link
 * @returns The email address associated with the reset code
 */
export const verifyResetCode = async (code: string): Promise<string> => {
  return await verifyPasswordResetCode(auth, code);
};

/**
 * Confirm password reset with new password
 * @param code - The action code from the email link
 * @param newPassword - The new password to set
 */
export const confirmPasswordReset = async (code: string, newPassword: string): Promise<void> => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  await firebaseConfirmPasswordReset(auth, code, newPassword);
};
