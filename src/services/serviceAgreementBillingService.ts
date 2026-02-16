/**
 * Service Agreement Billing Service (Frontend)
 * Handles billing operations for service agreements
 * 
 * IMPORTANT: Only works for internal providers (registered branches)
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ServiceAgreement } from '../types';
import { logger } from '../utils/logger';

export interface BillingSetupResult {
  success: boolean;
  subscriptionId?: string;
  productId?: string;
  priceId?: string;
  amount?: number;
  currency?: string;
  nextBillingDate?: string;
  error?: string;
}

export interface BillingCancellationResult {
  success: boolean;
  cancelledAt?: string;
  error?: string;
}

/**
 * Check if billing is supported for a service agreement
 * Only internal providers can use billing
 */
export function isBillingAvailable(agreement: ServiceAgreement): boolean {
  // Must be internal provider
  if (agreement.providerType !== 'internal') {
    return false;
  }

  // Must have a branchId
  if (!agreement.branchId) {
    return false;
  }

  // Must have pricing information
  if (!agreement.pricingStructure?.perRoof && !agreement.pricingStructure?.perSquareMeter && !agreement.price) {
    return false;
  }

  // Must have currency
  if (!agreement.currency) {
    return false;
  }

  return true;
}

/**
 * Check if billing is already set up
 */
export function isBillingSetup(agreement: ServiceAgreement): boolean {
  return !!(agreement.stripeSubscriptionId && agreement.billingEnabled);
}

/**
 * Get billing unavailability reason (for UI display)
 */
export function getBillingUnavailableReason(agreement: ServiceAgreement): string {
  if (agreement.providerType === 'external') {
    return 'Billing is only available for registered platform providers. This is an external provider added by a customer.';
  }

  if (!agreement.branchId) {
    return 'No branch information found for this provider.';
  }

  if (!agreement.pricingStructure?.perRoof && !agreement.pricingStructure?.perSquareMeter && !agreement.price) {
    return 'Service agreement must have pricing information before billing can be set up.';
  }

  if (!agreement.currency) {
    return 'Currency not specified for this service agreement.';
  }

  return 'Billing is not available for this service agreement.';
}

/**
 * Set up billing for a service agreement
 * Creates Stripe subscription automatically
 * 
 * @param serviceAgreementId - ID of the service agreement
 * @returns Result of billing setup
 */
export async function setupServiceAgreementBilling(
  serviceAgreementId: string
): Promise<BillingSetupResult> {
  try {
    logger.log('Setting up billing for service agreement:', serviceAgreementId);

    const createBilling = httpsCallable<
      { serviceAgreementId: string },
      BillingSetupResult
    >(functions, 'createServiceAgreementBilling');

    const result = await createBilling({ serviceAgreementId });

    if (result.data.success) {
      logger.log('Billing setup successful:', result.data);
      return result.data;
    } else {
      logger.error('Billing setup failed:', result.data.error);
      return {
        success: false,
        error: result.data.error || 'Failed to set up billing',
      };
    }
  } catch (error) {
    logger.error('Error setting up billing:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cancel billing for a service agreement
 * Cancels the Stripe subscription
 * 
 * @param serviceAgreementId - ID of the service agreement
 * @param reason - Optional reason for cancellation
 * @returns Result of billing cancellation
 */
export async function cancelServiceAgreementBilling(
  serviceAgreementId: string,
  reason?: string
): Promise<BillingCancellationResult> {
  try {
    logger.log('Cancelling billing for service agreement:', serviceAgreementId);

    const cancelBilling = httpsCallable<
      { serviceAgreementId: string; reason?: string },
      BillingCancellationResult
    >(functions, 'cancelServiceAgreementBilling');

    const result = await cancelBilling({ serviceAgreementId, reason });

    if (result.data.success) {
      logger.log('Billing cancelled successfully:', result.data);
      return result.data;
    } else {
      logger.error('Billing cancellation failed:', result.data.error);
      return {
        success: false,
        error: result.data.error || 'Failed to cancel billing',
      };
    }
  } catch (error) {
    logger.error('Error cancelling billing:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get billing status display text
 */
export function getBillingStatusText(status?: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past Due';
    case 'unpaid':
      return 'Unpaid';
    case 'cancelled':
      return 'Cancelled';
    case 'not_setup':
    default:
      return 'Not Set Up';
  }
}

/**
 * Get billing status color (for badges)
 */
export function getBillingStatusColor(status?: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'active':
      return 'green';
    case 'past_due':
      return 'yellow';
    case 'unpaid':
    case 'cancelled':
      return 'red';
    case 'not_setup':
    default:
      return 'gray';
  }
}

/**
 * Format billing amount for display
 */
export function formatBillingAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate days until next billing
 */
export function getDaysUntilNextBilling(nextBillingDate?: string): number | null {
  if (!nextBillingDate) {
    return null;
  }

  const next = new Date(nextBillingDate);
  const now = new Date();
  const diffTime = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
