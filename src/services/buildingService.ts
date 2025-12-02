import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Building, Report } from '../types';

/**
 * Create a new building for a customer
 */
export const createBuilding = async (
  customerId: string,
  address: string,
  name?: string,
  description?: string
): Promise<string> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const buildingData: Omit<Building, 'id'> = {
      customerId,
      address,
      name,
      description,
      reportIds: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(buildingsRef, buildingData);
    
    // Update customer's buildings array
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    if (customerDoc.exists()) {
      const customerData = customerDoc.data();
      const buildings = customerData.buildings || [];
      await updateDoc(customerRef, {
        buildings: [...buildings, docRef.id],
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating building:', error);
    throw new Error('Failed to create building');
  }
};

/**
 * Get all buildings for a customer
 */
export const getBuildingsForCustomer = async (customerId: string): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const q = query(
      buildingsRef,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw new Error('Failed to fetch buildings');
  }
};

/**
 * Get a single building by ID
 */
export const getBuilding = async (buildingId: string): Promise<Building | null> => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingDoc = await getDoc(buildingRef);

    if (!buildingDoc.exists()) {
      return null;
    }

    return {
      id: buildingDoc.id,
      ...buildingDoc.data(),
    } as Building;
  } catch (error) {
    console.error('Error fetching building:', error);
    throw new Error('Failed to fetch building');
  }
};

/**
 * Link a report to a building
 */
export const linkReportToBuilding = async (
  buildingId: string,
  reportId: string
): Promise<void> => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingDoc = await getDoc(buildingRef);

    if (!buildingDoc.exists()) {
      throw new Error('Building not found');
    }

    const buildingData = buildingDoc.data() as Building;
    const reportIds = buildingData.reportIds || [];

    if (!reportIds.includes(reportId)) {
      await updateDoc(buildingRef, {
        reportIds: [...reportIds, reportId],
        latestReportId: reportId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error linking report to building:', error);
    throw new Error('Failed to link report to building');
  }
};

/**
 * Get all reports for a building
 */
export const getBuildingReports = async (buildingId: string): Promise<Report[]> => {
  try {
    const building = await getBuilding(buildingId);
    if (!building || !building.reportIds.length) {
      return [];
    }

    const reportsRef = collection(db, 'reports');
    const reports: Report[] = [];

    // Fetch each report (Firestore doesn't support 'in' queries with more than 10 items efficiently)
    // For now, we'll fetch them individually. For better performance, consider restructuring.
    for (const reportId of building.reportIds) {
      try {
        const reportRef = doc(reportsRef, reportId);
        const reportDoc = await getDoc(reportRef);
        if (reportDoc.exists()) {
          reports.push({
            id: reportDoc.id,
            ...reportDoc.data(),
          } as Report);
        }
      } catch (error) {
        console.warn(`Failed to fetch report ${reportId}:`, error);
      }
    }

    // Sort by creation date (newest first)
    return reports.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching building reports:', error);
    throw new Error('Failed to fetch building reports');
  }
};

/**
 * Update building information
 */
export const updateBuilding = async (
  buildingId: string,
  updates: Partial<Building>
): Promise<void> => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    await updateDoc(buildingRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating building:', error);
    throw new Error('Failed to update building');
  }
};

