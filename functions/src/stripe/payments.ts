/**
 * Stripe Cloud Functions
 * Backend payment processing for subscriptions and invoices
 * 
 * Location: functions/src/stripe/payments.ts
 * Deploy: firebase deploy --only functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Define the secret parameter
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

const db = admin.firestore();

// ============================================
// CREATE SUBSCRIPTION CHECKOUT SESSION
// ============================================

export const createSubscriptionCheckout = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    // Initialize Stripe with the secret
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { customerId, planId, email, successUrl, cancelUrl } = request.data;

    // Verify user owns customerId (uid or companyId)
    if (request.auth.uid !== customerId) {
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      const userCompanyId = userDoc.exists ? userDoc.data()?.companyId : null;
      if (userCompanyId !== customerId) {
        throw new HttpsError('permission-denied', 'Cannot create checkout for other users');
      }
    }

    try {
      // Get plan from Firestore
      const planDoc = await db.collection('subscriptionPlans').doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError('not-found', 'Subscription plan not found');
      }

      const plan = planDoc.data();
      if (!plan?.stripePriceId) {
        throw new HttpsError('invalid-argument', 'Plan has no Stripe price ID');
      }

      // Get or create Stripe customer
      let stripeCustomerId: string;
      const customerDoc = await db.collection('customers').doc(customerId).get();

      if (customerDoc.exists && customerDoc.data()?.stripeCustomerId) {
        stripeCustomerId = customerDoc.data()!.stripeCustomerId;
      } else {
        const stripeCustomer = await stripe.customers.create({
          email,
          metadata: {
            firebaseUid: customerId,
          },
        });
        stripeCustomerId = stripeCustomer.id;

        // Save mapping
        await db.collection('customers').doc(customerId).set(
          {
            stripeCustomerId,
            email,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          customerId,
          planId,
        },
      });

      return {
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new HttpsError('internal', 'Failed to create checkout session');
    }
  }
);

// ============================================
// UPDATE SUBSCRIPTION
// ============================================

export const updateSubscription = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    // Initialize Stripe with the secret
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subscriptionId, newPlanId } = request.data;

    try {
      // Get subscription from Firestore
      const subDoc = await db.collection('subscriptions').doc(subscriptionId).get();
      if (!subDoc.exists) {
        throw new HttpsError('not-found', 'Subscription not found');
      }

      const subscription = subDoc.data();
      if (!subscription) {
        throw new HttpsError('not-found', 'Subscription data not found');
      }
      
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      const userCompanyId = userDoc.exists ? userDoc.data()?.companyId : null;
      if (subscription.customerId !== request.auth.uid && subscription.customerId !== userCompanyId) {
        throw new HttpsError('permission-denied', 'Cannot update other users subscriptions');
      }

      // Get new plan
      const newPlanDoc = await db.collection('subscriptionPlans').doc(newPlanId).get();
      if (!newPlanDoc.exists) {
        throw new HttpsError('not-found', 'New plan not found');
      }

      const newPlan = newPlanDoc.data();
      if (!newPlan?.stripePriceId) {
        throw new HttpsError('invalid-argument', 'New plan has no Stripe price ID');
      }

      // Update Stripe subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: subscription.stripeSubscriptionItemId,
            price: newPlan.stripePriceId,
          },
        ],
      });

      // Update Firestore
      await db.collection('subscriptions').doc(subscriptionId).update({
        planId: newPlanId,
        amount: newPlan.price,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new HttpsError('internal', 'Failed to update subscription');
    }
  }
);

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

export const cancelSubscription = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    // Initialize Stripe with the secret
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subscriptionId, reason } = request.data;

    try {
      // Get subscription from Firestore
      const subDoc = await db.collection('subscriptions').doc(subscriptionId).get();
      if (!subDoc.exists) {
        throw new HttpsError('not-found', 'Subscription not found');
      }

      const subscription = subDoc.data();
      if (!subscription) {
        throw new HttpsError('not-found', 'Subscription data not found');
      }
      
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      const userCompanyId = userDoc.exists ? userDoc.data()?.companyId : null;
      if (subscription.customerId !== request.auth.uid && subscription.customerId !== userCompanyId) {
        throw new HttpsError('permission-denied', 'Cannot cancel other users subscriptions');
      }

      // Cancel Stripe subscription
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      // Update Firestore
      await db.collection('subscriptions').doc(subscriptionId).update({
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: reason || 'User initiated',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send cancellation email (if email service is set up)
      // await sendCancellationEmail(subscription.customerId)

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new HttpsError('internal', 'Failed to cancel subscription');
    }
  }
);

// ============================================
// WEBHOOK HANDLER - Stripe Events
// ============================================

import { onRequest } from 'firebase-functions/v2/https';

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey] },
  async (req, res) => {
    // Initialize Stripe with the secret
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2023-10-16',
    });

    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      res.status(400).send('Webhook Error: Invalid signature');
      return;
    }

    try {
      // Handle subscription events
      if (event.type === 'customer.subscription.created') {
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, stripe);
      } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, stripe);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, stripe);
    }

    // Handle payment events
    else if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, stripe);
    } else if (event.type === 'invoice.payment_failed') {
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, stripe);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
  }
);

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Subscription created:', stripeSubscription.id);

  // Get customer UID from Stripe metadata
  const stripeCustomer = await stripe.customers.retrieve(stripeSubscription.customer as string);
  const customerId = stripeCustomer.deleted ? undefined : stripeCustomer.metadata?.firebaseUid;

  if (!customerId) {
    console.error('No Firebase UID found for customer');
    return;
  }

  // Get plan from Stripe price metadata
  const priceId = stripeSubscription.items.data[0].price.id;

  // Find plan in Firestore with this stripePriceId
  const planSnapshot = await db
    .collection('subscriptionPlans')
    .where('stripePriceId', '==', priceId)
    .limit(1)
    .get();

  if (planSnapshot.empty) {
    console.error('No plan found for price:', priceId);
    return;
  }

  const planId = planSnapshot.docs[0].id;

  // Create subscription record in Firestore
  await db.collection('subscriptions').add({
    customerId,
    planId,
    stripeSubscriptionId: stripeSubscription.id,
    stripeSubscriptionItemId: stripeSubscription.items.data[0].id,
    status: 'active',
    amount: stripeSubscription.items.data[0].price.unit_amount,
    currency: stripeSubscription.currency,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    autoRenew: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Subscription updated:', stripeSubscription.id);

  // Find subscription in Firestore
  const subSnapshot = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', stripeSubscription.id)
    .limit(1)
    .get();

  if (subSnapshot.empty) {
    console.error('Subscription not found:', stripeSubscription.id);
    return;
  }

  const subDoc = subSnapshot.docs[0];

  // Update status
  const newStatus =
    stripeSubscription.status === 'active'
      ? 'active'
      : stripeSubscription.status === 'past_due'
        ? 'past_due'
        : 'paused';

  await subDoc.ref.update({
    status: newStatus,
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription, stripe: Stripe) {
  console.log('Subscription deleted:', stripeSubscription.id);

  // Find subscription in Firestore
  const subSnapshot = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', stripeSubscription.id)
    .limit(1)
    .get();

  if (subSnapshot.empty) {
    return;
  }

  const subDoc = subSnapshot.docs[0];

  // Update status to canceled
  await subDoc.ref.update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Invoice payment succeeded:', stripeInvoice.id);

  // Store invoice in Firestore
  const stripeCustomer = await stripe.customers.retrieve(stripeInvoice.customer as string);
  const customerId = stripeCustomer.deleted ? undefined : stripeCustomer.metadata?.firebaseUid;

  if (!customerId) {
    return;
  }

  await db.collection('invoices').add({
    customerId,
    stripeInvoiceId: stripeInvoice.id,
    subscriptionId: stripeInvoice.subscription,
    amount: stripeInvoice.total,
    currency: stripeInvoice.currency,
    status: 'paid',
    invoiceNumber: stripeInvoice.number,
    invoiceDate: new Date(stripeInvoice.created * 1000),
    dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    pdfUrl: stripeInvoice.invoice_pdf,
    hostedUrl: stripeInvoice.hosted_invoice_url,
    lineItems: stripeInvoice.lines.data.map((line) => ({
      description: line.description,
      amount: line.amount,
      quantity: line.quantity,
      unitPrice: line.amount / (line.quantity || 1),
      category: 'subscription',
    })),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice, stripe: Stripe) {
  console.log('Invoice payment failed:', stripeInvoice.id);

  // Update subscription status to past_due
  const subSnapshot = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', stripeInvoice.subscription)
    .limit(1)
    .get();

  if (!subSnapshot.empty) {
    await subSnapshot.docs[0].ref.update({
      status: 'past_due',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Send payment failed email
  // await sendPaymentFailedEmail(customerId, stripeInvoice)
}
