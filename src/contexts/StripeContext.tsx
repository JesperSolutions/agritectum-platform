/**
 * Stripe Context
 * Manages payment state, subscription status, and billing information
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { getCustomerBilling, getSubscriptionPlans } from '../services/paymentService';
import {
  Subscription,
  Invoice,
  PaymentMethod,
  SubscriptionPlan,
} from '../types';

import { logger } from '../utils/logger';

interface StripeContextType {
  // State
  currentSubscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;


  // Actions
  refreshBillingData: () => Promise<void>;
  selectPlan: (planId: string) => Promise<void>;
  upgradePlan: (planId: string) => Promise<void>;
  downgradePlan: (planId: string) => Promise<void>;
  cancelCurrentSubscription: (reason?: string) => Promise<void>;

  // Helpers
  formatPrice: (amount: number, currency: string) => string;
  getRemainingDays: () => number;
  canUpgrade: (planId: string) => boolean;
  canDowngrade: (planId: string) => boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, firebaseUser } = useAuth();

  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = currentUser?.uid ?? firebaseUser?.uid;
  const userEmail = currentUser?.email ?? firebaseUser?.email ?? '';

  // Fetch billing data
  const refreshBillingData = useCallback(async () => {
    if (!userId) {
      setCurrentSubscription(null);
      setPaymentMethods([]);
      setInvoices([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const billing = await getCustomerBilling(userId);
      setCurrentSubscription(billing.currentSubscription || null);
      setPaymentMethods(billing.paymentMethods);
      setInvoices(billing.invoiceHistory);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load subscription plans');
      }
    };
    loadPlans();
  }, []);

  // Refresh billing data when user changes
  useEffect(() => {
    refreshBillingData();
  }, [refreshBillingData]);

  // Select a plan (start checkout)
  const selectPlan = useCallback(
    async (planId: string) => {
      if (!userId || !userEmail) {
        setError('User email not found');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.info('Starting checkout for plan:', planId);

        // Call Cloud Function
        const createCheckout = httpsCallable(functions, 'createSubscriptionCheckout');
        const response = await createCheckout({
          customerId: userId,
          planId,
          email: userEmail,
          successUrl: `${window.location.origin}/portal/billing?success=true`,
          cancelUrl: `${window.location.origin}/portal/billing?cancelled=true`,
        });

        const data = response.data as { sessionId?: string };
        if (!data.sessionId) {
          throw new Error('No session ID returned');
        }

        logger.info('Checkout session created:', data.sessionId);

        // Redirect to Stripe Checkout
        const stripeCheckoutUrl = `https://checkout.stripe.com/pay/${data.sessionId}`;
        logger.info('Redirecting to:', stripeCheckoutUrl);
        
        // Open in new window for testing
        window.open(stripeCheckoutUrl, '_blank');
      } catch (err) {
        console.error('Error selecting plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to start checkout');
        logger.error('Checkout error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userEmail, userId]
  );

  const upgradePlan = useCallback(
    async (planId: string) => {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      if (!currentSubscription) {
        await selectPlan(planId);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.info('Upgrading to plan:', planId);

        const updateSub = httpsCallable(functions, 'updateSubscription');
        await updateSub({
          subscriptionId: currentSubscription.id,
          newPlanId: planId,
        });

        logger.info('Subscription upgraded successfully');
        await refreshBillingData();
      } catch (err) {
        console.error('Error upgrading plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
        logger.error('Upgrade error:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentSubscription, selectPlan, refreshBillingData, userId]
  );

  const downgradePlan = useCallback(
    async (planId: string) => {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      if (!currentSubscription) {
        setError('No active subscription to downgrade');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.info('Downgrading to plan:', planId);

        const updateSub = httpsCallable(functions, 'updateSubscription');
        await updateSub({
          subscriptionId: currentSubscription.id,
          newPlanId: planId,
        });

        logger.info('Subscription downgraded successfully');
        await refreshBillingData();
      } catch (err) {
        console.error('Error downgrading plan:', err);
        setError(err instanceof Error ? err.message : 'Failed to downgrade subscription');
        logger.error('Downgrade error:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentSubscription, refreshBillingData, userId]
  );

  const cancelCurrentSubscription = useCallback(
    async (reason?: string) => {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      if (!currentSubscription) {
        setError('No active subscription to cancel');
        return;
      }

      if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access after the current billing period ends.')) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.info('Cancelling subscription:', currentSubscription.id);

        const cancelSub = httpsCallable(functions, 'cancelSubscription');
        await cancelSub({
          subscriptionId: currentSubscription.id,
          reason,
        });

        logger.info('Subscription cancelled successfully');
        await refreshBillingData();
      } catch (err) {
        console.error('Error canceling subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
        logger.error('Cancel error:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentSubscription, refreshBillingData, userId]
  );


  // Format price for display
  const formatPrice = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency || 'DKK',
    }).format(amount / 100); // Convert from øre to DKK
  }, []);

  // Get remaining days until next billing
  const getRemainingDays = useCallback(() => {
    if (!currentSubscription) return 0;
    const end = new Date(currentSubscription.currentPeriodEnd);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  }, [currentSubscription]);

  // Check if can upgrade from current plan
  const canUpgrade = useCallback(
    (planId: string) => {
      if (!currentSubscription) return true;

      const currentPlan = plans.find((p) => p.id === currentSubscription.planId);
      const newPlan = plans.find((p) => p.id === planId);

      if (!currentPlan || !newPlan) return false;

      const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
      return tierOrder[newPlan.tier as keyof typeof tierOrder] >
        tierOrder[currentPlan.tier as keyof typeof tierOrder]
        ? true
        : false;
    },
    [currentSubscription, plans]
  );

  // Check if can downgrade from current plan
  const canDowngrade = useCallback(
    (planId: string) => {
      if (!currentSubscription) return false;

      const currentPlan = plans.find((p) => p.id === currentSubscription.planId);
      const newPlan = plans.find((p) => p.id === planId);

      if (!currentPlan || !newPlan) return false;

      const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
      return tierOrder[newPlan.tier as keyof typeof tierOrder] <
        tierOrder[currentPlan.tier as keyof typeof tierOrder]
        ? true
        : false;
    },
    [currentSubscription, plans]
  );

  const value: StripeContextType = {
    currentSubscription,
    paymentMethods,
    invoices,
    plans,
    loading,
    error,
    refreshBillingData,
    selectPlan,
    upgradePlan,
    downgradePlan,
    cancelCurrentSubscription,
    formatPrice,
    getRemainingDays,
    canUpgrade,
    canDowngrade,
  };

  return <StripeContext.Provider value={value}>{children}</StripeContext.Provider>;
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within StripeProvider');
  }
  return context;
};
