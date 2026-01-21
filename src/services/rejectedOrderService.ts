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
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RejectedOrder } from '../types';
import { logger } from '../utils/logger';

/**
 * Create a rejected order record
 */
export const createRejectedOrder = async (
  orderData: Omit<RejectedOrder, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const rejectedOrdersRef = collection(db, 'rejectedOrders');
    const now = new Date().toISOString();

    const cleanData = Object.fromEntries(
      Object.entries({
        ...orderData,
        createdAt: now,
      }).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(rejectedOrdersRef, cleanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating rejected order:', error);
    throw new Error('Failed to create rejected order');
  }
};

/**
 * Get rejected orders for a branch
 */
export const getRejectedOrdersByBranch = async (branchId: string): Promise<RejectedOrder[]> => {
  try {
    const rejectedOrdersRef = collection(db, 'rejectedOrders');
    const q = query(
      rejectedOrdersRef,
      where('branchId', '==', branchId),
      orderBy('rejectedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RejectedOrder[];
  } catch (error: any) {
    // Handle permission errors gracefully - return empty array instead of throwing
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      logger.warn(
        '⚠️ Permission denied for rejected orders. User may not have access to this collection.'
      );
      return [];
    }

    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      logger.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      try {
        const rejectedOrdersRef = collection(db, 'rejectedOrders');
        const snapshot = await getDocs(rejectedOrdersRef);
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RejectedOrder[];

        return orders
          .filter(order => order.branchId === branchId)
          .sort((a, b) => (b.rejectedAt || '').localeCompare(a.rejectedAt || ''));
      } catch (fallbackError: any) {
        // If fallback also fails due to permissions, return empty array
        if (fallbackError.code === 'permission-denied') {
          logger.warn('⚠️ Permission denied for rejected orders fallback query.');
          return [];
        }
        console.error('Error in fallback query:', fallbackError);
        return [];
      }
    }

    // For other errors, log but return empty array to prevent breaking the dashboard
    console.error('Error fetching rejected orders:', error);
    return [];
  }
};

/**
 * Get rejected orders by customer
 */
export const getRejectedOrdersByCustomer = async (customerId: string): Promise<RejectedOrder[]> => {
  try {
    const rejectedOrdersRef = collection(db, 'rejectedOrders');
    const q = query(
      rejectedOrdersRef,
      where('customerId', '==', customerId),
      orderBy('rejectedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RejectedOrder[];
  } catch (error: any) {
    console.error('Error fetching rejected orders by customer:', error);

    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      logger.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const rejectedOrdersRef = collection(db, 'rejectedOrders');
      const snapshot = await getDocs(rejectedOrdersRef);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RejectedOrder[];

      return orders
        .filter(order => order.customerId === customerId)
        .sort((a, b) => b.rejectedAt.localeCompare(a.rejectedAt));
    }

    throw new Error('Failed to fetch rejected orders by customer');
  }
};

/**
 * Get a single rejected order by ID
 */
export const getRejectedOrder = async (orderId: string): Promise<RejectedOrder | null> => {
  try {
    const orderRef = doc(db, 'rejectedOrders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return null;
    }

    return { id: orderSnap.id, ...orderSnap.data() } as RejectedOrder;
  } catch (error) {
    console.error('Error fetching rejected order:', error);
    throw new Error('Failed to fetch rejected order');
  }
};
