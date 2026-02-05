/**
 * Payment Service
 * Handles all Stripe integration for subscriptions, invoices, and billing
 * 
 * Firestore Collections:
 * - subscriptions/{subscriptionId} - Customer subscriptions
 * - invoices/{invoiceId} - Customer invoices
 * - paymentMethods/{paymentMethodId} - Saved payment methods
 * - billingContacts/{contactId} - Billing contact info
 * - subscriptionPlans/{planId} - Available subscription plans
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Subscription,
  Invoice,
  PaymentMethod,
  SubscriptionPlan,
  BillingContact,
  CustomerBilling,
} from '../types';

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const q = query(
      collection(db, 'subscriptionPlans'),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as SubscriptionPlan[];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}

/**
 * Get subscription plan by ID
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const docSnap = await getDoc(doc(db, 'subscriptionPlans', planId));
    if (!docSnap.exists()) return null;
    return {
      ...docSnap.data(),
      id: docSnap.id,
    } as SubscriptionPlan;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw error;
  }
}

/**
 * Get customer's current subscription
 */
export async function getCustomerSubscription(
  customerId: string
): Promise<Subscription | null> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('customerId', '==', customerId),
      where('status', '==', 'active'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return {
      ...snapshot.docs[0].data(),
      id: snapshot.docs[0].id,
    } as Subscription;
  } catch (error) {
    console.error('Error fetching customer subscription:', error);
    throw error;
  }
}

/**
 * Get all subscriptions for a customer (including inactive)
 */
export async function getCustomerSubscriptionHistory(
  customerId: string
): Promise<Subscription[]> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Subscription[];
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    throw error;
  }
}

/**
 * Create a new subscription
 * Returns the new subscription ID
 */
export async function createSubscription(
  customerId: string,
  planId: string,
  stripeSubscriptionId: string,
  billingCycle: 'monthly' | 'annual' | 'semi-annual'
): Promise<string> {
  try {
    const plan = await getSubscriptionPlan(planId);
    if (!plan) throw new Error('Subscription plan not found');

    // Calculate period dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = new Date(now);

    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else if (billingCycle === 'semi-annual') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
    }

    const subscription: Omit<Subscription, 'id'> = {
      customerId,
      planId,
      stripeSubscriptionId,
      status: 'active',
      billingCycle,
      amount: plan.price,
      currency: plan.currency,
      currentPeriodStart: currentPeriodStart.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'web_portal',
      },
    };

    const docRef = await addDoc(collection(db, 'subscriptions'), subscription);
    return docRef.id;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      cancelReason: reason || 'User initiated',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Get customer's invoices
 */
export async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('customerId', '==', customerId),
      orderBy('invoiceDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Invoice[];
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }
}

/**
 * Store a new invoice
 */
export async function storeInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error storing invoice:', error);
    throw error;
  }
}

/**
 * Get saved payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
  try {
    const q = query(
      collection(db, 'paymentMethods'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as PaymentMethod[];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

/**
 * Save a payment method
 */
export async function savePaymentMethod(
  customerId: string,
  stripePaymentMethodId: string,
  paymentMethod: Stripe.PaymentMethod,
  isDefault: boolean = false
): Promise<string> {
  try {
    // If this is being set as default, unset others
    if (isDefault) {
      const existing = await getPaymentMethods(customerId);
      for (const method of existing) {
        if (method.isDefault) {
          await updateDoc(doc(db, 'paymentMethods', method.id), {
            isDefault: false,
          });
        }
      }
    }

    const pmData: Omit<PaymentMethod, 'id'> = {
      customerId,
      stripePaymentMethodId,
      type: paymentMethod.type as 'card' | 'bank_account',
      isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (paymentMethod.card) {
      pmData.cardBrand = paymentMethod.card.brand;
      pmData.cardLast4 = paymentMethod.card.last4;
      pmData.cardExpMonth = paymentMethod.card.exp_month;
      pmData.cardExpYear = paymentMethod.card.exp_year;
    }

    if (paymentMethod.us_bank_account) {
      pmData.bankCountry = 'US';
      pmData.bankAccountLast4 = paymentMethod.us_bank_account.last4;
    }

    const docRef = await addDoc(collection(db, 'paymentMethods'), pmData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving payment method:', error);
    throw error;
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'paymentMethods', paymentMethodId));
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}

/**
 * Get or create billing contact
 */
export async function getBillingContact(customerId: string): Promise<BillingContact | null> {
  try {
    const q = query(
      collection(db, 'billingContacts'),
      where('customerId', '==', customerId),
      where('isPrimary', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return {
      ...snapshot.docs[0].data(),
      id: snapshot.docs[0].id,
    } as BillingContact;
  } catch (error) {
    console.error('Error fetching billing contact:', error);
    throw error;
  }
}

/**
 * Create or update primary billing contact
 */
export async function saveBillingContact(
  customerId: string,
  contact: Omit<BillingContact, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Check for existing primary contact
    const existing = await getBillingContact(customerId);

    const contactData: Omit<BillingContact, 'id'> = {
      customerId,
      ...contact,
      isPrimary: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await updateDoc(doc(db, 'billingContacts', existing.id), contactData);
      return existing.id;
    } else {
      const docRef = await addDoc(collection(db, 'billingContacts'), contactData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving billing contact:', error);
    throw error;
  }
}

/**
 * Get complete billing information for a customer
 */
export async function getCustomerBilling(customerId: string): Promise<CustomerBilling> {
  try {
    const [subscription, paymentMethods, billingContact, invoices] = await Promise.all([
      getCustomerSubscription(customerId),
      getPaymentMethods(customerId),
      getBillingContact(customerId),
      getCustomerInvoices(customerId),
    ]);

    // Calculate total spent
    const totalSpent = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      customerId,
      currentSubscription: subscription || undefined,
      paymentMethods,
      billingContacts: billingContact ? [billingContact] : [],
      invoiceHistory: invoices,
      totalSpent,
      nextBillingDate: subscription?.currentPeriodEnd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching customer billing:', error);
    throw error;
  }
}
