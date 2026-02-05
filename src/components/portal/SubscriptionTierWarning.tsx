import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  canAddBuilding, 
  getSubscriptionPlan,
  getUserSubscription 
} from '../../services/subscriptionTierService';
import { logger } from '../../utils/logger';

const SubscriptionTierWarning: React.FC = () => {
  const { currentUser } = useAuth();
  const [tierInfo, setTierInfo] = useState<{
    tierName: string;
    currentCount: number;
    limit: number | undefined;
    isNearLimit: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTierInfo();
  }, [currentUser]);

  const checkTierInfo = async () => {
    if (!currentUser?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const customerId = currentUser.companyId || currentUser.uid;
      
      // Get subscription
      const subscription = await getUserSubscription(customerId);
      if (!subscription) {
        setLoading(false);
        return;
      }

      // Get plan
      const plan = await getSubscriptionPlan(subscription.plan || subscription.stripePriceId);
      if (!plan) {
        setLoading(false);
        return;
      }

      // Get current count
      const canAdd = await canAddBuilding(customerId);
      
      if (canAdd.currentCount !== undefined && plan.buildingLimit) {
        const percentageUsed = (canAdd.currentCount / plan.buildingLimit) * 100;
        const isNearLimit = percentageUsed >= 80;

        setTierInfo({
          tierName: plan.tier?.charAt(0).toUpperCase() + plan.tier?.slice(1) || 'Standard',
          currentCount: canAdd.currentCount,
          limit: plan.buildingLimit,
          isNearLimit,
        });
      }
    } catch (error) {
      logger.error('Error checking tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tierInfo || !tierInfo.isNearLimit || !tierInfo.limit) {
    return null;
  }

  const percentageUsed = (tierInfo.currentCount / tierInfo.limit) * 100;

  return (
    <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
        <div className='flex-1'>
          <h3 className='font-semibold text-amber-900'>
            Approaching Building Limit
          </h3>
          <p className='text-sm text-amber-800 mt-1'>
            You're using {tierInfo.currentCount} of {tierInfo.limit} buildings on your {tierInfo.tierName} plan 
            ({Math.round(percentageUsed)}%).
          </p>
          <p className='text-sm text-amber-700 mt-2'>
            To add more buildings, upgrade your subscription plan.
          </p>
          <a
            href='/portal/pricing'
            className='inline-flex items-center gap-2 mt-3 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition-colors'
          >
            Upgrade Plan
            <ArrowRight className='h-4 w-4' />
          </a>
        </div>
      </div>

      {/* Progress bar */}
      <div className='mt-4'>
        <div className='flex justify-between text-xs text-amber-700 mb-1'>
          <span>Buildings used</span>
          <span>{tierInfo.currentCount}/{tierInfo.limit}</span>
        </div>
        <div className='w-full bg-amber-200 rounded-full h-2'>
          <div
            className='bg-amber-600 h-2 rounded-full transition-all'
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTierWarning;
