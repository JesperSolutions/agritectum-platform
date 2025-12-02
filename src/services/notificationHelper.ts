/**
 * Notification Helper Service
 * 
 * Helper functions for notification operations, including finding branch managers
 * to notify about report events.
 * 
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2025-01-XX
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get branch manager user IDs for a given branch
 * Returns array of user IDs who should receive notifications
 */
export const getBranchManagersForNotification = async (branchId: string): Promise<string[]> => {
  try {
    if (!branchId) {
      console.warn('⚠️ No branchId provided to getBranchManagersForNotification');
      return [];
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('branchId', '==', branchId),
      where('role', '==', 'branchAdmin'),
      where('permissionLevel', '==', 1)
    );

    const snapshot = await getDocs(q);
    const userIds = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.uid || doc.id;
    }).filter((uid): uid is string => !!uid); // Filter out undefined/null values

    console.log(`✅ Found ${userIds.length} branch manager(s) for branch ${branchId}`, userIds);
    return userIds;
  } catch (error) {
    console.error('❌ Error getting branch managers for notification:', error);
    // Return empty array on error to prevent blocking notification flow
    return [];
  }
};

