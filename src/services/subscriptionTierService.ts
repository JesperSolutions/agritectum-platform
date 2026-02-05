import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SubscriptionPlan } from '../types';
import { logger } from '../utils/logger';

/**
 * Get user's active subscription
 */
export const getUserSubscription = async (customerId: string) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      return null;
    }

    const customerData = customerDoc.data();
    if (!customerData.activeSubscription) {
      return null;
    }

    // Get subscription details
    const subscriptionsRef = collection(db, `customers/${customerId}/subscriptions`);
    const subQuery = query(
      subscriptionsRef,
      where('stripeSubscriptionId', '==', customerData.activeSubscription)
    );
    
    const subSnapshot = await getDocs(subQuery);
    if (subSnapshot.empty) {
      return null;
    }

    return {
      id: subSnapshot.docs[0].id,
      ...subSnapshot.docs[0].data(),
    };
  } catch (error) {
    logger.error('Error getting user subscription:', error);
    return null;
  }
};

/**
 * Get subscription plan details
 */
export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan | null> => {
  try {
    const planRef = doc(db, 'subscriptionPlans', planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      return null;
    }

    return {
      id: planDoc.id,
      ...planDoc.data(),
    } as SubscriptionPlan;
  } catch (error) {
    logger.error('Error getting subscription plan:', error);
    return null;
  }
};

/**
 * Get user's current building count
 */
export const getUserBuildingCount = async (customerId: string): Promise<number> => {
  try {
    const buildingsRef = collection(db, 'buildings');
    const q = query(
      buildingsRef,
      where('customerId', '==', customerId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    logger.error('Error counting buildings:', error);
    return 0;
  }
};

/**
 * Check if user can add more buildings
 */
export const canAddBuilding = async (customerId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> => {
  try {
    // Get subscription
    const subscription = await getUserSubscription(customerId);
    
    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
      };
    }

    // Get plan details
    const plan = await getSubscriptionPlan(subscription.plan || subscription.stripePriceId);
    
    if (!plan) {
      return {
        allowed: false,
        reason: 'Invalid subscription plan',
      };
    }

    // Get current building count
    const currentCount = await getUserBuildingCount(customerId);

    // Check limit
    if (plan.buildingLimit && currentCount >= plan.buildingLimit) {
      return {
        allowed: false,
        reason: `Building limit reached (${currentCount}/${plan.buildingLimit})`,
        currentCount,
        limit: plan.buildingLimit,
      };
    }

    return {
      allowed: true,
      currentCount,
      limit: plan.buildingLimit,
    };
  } catch (error) {
    logger.error('Error checking building permissions:', error);
    return {
      allowed: false,
      reason: 'Error checking subscription',
    };
  }
};

/**
 * Check if user has access to feature
 */
export const hasFeatureAccess = async (
  customerId: string,
  feature: 'esg' | 'agreements' | 'scheduling' | 'api'
): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(customerId);
    
    if (!subscription) {
      return false;
    }

    const plan = await getSubscriptionPlan(subscription.plan || subscription.stripePriceId);
    
    if (!plan) {
      return false;
    }

    // Feature access rules
    const featureAccess: Record<string, string[]> = {
      esg: ['professional', 'enterprise'],
      agreements: ['professional', 'enterprise'],
      scheduling: ['professional', 'enterprise'],
      api: ['enterprise'],
    };

    return featureAccess[feature]?.includes(plan.tier) || false;
  } catch (error) {
    logger.error('Error checking feature access:', error);
    return false;
  }
};

/**
 * Get plan tier name for display
 */
export const getTierDisplayName = (tier: string): string => {
  const names: Record<string, string> = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return names[tier] || tier;
};

/**
 * Format building count display
 */
export const formatBuildingLimit = (current: number, limit: number | undefined): string => {
  if (!limit) {
    return 'Unlimited buildings';
  }
  return `${current}/${limit} buildings`;
};
