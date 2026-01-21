import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { Employee, User } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const getUsers = async (branchId?: string): Promise<Employee[]> => {
  try {
    if (branchId) {
      // For branch admins, get users from both users collection and employees subcollection
      const usersRef = collection(db, 'users');
      const employeesRef = collection(db, 'branches', branchId, 'employees');

      const [usersSnapshot, employeesSnapshot] = await Promise.all([
        getDocs(query(usersRef, where('branchId', '==', branchId))),
        getDocs(query(employeesRef)),
      ]);

      // Combine and deduplicate users
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      const employees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      // Merge users and employees, preferring users collection data
      const userMap = new Map();

      // Create a more robust key using email as primary identifier
      const createKey = (user: any) => {
        // Use email as primary key, fallback to uid, then id
        return user.email || user.uid || user.id;
      };

      // Add employees first
      employees.forEach(employee => {
        const key = createKey(employee);
        if (key) {
          userMap.set(key, { ...employee, source: 'employees' });
        }
      });

      // Add users, overwriting employees if they exist
      users.forEach(user => {
        const key = createKey(user);
        if (key) {
          userMap.set(key, { ...user, source: 'users' });
        }
      });

      // Sort by displayName after merging
      const mergedUsers = Array.from(userMap.values());
      const { logger } = await import('../utils/logger');
      logger.debug('UserService Debug - Merged users:', mergedUsers.length);
      logger.debug('UserService Debug - Users from users collection:', users.length);
      logger.debug('UserService Debug - Users from employees collection:', employees.length);

      return mergedUsers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    } else {
      // For superadmin, get all users from users collection
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      const { logger } = await import('../utils/logger');
      logger.debug('UserService Debug - Superadmin - Total users found:', users.length);
      logger.debug('UserService Debug - Superadmin - Users data:', users);

      // Sort by displayName
      return users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const getUser = async (userId: string): Promise<Employee | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return { id: userSnap.id, ...userSnap.data() } as Employee;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
};

export const createUser = async (userData: Omit<Employee, 'id'>): Promise<string> => {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, userData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const updateUser = async (
  userId: string,
  updates: Partial<Employee>,
  currentUser?: User
): Promise<void> => {
  try {
    // Safety validation: Check if branch admin is trying to edit user outside their branch
    if (currentUser && currentUser.role === 'branchAdmin') {
      const user = await getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Branch admin can only edit users in their branch
      if (user.branchId !== currentUser.branchId) {
        throw new Error('Cannot edit user outside your branch');
      }

      // Prevent changing branchId for branch admins
      if (updates.branchId && updates.branchId !== currentUser.branchId) {
        throw new Error('Cannot change user branch assignment');
      }

      // Prevent promoting users to superadmin (branch admins can't do this)
      if (updates.role === 'superadmin' || updates.permissionLevel === 2) {
        throw new Error('Cannot change user role to superadmin');
      }
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error: any) {
    console.error('Error updating user:', error);
    // Re-throw with the original error message if it's our validation error
    if (
      error.message?.includes('Cannot edit') ||
      error.message?.includes('User not found') ||
      error.message?.includes('Cannot change')
    ) {
      throw error;
    }
    throw new Error('Failed to update user');
  }
};

export const deleteUser = async (userId: string, currentUser?: User): Promise<void> => {
  try {
    // Force token refresh FIRST
    const { logger } = await import('../utils/logger');
    logger.debug('Refreshing auth token before deletion...');
    const auth = getAuth();
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      logger.debug('Token refreshed');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // JUST DELETE IT
    logger.debug(`Deleting user: ${userId}`);
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    logger.debug('User deleted');
  } catch (error: any) {
    const { logger } = await import('../utils/logger');
    logger.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isActive });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw new Error('Failed to toggle user status');
  }
};

interface ResetPasswordResponse {
  success: boolean;
  password?: string;
  message?: string;
  error?: string;
}

interface ViewPasswordResponse {
  success: boolean;
  password?: string;
  lastReset?: any;
  message?: string;
  error?: string;
}

/**
 * Reset user password via Cloud Function
 * Allows branch admins to reset passwords for users in their branch
 * Allows superadmins to reset any user's password
 */
export const resetUserPassword = async (
  userId: string,
  newPassword?: string
): Promise<ResetPasswordResponse> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Get auth token
    const token = await currentUser.getIdToken();

    // Use Cloud Function via httpsCallable for proper authentication
    const resetPasswordFn = httpsCallable(functions, 'resetUserPassword');
    const result = await resetPasswordFn({ userId, newPassword });

    return result.data as ResetPasswordResponse;
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

/**
 * View user password (temporary password stored in Firestore)
 * Allows branch admins to view passwords for users in their branch
 * Allows superadmins to view any user's password
 */
export const viewUserPassword = async (userId: string): Promise<ViewPasswordResponse> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Use Cloud Function via httpsCallable for proper authentication
    const viewPasswordFn = httpsCallable(functions, 'viewUserPassword');
    const result = await viewPasswordFn({ userId });

    return result.data as ViewPasswordResponse;
  } catch (error: any) {
    console.error('Error viewing password:', error);
    throw new Error(error.message || 'Failed to view password');
  }
};
