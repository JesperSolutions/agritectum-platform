import { db } from '../config/firebase';
import { logger } from '../utils/logger';
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
import { Building, Report, ServiceAgreement, ScheduledVisit } from '../types';

export interface BuildingActivity {
  id: string;
  type: 'report' | 'service_agreement' | 'appointment' | 'scheduled_visit';
  title: string;
  description?: string;
  date: string;
  status?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

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
/**
 * Get all buildings for a branch
 * @param branchId - Branch ID
 * @returns Array of buildings
 */
export const getBuildingsByBranch = async (branchId: string): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const q = query(
      buildingsRef,
      where('branchId', '==', branchId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];
  } catch (error) {
    console.error('Error fetching buildings by branch:', error);
    throw error;
  }
};

export const getBuildingsByCustomer = async (customerId: string, branchId?: string): Promise<Building[]> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    
    // Get current user's branch if not provided
    let userBranchId = branchId;
    if (!userBranchId) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          userBranchId = userDoc.data().branchId;
        }
      }
    }
    
    // Query by customerId and branchId for security rules compliance
    let q;
    if (userBranchId) {
      q = query(
        buildingsRef,
        where('customerId', '==', customerId),
        where('branchId', '==', userBranchId)
      );
    } else {
      // Fallback to just customerId if no branch
      q = query(
        buildingsRef,
        where('customerId', '==', customerId)
      );
    }

    const querySnapshot = await getDocs(q);
    const buildings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];
    
    // Filter by branchId on client side if provided differently

    const filtered = branchId 
      ? buildings.filter(building => building.branchId === branchId)
      : buildings;
    
    // Sort by createdAt on client side (most recent first)
    return filtered.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  } catch (error: any) {
    console.error('Error fetching buildings by customer:', error);
    
    // Handle missing index error - fallback to querying by branchId if available
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      if (branchId) {
        logger.warn('⚠️ Missing Firestore index detected. Falling back to branchId query + client-side filtering.');
        try {
          const buildingsRef = collection(db, 'buildings');
          let q = query(
            buildingsRef,
            where('branchId', '==', branchId),
            orderBy('createdAt', 'desc')
          );
          
          try {
            const snapshot = await getDocs(q);
            const buildings = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Building[];

            // Filter by customerId on client side
            return buildings.filter(building => building.customerId === customerId);
          } catch (indexError: any) {
            // If index is still building, try without orderBy
            if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
              logger.warn('⚠️ Index still building. Querying without orderBy...');
              q = query(
                buildingsRef,
                where('branchId', '==', branchId)
              );
              
              const snapshot = await getDocs(q);
              const buildings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              })) as Building[];

              // Filter by customerId on client side and sort manually
              const filtered = buildings.filter(building => building.customerId === customerId);
              return filtered.sort((a, b) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              });
            }
            throw indexError;
          }
        } catch (branchError: any) {
          console.error('Error fetching buildings by branch:', branchError);
          // If permission error, return empty array
          if (branchError.code === 'permission-denied') {
            return [];
          }
          throw branchError;
        }
      }
    }
    
    // If permission error, return empty array instead of throwing
    if (error.code === 'permission-denied') {
      logger.warn('⚠️ Permission denied when fetching buildings. Returning empty array.');
      return [];
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
      logger.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
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

// Find or create a building for a customer
// This ensures all reports are linked to a building entity
export const findOrCreateBuilding = async (
  customerId: string,
  address: string,
  branchId: string,
  roofType?: string,
  roofSize?: number,
  buildingType?: string,
  createdBy?: string
): Promise<string> => {
  try {
    if (!address || !address.trim()) {
      throw new Error('Building address is required');
    }

    // First, try to find existing building by customer and address
    const buildingsRef = collection(db, 'buildings');
    let q = query(
      buildingsRef,
      where('customerId', '==', customerId),
      where('branchId', '==', branchId)
    );

    try {
      const snapshot = await getDocs(q);
      const buildings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Building[];

      // Find building with matching address (case-insensitive, normalized)
      const normalizedAddress = address.trim().toLowerCase();
      const existingBuilding = buildings.find(b => 
        b.address?.trim().toLowerCase() === normalizedAddress
      );

      if (existingBuilding) {
        logger.log('✅ Found existing building:', existingBuilding.id);
        return existingBuilding.id;
      }
    } catch (queryError: any) {
      // If query fails (e.g., missing index), fall back to creating new building
      logger.warn('⚠️ Could not query buildings, will create new one:', queryError.message);
    }

    // No existing building found, create a new one
    logger.log('🔨 Creating new building for address:', address);
    const newBuilding: Omit<Building, 'id' | 'createdAt'> = {
      customerId: customerId,
      address: address.trim(),
      branchId: branchId,
      roofType: roofType as any,
      roofSize: roofSize,
      buildingType: buildingType as any,
      createdBy: createdBy,
    };

    const buildingId = await createBuilding(newBuilding);
    logger.log('✅ Created new building:', buildingId);
    return buildingId;
  } catch (error) {
    console.error('Error finding or creating building:', error);
    throw new Error('Failed to find or create building');
  }
};

// Get combined activity timeline for a building
export const getBuildingActivity = async (
  buildingId: string,
  customerId: string,
  branchId?: string
): Promise<BuildingActivity[]> => {
  try {
    const activities: BuildingActivity[] = [];

    // Fetch reports, service agreements, and scheduled visits in parallel
    const [reports, serviceAgreements, scheduledVisits] = await Promise.all([
      // Import dynamically to avoid circular dependencies
      import('./reportService').then(module => module.getReportsByBuildingId(buildingId, branchId).catch(() => [])),
      import('./serviceAgreementService').then(module => module.getServiceAgreementsByBuilding(buildingId).catch(() => [])),
      import('./scheduledVisitService').then(module => module.getScheduledVisitsByBuilding(buildingId).catch(() => [])),
    ]) as [Report[], ServiceAgreement[], ScheduledVisit[]];

    // Convert reports to activities
    reports.forEach(report => {
      activities.push({
        id: report.id,
        type: 'report',
        title: report.isOffer
          ? `Offer - ${report.customerName || 'Customer'}`
          : `Inspection Report - ${report.customerName || 'Customer'}`,
        description: report.conditionNotes || undefined,
        date: report.inspectionDate || report.createdAt,
        status: report.status,
        link: `/reports/${report.id}`,
        metadata: {
          reportId: report.id,
          inspectionDate: report.inspectionDate,
          roofType: report.roofType,
          issuesFound: report.issuesFound?.length || 0,
          isOffer: report.isOffer,
        },
      });
    });

    // Convert service agreements to activities
    serviceAgreements.forEach(agreement => {
      activities.push({
        id: agreement.id,
        type: 'service_agreement',
        title: `${agreement.agreementType.charAt(0).toUpperCase() + agreement.agreementType.slice(1)} Service Agreement`,
        description: agreement.description || agreement.title,
        date: agreement.createdAt,
        status: agreement.status,
        link: `/portal/service-agreements/${agreement.id}`,
        metadata: {
          agreementId: agreement.id,
          agreementType: agreement.agreementType,
          startDate: agreement.startDate,
          endDate: agreement.endDate,
          nextServiceDate: agreement.nextServiceDate,
        },
      });

      // Add next service date as a future activity if active
      if (agreement.status === 'active' && agreement.nextServiceDate) {
        const nextServiceDate = new Date(agreement.nextServiceDate);
        if (nextServiceDate >= new Date()) {
          activities.push({
            id: `${agreement.id}-next-service`,
            type: 'scheduled_visit',
            title: `Scheduled Service - ${agreement.title}`,
            description: `Next service visit scheduled`,
            date: agreement.nextServiceDate,
            status: 'scheduled',
            link: `/portal/service-agreements/${agreement.id}`,
            metadata: {
              agreementId: agreement.id,
              serviceType: agreement.agreementType,
            },
          });
        }
      }
    });

    // Convert scheduled visits to activities
    scheduledVisits.forEach(visit => {
      activities.push({
        id: visit.id,
        type: 'scheduled_visit',
        title: visit.title || `Scheduled Visit - ${visit.customerName}`,
        description: visit.description || visit.inspectorNotes || undefined,
        date: visit.scheduledDate,
        status: visit.status,
        link: `/portal/scheduled-visits/${visit.id}`,
        metadata: {
          visitId: visit.id,
          scheduledTime: visit.scheduledTime,
          visitType: visit.visitType,
          assignedInspector: visit.assignedInspectorName,
          customerResponse: visit.customerResponse,
        },
      });
    });

    // Sort by date (newest first)
    activities.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return activities;
  } catch (error) {
    console.error('Error fetching building activity:', error);
    throw new Error('Failed to fetch building activity');
  }
};

