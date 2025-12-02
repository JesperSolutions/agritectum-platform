import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ServiceAgreement } from '../types';

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  const cleanedEntries = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

  return cleanedEntries as T;
};

// Geocode address using Nominatim API (OpenStreetMap)
export const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    if (!address || address.trim().length < 5) {
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Agritectum Platform',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Create a new service agreement
export const createServiceAgreement = async (
  agreementData: Omit<ServiceAgreement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Geocode address if provided
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (agreementData.customerAddress) {
      const coords = await geocodeAddress(agreementData.customerAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const agreementsRef = collection(db, 'serviceAgreements');
    const agreementWithDefaults = {
      ...agreementData,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedAgreement = removeUndefinedFields(agreementWithDefaults);

    const docRef = await addDoc(agreementsRef, sanitizedAgreement);
    return docRef.id;
  } catch (error) {
    console.error('Error creating service agreement:', error);
    throw new Error('Failed to create service agreement');
  }
};

// Get all service agreements (with optional branch filtering)
/**
 * Get all service agreements for a specific customer
 */
export const getServiceAgreementsForCustomer = async (customerId: string): Promise<ServiceAgreement[]> => {
  try {
    const agreementsRef = collection(db, 'serviceAgreements');
    const q = query(
      agreementsRef,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ServiceAgreement[];
  } catch (error) {
    console.error('Error fetching customer service agreements:', error);
    throw new Error('Failed to fetch customer service agreements');
  }
};

export const getServiceAgreements = async (branchId?: string): Promise<ServiceAgreement[]> => {
  try {
    const agreementsRef = collection(db, 'serviceAgreements');
    let q;

    if (branchId) {
      q = query(agreementsRef, where('branchId', '==', branchId), orderBy('nextServiceDate', 'asc'));
    } else {
      q = query(agreementsRef, orderBy('nextServiceDate', 'asc'));
    }

    const querySnapshot = await getDocs(q);

    const agreements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ServiceAgreement[];

    return agreements;
  } catch (error) {
    console.error('Error fetching service agreements:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined;

    const isIndexError =
      errorCode === 'failed-precondition' ||
      (typeof errorMessage === 'string' && errorMessage.includes('requires an index'));

    if (isIndexError) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const agreementsRef = collection(db, 'serviceAgreements');
      const snapshot = await getDocs(agreementsRef);
      const agreements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceAgreement[];

      const filtered = branchId ? agreements.filter(agreement => agreement.branchId === branchId) : agreements;

      return filtered.sort((a, b) => {
        const aDate = new Date(a.nextServiceDate).getTime();
        const bDate = new Date(b.nextServiceDate).getTime();
        return aDate - bDate;
      });
    }

    throw new Error('Failed to fetch service agreements');
  }
};

// Get service agreement by ID
export const getServiceAgreement = async (id: string): Promise<ServiceAgreement | null> => {
  try {
    const agreementRef = doc(db, 'serviceAgreements', id);
    const agreementSnap = await getDoc(agreementRef);

    if (!agreementSnap.exists()) {
      return null;
    }

    return { id: agreementSnap.id, ...agreementSnap.data() } as ServiceAgreement;
  } catch (error) {
    console.error('Error fetching service agreement:', error);
    throw new Error('Failed to fetch service agreement');
  }
};

// Update service agreement
export const updateServiceAgreement = async (
  id: string,
  updates: Partial<Omit<ServiceAgreement, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const agreementRef = doc(db, 'serviceAgreements', id);

    // If address changed, re-geocode
    if (updates.customerAddress) {
      const coords = await geocodeAddress(updates.customerAddress);
      if (coords) {
        updates.latitude = coords.lat;
        updates.longitude = coords.lon;
      }
    }

    const sanitizedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(agreementRef, sanitizedUpdates);
  } catch (error) {
    console.error('Error updating service agreement:', error);
    throw new Error('Failed to update service agreement');
  }
};

// Delete service agreement
export const deleteServiceAgreement = async (id: string): Promise<void> => {
  try {
    const agreementRef = doc(db, 'serviceAgreements', id);
    await deleteDoc(agreementRef);
  } catch (error) {
    console.error('Error deleting service agreement:', error);
    throw new Error('Failed to delete service agreement');
  }
};

// Get agreements due within specified number of days
export const getAgreementsByDueDate = async (
  branchId: string | undefined,
  days: number
): Promise<ServiceAgreement[]> => {
  try {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const agreementsRef = collection(db, 'serviceAgreements');
    let q;

    if (branchId) {
      q = query(
        agreementsRef,
        where('branchId', '==', branchId),
        where('status', '==', 'active'),
        where('nextServiceDate', '>=', now.toISOString().split('T')[0]),
        where('nextServiceDate', '<=', futureDate.toISOString().split('T')[0]),
        orderBy('nextServiceDate', 'asc')
      );
    } else {
      q = query(
        agreementsRef,
        where('status', '==', 'active'),
        where('nextServiceDate', '>=', now.toISOString().split('T')[0]),
        where('nextServiceDate', '<=', futureDate.toISOString().split('T')[0]),
        orderBy('nextServiceDate', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ServiceAgreement[];
  } catch (error) {
    console.error('Error fetching agreements by due date:', error);
    // If composite index error, fall back to client-side filtering
    const allAgreements = await getServiceAgreements(branchId);
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    return allAgreements.filter(agreement => {
      if (agreement.status !== 'active') return false;
      const nextDate = new Date(agreement.nextServiceDate);
      return nextDate >= now && nextDate <= futureDate;
    });
  }
};

// Get agreements due tomorrow
export const getAgreementsDueTomorrow = async (branchId?: string): Promise<ServiceAgreement[]> => {
  return getAgreementsByDueDate(branchId, 1);
};

// Get agreements due in a week
export const getAgreementsDueInWeek = async (branchId?: string): Promise<ServiceAgreement[]> => {
  return getAgreementsByDueDate(branchId, 7);
};

// Get agreements due in two weeks
export const getAgreementsDueInTwoWeeks = async (branchId?: string): Promise<ServiceAgreement[]> => {
  return getAgreementsByDueDate(branchId, 14);
};

// Get agreements almost due (within 3 days)
export const getAgreementsAlmostDue = async (branchId?: string): Promise<ServiceAgreement[]> => {
  return getAgreementsByDueDate(branchId, 3);
};

// Generate a unique public token for service agreement access
export const generatePublicToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Get service agreement by public token
export const getServiceAgreementByPublicToken = async (token: string): Promise<ServiceAgreement | null> => {
  try {
    const agreementsRef = collection(db, 'serviceAgreements');
    const q = query(agreementsRef, where('publicToken', '==', token), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ServiceAgreement;
  } catch (error) {
    console.error('Error fetching service agreement by public token:', error);
    throw new Error('Failed to fetch service agreement');
  }
};

// Accept service agreement publicly
export const acceptServiceAgreementPublic = async (
  agreementId: string,
  customerData: { name: string; email: string },
  ipAddress?: string
): Promise<void> => {
  try {
    const agreementRef = doc(db, 'serviceAgreements', agreementId);
    const agreementSnap = await getDoc(agreementRef);

    if (!agreementSnap.exists()) {
      throw new Error('Service agreement not found');
    }

    const agreement = agreementSnap.data() as ServiceAgreement;

    if (!agreement.isPublic) {
      throw new Error('This service agreement is not publicly accessible');
    }

    if (agreement.acceptedAt) {
      throw new Error('This service agreement has already been accepted');
    }

    await updateDoc(agreementRef, {
      acceptedAt: new Date().toISOString(),
      acceptedBy: customerData.name,
      acceptedByEmail: customerData.email,
      acceptedIpAddress: ipAddress || null,
      acceptanceSignature: `${customerData.name} - ${new Date().toISOString()}`,
      status: 'active', // Change status to active upon acceptance
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error accepting service agreement:', error);
    throw error instanceof Error ? error : new Error('Failed to accept service agreement');
  }
};

