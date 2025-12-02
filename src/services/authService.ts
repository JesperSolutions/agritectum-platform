import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Re-authenticate user with current password (required before password change)
 * Firebase security best practice
 */
export const reauthenticateUser = async (
  email: string, 
  currentPassword: string
): Promise<void> => {
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
