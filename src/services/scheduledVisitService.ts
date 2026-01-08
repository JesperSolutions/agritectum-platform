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
import { ScheduledVisit, User, canAccessAllBranches } from '../types';
import { getBuildingById } from './buildingService';

/**
 * Get scheduled visits based on user permissions
 * For internal users, this works like appointments
 * For customers, returns visits for their buildings/companies
 */
export const getScheduledVisits = async (user: User): Promise<ScheduledVisit[]> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    let q;

    if (user.permissionLevel === -1) {
      // Customer: get visits for their buildings/companies
      // This requires client-side filtering after fetching
      q = query(visitsRef, orderBy('scheduledDate', 'desc'));
    } else if (canAccessAllBranches(user.permissionLevel)) {
      // Superadmin: see all visits
      q = query(visitsRef, orderBy('scheduledDate', 'desc'));
    } else if (user.permissionLevel >= 1 && user.branchId) {
      // Branch Admin: see all visits in their branch
      q = query(
        visitsRef,
        where('branchId', '==', user.branchId),
        orderBy('scheduledDate', 'desc')
      );
    } else if (user.uid) {
      // Inspector: see only their own visits
      try {
        q = query(
          visitsRef,
          where('assignedInspectorId', '==', user.uid),
          orderBy('scheduledDate', 'desc')
        );
      } catch (queryError: any) {
        if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
          console.warn('⚠️ Composite index missing, querying without orderBy:', queryError);
          q = query(
            visitsRef,
            where('assignedInspectorId', '==', user.uid)
          );
        } else {
          throw queryError;
        }
      }
    } else {
      console.warn('⚠️ Cannot query scheduled visits - missing user.uid');
      return [];
    }

    const querySnapshot = await getDocs(q);
    let visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledVisit[];

    // For customers, filter by their buildings/companies
    if (user.permissionLevel === -1) {
      visits = await filterVisitsForCustomer(visits, user);
    }

    // Sort manually if we couldn't use orderBy
    if (visits.length > 0 && !q) {
      visits.sort((a, b) => {
        const dateA = a.scheduledDate || '';
        const dateB = b.scheduledDate || '';
        return dateB.localeCompare(dateA); // Descending
      });
    }

    return visits;
  } catch (error: any) {
    console.error('❌ Error fetching scheduled visits:', error);
    if (error.code === 'failed-precondition') {
      throw new Error('Firestore index required. Please create a composite index for (assignedInspectorId, scheduledDate) in Firestore.');
    }
    throw new Error(error.message || 'Failed to fetch scheduled visits');
  }
};

/**
 * Filter visits for customer based on their buildings/companies
 */
async function filterVisitsForCustomer(visits: ScheduledVisit[], user: User): Promise<ScheduledVisit[]> {
  const filtered: ScheduledVisit[] = [];

  for (const visit of visits) {
    // Check if visit is for customer's building
    if (visit.buildingId) {
      try {
        const building = await getBuildingById(visit.buildingId);
        if (building && (building.customerId === user.uid || building.companyId === user.companyId)) {
          filtered.push(visit);
          continue;
        }
      } catch (error) {
        console.warn('Error checking building for visit:', error);
      }
    }

    // Check if visit is for customer's company
    if (visit.companyId && visit.companyId === user.companyId) {
      filtered.push(visit);
      continue;
    }

    // Check if visit is directly linked to customer
    if (visit.customerId === user.uid) {
      filtered.push(visit);
    }
  }

  return filtered;
}

/**
 * Get scheduled visits by customer ID
 */
export const getScheduledVisitsByCustomer = async (customerId: string): Promise<ScheduledVisit[]> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    const q = query(
      visitsRef,
      where('customerId', '==', customerId),
      orderBy('scheduledDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledVisit[];
  } catch (error: any) {
    console.error('Error fetching scheduled visits by customer:', error);
    
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const visitsRef = collection(db, 'scheduledVisits');
      const snapshot = await getDocs(visitsRef);
      const visits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduledVisit[];

      return visits.filter(visit => visit.customerId === customerId);
    }

    throw new Error('Failed to fetch scheduled visits by customer');
  }
};

/**
 * Get scheduled visits by building ID
 */
export const getScheduledVisitsByBuilding = async (buildingId: string): Promise<ScheduledVisit[]> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    const q = query(
      visitsRef,
      where('buildingId', '==', buildingId),
      orderBy('scheduledDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledVisit[];
  } catch (error: any) {
    console.error('Error fetching scheduled visits by building:', error);
    
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const visitsRef = collection(db, 'scheduledVisits');
      const snapshot = await getDocs(visitsRef);
      const visits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduledVisit[];

      return visits.filter(visit => visit.buildingId === buildingId);
    }

    throw new Error('Failed to fetch scheduled visits by building');
  }
};

/**
 * Get scheduled visits by company ID
 */
export const getScheduledVisitsByCompany = async (companyId: string): Promise<ScheduledVisit[]> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    const q = query(
      visitsRef,
      where('companyId', '==', companyId),
      orderBy('scheduledDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledVisit[];
  } catch (error: any) {
    console.error('Error fetching scheduled visits by company:', error);
    
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const visitsRef = collection(db, 'scheduledVisits');
      const snapshot = await getDocs(visitsRef);
      const visits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduledVisit[];

      return visits.filter(visit => visit.companyId === companyId);
    }

    throw new Error('Failed to fetch scheduled visits by company');
  }
};

/**
 * Get a single scheduled visit by ID
 */
export const getScheduledVisit = async (visitId: string): Promise<ScheduledVisit | null> => {
  try {
    const visitRef = doc(db, 'scheduledVisits', visitId);
    const visitSnap = await getDoc(visitRef);

    if (!visitSnap.exists()) {
      return null;
    }

    return { id: visitSnap.id, ...visitSnap.data() } as ScheduledVisit;
  } catch (error) {
    console.error('Error fetching scheduled visit:', error);
    throw new Error('Failed to fetch scheduled visit');
  }
};

/**
 * Get scheduled visits for a specific date
 */
export const getScheduledVisitsByDate = async (
  date: string,
  inspectorId?: string,
  branchId?: string
): Promise<ScheduledVisit[]> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    let q;

    if (inspectorId && branchId) {
      q = query(
        visitsRef,
        where('scheduledDate', '==', date),
        where('assignedInspectorId', '==', inspectorId),
        where('branchId', '==', branchId)
      );
    } else if (inspectorId) {
      q = query(
        visitsRef,
        where('scheduledDate', '==', date),
        where('assignedInspectorId', '==', inspectorId)
      );
    } else if (branchId) {
      q = query(
        visitsRef,
        where('scheduledDate', '==', date),
        where('branchId', '==', branchId)
      );
    } else {
      q = query(visitsRef, where('scheduledDate', '==', date));
    }

    const querySnapshot = await getDocs(q);
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledVisit[];

    return visits.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  } catch (error) {
    console.error('Error fetching scheduled visits by date:', error);
    throw new Error('Failed to fetch scheduled visits by date');
  }
};

/**
 * Create a new scheduled visit
 */
export const createScheduledVisit = async (
  visitData: Omit<ScheduledVisit, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const visitsRef = collection(db, 'scheduledVisits');
    const now = new Date().toISOString();

    const cleanData = Object.fromEntries(
      Object.entries({
        ...visitData,
        createdAt: now,
        updatedAt: now,
      }).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(visitsRef, cleanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled visit:', error);
    throw new Error('Failed to create scheduled visit');
  }
};

/**
 * Update an existing scheduled visit
 */
export const updateScheduledVisit = async (
  visitId: string,
  updates: Partial<ScheduledVisit>
): Promise<void> => {
  try {
    const visitRef = doc(db, 'scheduledVisits', visitId);
    await updateDoc(visitRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating scheduled visit:', error);
    throw new Error('Failed to update scheduled visit');
  }
};

/**
 * Delete a scheduled visit
 */
export const deleteScheduledVisit = async (visitId: string): Promise<void> => {
  try {
    const visitRef = doc(db, 'scheduledVisits', visitId);
    await deleteDoc(visitRef);
  } catch (error) {
    console.error('Error deleting scheduled visit:', error);
    throw new Error('Failed to delete scheduled visit');
  }
};


