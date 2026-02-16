/**
 * Pricing Table Component
 * Displays subscription plans and allows customers to select or upgrade
 */

import React from 'react';
import { useStripe } from '../../contexts/StripeContext';
import { Check, X } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';

export const PricingTable: React.FC = () => {
  const { plans, currentSubscription, loading, selectPlan, upgradePlan, downgradePlan, formatPrice, actionLoading, canUpgrade: checkCanUpgrade } =
    useStripe();
  const { t } = useIntl();

  if (loading) {
    return <div className="text-center py-8">{t('billing.subscription.processing')}</div>;
  }

  // Sort plans by tier
  const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
  const sortedPlans = [...plans].sort(
    (a, b) => tierOrder[a.tier as keyof typeof tierOrder] - tierOrder[b.tier as keyof typeof tierOrder]
  );

  const currentPlanId = currentSubscription?.planId;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('billing.pricing.title')}</h2>
          <p className="text-xl text-gray-600">
            {t('billing.pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {sortedPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isHigherTier =
              currentPlanId &&
              currentSubscription &&
              tierOrder[plan.tier as keyof typeof tierOrder] >
                tierOrder[plans.find((p) => p.id === currentPlanId)?.tier as keyof typeof tierOrder];

            return (
              <div
                key={plan.id}
                className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''
                }`}
              >
                {/* Header */}
                <div
                  className={`px-6 py-8 ${
                    isCurrent ? 'bg-blue-600' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-2 ${isCurrent ? 'text-white' : 'text-gray-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${isCurrent ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="px-6 py-8 bg-white border-b-2">
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency).split(',')[0]}
                    </span>
                    <span className="text-gray-600">
                      {plan.billingCycle === 'monthly' ? t('billing.subscription.perMonth') : t('billing.subscription.perYear')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    {t('billing.pricing.upToProperties', { count: plan.buildingLimit })}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (isCurrent) return;
                      if (!currentPlanId) {
                        selectPlan(plan.id);
                      } else if (isHigherTier) {
                        upgradePlan(plan.id);
                      } else {
                        downgradePlan(plan.id);
                      }
                    }}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded font-semibold transition ${
                      isCurrent
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCurrent ? t('billing.pricing.currentPlan') : isHigherTier ? t('billing.subscription.upgrade') : t('billing.pricing.choosePlan')}
                  </button>
                </div>

                {/* Features List */}
                <div className="px-6 py-8">
                  <p className="text-sm font-semibold text-gray-900 mb-4">{t('billing.pricing.featuresIncluded')}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Badge */}
                {plan.tier === 'professional' && (
                  <div className="bg-blue-50 px-6 py-3 text-center">
                    <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t('billing.pricing.mostPopular')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('billing.pricing.faq.title')}</h3>

          <div className="space-y-6">
            <details className="group border rounded-lg p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gray-900 group-open:text-blue-600">
                {t('billing.pricing.faq.changePlans.question')}
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                {t('billing.pricing.faq.changePlans.answer')}
              </p>
            </details>

            <details className="group border rounded-lg p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gray-900 group-open:text-blue-600">
                {t('billing.pricing.faq.buildingLimit.question')}
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                {t('billing.pricing.faq.buildingLimit.answer')}
              </p>
            </details>

            <details className="group border rounded-lg p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gray-900 group-open:text-blue-600">
                {t('billing.pricing.faq.freeTrial.question')}
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                {t('billing.pricing.faq.freeTrial.answer')}
              </p>
            </details>

            <details className="group border rounded-lg p-6 cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gray-900 group-open:text-blue-600">
                {t('billing.pricing.faq.paymentMethods.question')}
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                {t('billing.pricing.faq.paymentMethods.answer')}
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTable;
