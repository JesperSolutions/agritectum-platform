/**
 * Provider Verification Utility
 * Validates that service providers are authorized to use billing features
 * 
 * Business Rules:
 * - Only INTERNAL providers (registered branches) can use billing
 * - External providers are customer-added contacts (no billing)
 * - Branch must be active and verified
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// Type definition for Service Agreement (subset of fields we need)
interface ServiceAgreement {
  id: string;
  providerType: 'internal' | 'external';
  branchId?: string;
  externalProviderId?: string;
}

export interface ProviderVerificationResult {
  isAuthorized: boolean;
  reason?: string;
  branchId?: string;
  branchName?: string;
}

/**
 * Verify if a service agreement provider is authorized for billing
 * 
 * @param agreementId - Service agreement ID
 * @returns Verification result with authorization status
 */
export async function verifyProviderForBilling(
  agreementId: string
): Promise<ProviderVerificationResult> {
  try {
    // Get service agreement
    const agreementDoc = await db.collection('serviceAgreements').doc(agreementId).get();
    
    if (!agreementDoc.exists) {
      return {
        isAuthorized: false,
        reason: 'Service agreement not found',
      };
    }
    
    const agreement = { id: agreementDoc.id, ...agreementDoc.data() } as ServiceAgreement;
    
    // Check provider type - MUST be internal
    if (agreement.providerType !== 'internal') {
      return {
        isAuthorized: false,
        reason: 'Only internal providers (registered branches) can use billing. This is an external provider.',
      };
    }
    
    // Check if branchId exists
    if (!agreement.branchId) {
      return {
        isAuthorized: false,
        reason: 'Internal provider must have a valid branchId',
      };
    }
    
    // Verify branch exists and is active
    const branchDoc = await db.collection('branches').doc(agreement.branchId).get();
    
    if (!branchDoc.exists) {
      return {
        isAuthorized: false,
        reason: 'Branch not found in system',
      };
    }
    
    const branchData = branchDoc.data();
    
    if (!branchData?.isActive) {
      return {
        isAuthorized: false,
        reason: 'Branch is not active',
      };
    }
    
    // All checks passed
    return {
      isAuthorized: true,
      branchId: agreement.branchId,
      branchName: branchData.name,
    };
  } catch (error) {
    console.error('Error verifying provider:', error);
    return {
      isAuthorized: false,
      reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if provider type supports billing
 * 
 * @param providerType - 'internal' or 'external'
 * @returns true if billing is supported
 */
export function isBillingSupported(providerType: 'internal' | 'external'): boolean {
  return providerType === 'internal';
}

/**
 * Get provider display name for billing
 * 
 * @param agreementId - Service agreement ID
 * @returns Provider display name or null
 */
export async function getProviderDisplayName(agreementId: string): Promise<string | null> {
  try {
    const agreementDoc = await db.collection('serviceAgreements').doc(agreementId).get();
    
    if (!agreementDoc.exists) {
      return null;
    }
    
    const agreement = agreementDoc.data() as ServiceAgreement;
    
    if (agreement.providerType === 'internal' && agreement.branchId) {
      const branchDoc = await db.collection('branches').doc(agreement.branchId).get();
      return branchDoc.exists ? branchDoc.data()?.name : null;
    }
    
    if (agreement.providerType === 'external' && agreement.externalProviderId) {
      const providerDoc = await db.collection('externalServiceProviders').doc(agreement.externalProviderId).get();
      return providerDoc.exists ? providerDoc.data()?.companyName : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting provider display name:', error);
    return null;
  }
}
