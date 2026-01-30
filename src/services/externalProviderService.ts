/**
 * External Service Provider Service
 * Manages external roofing companies that customers add manually
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ExternalServiceProvider } from '../types';
import { logger } from '../utils/logger';

const COLLECTION = 'externalServiceProviders';

/**
 * Create a new external service provider
 */
export async function createExternalProvider(
  providerData: Omit<ExternalServiceProvider, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    logger.log('Creating external provider:', providerData.companyName);

    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...providerData,
      createdAt: now,
      updatedAt: now,
    });

    logger.log('External provider created:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating external provider:', error);
    throw new Error('Failed to create external provider');
  }
}

/**
 * Get external provider by ID
 */
export async function getExternalProvider(providerId: string): Promise<ExternalServiceProvider | null> {
  try {
    const docRef = doc(db, COLLECTION, providerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ExternalServiceProvider;
  } catch (error) {
    logger.error('Error getting external provider:', error);
    throw new Error('Failed to get external provider');
  }
}

/**
 * Get external providers for a company
 */
export async function getExternalProvidersByCompany(companyId: string): Promise<ExternalServiceProvider[]> {
  try {
    logger.log('Fetching external providers for company:', companyId);

    const q = query(
      collection(db, COLLECTION),
      where('addedByCompanyId', '==', companyId),
      orderBy('companyName', 'asc')
    );

    const snapshot = await getDocs(q);
    const providers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ExternalServiceProvider[];

    logger.log(`Found ${providers.length} external providers`);
    return providers;
  } catch (error) {
    logger.error('Error fetching external providers:', error);
    throw new Error('Failed to fetch external providers');
  }
}

/**
 * Update external provider
 */
export async function updateExternalProvider(
  providerId: string,
  updates: Partial<ExternalServiceProvider>
): Promise<void> {
  try {
    logger.log('Updating external provider:', providerId);

    const docRef = doc(db, COLLECTION, providerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    logger.log('External provider updated');
  } catch (error) {
    logger.error('Error updating external provider:', error);
    throw new Error('Failed to update external provider');
  }
}

/**
 * Search for existing providers by company name or CVR
 * Used for de-duplication when adding new providers
 */
export async function searchExistingProviders(
  companyName: string,
  cvr?: string,
  companyId?: string
): Promise<ExternalServiceProvider[]> {
  try {
    logger.log('Searching for existing providers:', companyName, cvr);

    const results: ExternalServiceProvider[] = [];

    // Search by CVR if provided (exact match)
    if (cvr) {
      const q = query(
        collection(db, COLLECTION),
        where('cvr', '==', cvr)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data(),
        } as ExternalServiceProvider);
      });
    }

    // If CVR search found nothing, search by company name
    // Note: This is a simple implementation. For production, consider using
    // a more sophisticated fuzzy matching or search service like Algolia
    if (results.length === 0 && companyName) {
      let q;
      if (companyId) {
        q = query(
          collection(db, COLLECTION),
          where('addedByCompanyId', '==', companyId),
          where('companyName', '>=', companyName),
          where('companyName', '<=', companyName + '\uf8ff')
        );
      } else {
        q = query(
          collection(db, COLLECTION),
          where('isShared', '==', true),
          where('companyName', '>=', companyName),
          where('companyName', '<=', companyName + '\uf8ff')
        );
      }

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        const provider = {
          id: doc.id,
          ...doc.data(),
        } as ExternalServiceProvider;
        
        // Only add if not already in results
        if (!results.find(r => r.id === provider.id)) {
          results.push(provider);
        }
      });
    }

    logger.log(`Found ${results.length} matching providers`);
    return results;
  } catch (error) {
    logger.error('Error searching providers:', error);
    return [];
  }
}

/**
 * Mark provider as invited to join platform
 */
export async function inviteProviderToPlatform(
  providerId: string,
  invitedBy: string
): Promise<void> {
  try {
    logger.log('Inviting provider to platform:', providerId);

    await updateExternalProvider(providerId, {
      invitationStatus: 'invited',
      invitedAt: new Date().toISOString(),
      invitedBy,
    });

    logger.log('Provider invitation status updated');
  } catch (error) {
    logger.error('Error inviting provider:', error);
    throw new Error('Failed to invite provider');
  }
}

/**
 * Link external provider to platform branch (when they join)
 */
export async function linkProviderToBranch(
  providerId: string,
  branchId: string
): Promise<void> {
  try {
    logger.log('Linking provider to branch:', providerId, branchId);

    await updateExternalProvider(providerId, {
      platformBranchId: branchId,
      invitationStatus: 'accepted',
    });

    logger.log('Provider linked to branch');
  } catch (error) {
    logger.error('Error linking provider to branch:', error);
    throw new Error('Failed to link provider to branch');
  }
}
