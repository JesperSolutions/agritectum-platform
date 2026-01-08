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
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Building } from '../types';

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
export const geocodeBuildingAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
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
    console.error('Error geocoding building address:', error);
    return null;
  }
};

// Get building by ID
export const getBuildingById = async (buildingId: string): Promise<Building | null> => {
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

// Get buildings by customer ID
export const getBuildingsByCustomer = async (customerId: string): Promise<Building[]> => {
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
  } catch (error: any) {
    console.error('Error fetching buildings by customer:', error);
    
    // Handle missing index error
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const buildingsRef = collection(db, 'buildings');
      const snapshot = await getDocs(buildingsRef);
      const buildings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Building[];

      return buildings.filter(building => building.customerId === customerId);
    }

    throw new Error('Failed to fetch buildings by customer');
  }
};

// Get buildings by company ID
export const getBuildingsByCompany = async (companyId: string): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const q = query(
      buildingsRef,
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];
  } catch (error: any) {
    console.error('Error fetching buildings by company:', error);
    
    // Handle missing index error
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const buildingsRef = collection(db, 'buildings');
      const snapshot = await getDocs(buildingsRef);
      const buildings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Building[];

      return buildings.filter(building => building.companyId === companyId);
    }

    throw new Error('Failed to fetch buildings by company');
  }
};

// Create a new building
export const createBuilding = async (
  buildingData: Omit<Building, 'id' | 'createdAt'>
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

    if (buildingData.address) {
      const coords = await geocodeBuildingAddress(buildingData.address);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const buildingsRef = collection(db, 'buildings');
    const buildingWithDefaults = {
      ...buildingData,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    const sanitizedBuilding = removeUndefinedFields(buildingWithDefaults);

    const docRef = await addDoc(buildingsRef, sanitizedBuilding);
    return docRef.id;
  } catch (error) {
    console.error('Error creating building:', error);
    throw new Error('Failed to create building');
  }
};

// Update a building
export const updateBuilding = async (
  buildingId: string,
  updates: Partial<Building>
): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const buildingRef = doc(db, 'buildings', buildingId);

    // If address is being updated, geocode it
    if (updates.address) {
      const coords = await geocodeBuildingAddress(updates.address);
      if (coords) {
        updates.latitude = coords.lat;
        updates.longitude = coords.lon;
      }
    }

    const sanitizedUpdates = removeUndefinedFields(updates);

    await updateDoc(buildingRef, sanitizedUpdates);
  } catch (error) {
    console.error('Error updating building:', error);
    throw new Error('Failed to update building');
  }
};

// Delete a building
export const deleteBuilding = async (buildingId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const buildingRef = doc(db, 'buildings', buildingId);
    await deleteDoc(buildingRef);
  } catch (error) {
    console.error('Error deleting building:', error);
    throw new Error('Failed to delete building');
  }
};


