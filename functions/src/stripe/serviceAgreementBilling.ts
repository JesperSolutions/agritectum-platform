/**
 * Service Agreement Billing Cloud Functions
 * Handles Stripe subscription creation and management for service agreements
 * 
 * IMPORTANT: Only internal providers (registered branches) can use billing
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { verifyProviderForBilling, getProviderDisplayName } from '../utils/providerVerification';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const db = admin.firestore();

// Type definition for Service Agreement (subset of fields we need)
interface ServiceAgreement {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  providerType: 'internal' | 'external';
  branchId?: string;
  externalProviderId?: string;
  title: string;
  agreementType: string;
  serviceFrequency: string;
  startDate: string;
  currency?: string;
  price?: number;
  pricingStructure?: {
    perRoof?: number;
    perSquareMeter?: number;
  };
  billingFrequency?: 'annual' | 'semi-annual';
  stripeSubscriptionId?: string;
  companyId?: string;
  buildingId?: string;
}

/**
 * Create Stripe subscription for a service agreement
 * 
 * Steps:
 * 1. Verify provider is authorized (internal only)
 * 2. Get agreement details
 * 3. Create Stripe Product (dynamic, per agreement)
 * 4. Create Stripe Price (based on pricingStructure)
 * 5. Create Stripe Subscription
 * 6. Update service agreement with billing info
 */
export const createServiceAgreementBilling = onCall(
  { secrets: [stripeSecretKey], region: 'europe-west1' },
  async (request) => {
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { serviceAgreementId } = request.data;

    if (!serviceAgreementId) {
      throw new HttpsError('invalid-argument', 'serviceAgreementId is required');
    }

    try {
      // Step 1: Verify provider authorization
      const verification = await verifyProviderForBilling(serviceAgreementId);
      
      if (!verification.isAuthorized) {
        throw new HttpsError(
          'permission-denied',
          `Billing not available: ${verification.reason}`
        );
      }

      // Step 2: Get service agreement details
      const agreementDoc = await db.collection('serviceAgreements').doc(serviceAgreementId).get();
      
      if (!agreementDoc.exists) {
        throw new HttpsError('not-found', 'Service agreement not found');
      }

      const agreement = { id: agreementDoc.id, ...agreementDoc.data() } as ServiceAgreement;

      // Check if billing already exists
      if (agreement.stripeSubscriptionId) {
        throw new HttpsError(
          'already-exists',
          'Billing is already set up for this service agreement'
        );
      }

      // Validate required billing fields
      if (!agreement.pricingStructure?.perRoof && !agreement.pricingStructure?.perSquareMeter) {
        throw new HttpsError(
          'failed-precondition',
          'Service agreement must have pricing structure (per roof or per square meter)'
        );
      }

      if (!agreement.currency) {
        throw new HttpsError(
          'failed-precondition',
          'Service agreement must have a currency'
        );
      }

      // Step 3: Calculate price
      const amount = calculateAgreementPrice(agreement);
      
      if (amount <= 0) {
        throw new HttpsError(
          'invalid-argument',
          'Calculated price must be greater than 0'
        );
      }

      // Step 4: Get or create Stripe customer
      const stripeCustomerId = await getOrCreateStripeCustomer(stripe, agreement);

      // Step 5: Get provider name for product description
      const providerName = await getProviderDisplayName(serviceAgreementId) || 'Service Provider';

      // Step 6: Create Stripe Product (dynamic, per agreement)
      const product = await stripe.products.create({
        name: `${agreement.title}`,
        description: `Service Agreement: ${agreement.agreementType} - ${agreement.serviceFrequency} service`,
        metadata: {
          serviceAgreementId,
          customerId: agreement.customerId,
          branchId: agreement.branchId || '',
          providerType: agreement.providerType,
          providerName,
        },
        active: true,
      });

      console.log('Created Stripe product:', product.id);

      // Step 7: Create Stripe Price based on billing frequency
      const recurringInterval = getBillingInterval(agreement.billingFrequency || 'annual');
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Convert to smallest currency unit (øre, cents)
        currency: agreement.currency.toLowerCase(),
        recurring: {
          interval: recurringInterval.interval,
          interval_count: recurringInterval.interval_count,
        },
        metadata: {
          serviceAgreementId,
          billingFrequency: agreement.billingFrequency || 'annual',
        },
      });

      console.log('Created Stripe price:', price.id);

      // Step 8: Create Stripe Subscription
      const subscriptionCreateParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: price.id }],
        billing_cycle_anchor: getStartTimestamp(agreement.startDate),
        metadata: {
          serviceAgreementId,
          branchId: agreement.branchId || '',
          buildingId: agreement.buildingId || '',
          agreementType: agreement.agreementType,
        },
        description: `${agreement.title} - ${providerName}`,
        collection_method: 'charge_automatically',
      };

      const subscription = await stripe.subscriptions.create(subscriptionCreateParams);

      console.log('Created Stripe subscription:', subscription.id);

      // Step 9: Update service agreement with Stripe billing info
      await db.collection('serviceAgreements').doc(serviceAgreementId).update({
        stripeProductId: product.id,
        stripePriceId: price.id,
        stripeSubscriptionId: subscription.id,
        billingStatus: 'active',
        billingEnabled: true,
        nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('Service agreement billing setup complete');

      return {
        success: true,
        subscriptionId: subscription.id,
        productId: product.id,
        priceId: price.id,
        amount,
        currency: agreement.currency,
        nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error creating service agreement billing:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        'internal',
        `Failed to set up billing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

/**
 * Cancel billing for a service agreement
 */
export const cancelServiceAgreementBilling = onCall(
  { secrets: [stripeSecretKey], region: 'europe-west1' },
  async (request) => {
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { serviceAgreementId, reason } = request.data;

    if (!serviceAgreementId) {
      throw new HttpsError('invalid-argument', 'serviceAgreementId is required');
    }

    try {
      // Get service agreement
      const agreementDoc = await db.collection('serviceAgreements').doc(serviceAgreementId).get();
      
      if (!agreementDoc.exists) {
        throw new HttpsError('not-found', 'Service agreement not found');
      }

      const agreement = agreementDoc.data() as ServiceAgreement;

      if (!agreement.stripeSubscriptionId) {
        throw new HttpsError('failed-precondition', 'No active billing found');
      }

      // Cancel Stripe subscription
      const subscription = await stripe.subscriptions.cancel(agreement.stripeSubscriptionId, {
        cancellation_details: {
          comment: reason || 'Service agreement cancelled',
        },
      });

      // Update service agreement
      await db.collection('serviceAgreements').doc(serviceAgreementId).update({
        billingStatus: 'cancelled',
        billingEnabled: false,
        updatedAt: new Date().toISOString(),
      });

      console.log('Cancelled billing for service agreement:', serviceAgreementId);

      return {
        success: true,
        cancelledAt: new Date(subscription.canceled_at! * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error cancelling service agreement billing:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        'internal',
        `Failed to cancel billing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate total price from service agreement
 */
function calculateAgreementPrice(agreement: ServiceAgreement): number {
  if (agreement.pricingStructure?.perRoof) {
    return agreement.pricingStructure.perRoof;
  }
  
  if (agreement.pricingStructure?.perSquareMeter) {
    // If per-m² pricing, would need building size
    // For now, return the per-m² rate (frontend should calculate total)
    return agreement.pricingStructure.perSquareMeter;
  }
  
  // Fallback to legacy price field
  return agreement.price || 0;
}

/**
 * Get Stripe recurring interval from billing frequency
 */
function getBillingInterval(
  billingFrequency: 'annual' | 'semi-annual'
): { interval: 'month' | 'year'; interval_count: number } {
  switch (billingFrequency) {
    case 'annual':
      return { interval: 'year', interval_count: 1 };
    case 'semi-annual':
      return { interval: 'month', interval_count: 6 };
    default:
      return { interval: 'year', interval_count: 1 };
  }
}

/**
 * Get start timestamp for subscription billing cycle
 */
function getStartTimestamp(startDate: string): number {
  const date = new Date(startDate);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Get or create Stripe customer for the agreement customer
 */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  agreement: ServiceAgreement
): Promise<string> {
  // Check if customer already has Stripe ID
  const customerDoc = await db.collection('customers').doc(agreement.customerId).get();
  
  if (customerDoc.exists) {
    const customerData = customerDoc.data();
    if (customerData?.stripeCustomerId) {
      return customerData.stripeCustomerId;
    }
  }

  // Create new Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email: agreement.customerEmail,
    name: agreement.customerName,
    description: `Customer: ${agreement.customerName}`,
    address: {
      line1: agreement.customerAddress || '',
    },
    metadata: {
      firebaseUid: agreement.customerId,
      companyId: agreement.companyId || '',
    },
  });

  // Store Stripe customer ID
  await db.collection('customers').doc(agreement.customerId).set(
    {
      stripeCustomerId: stripeCustomer.id,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return stripeCustomer.id;
}
