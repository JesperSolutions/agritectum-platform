/**
 * Billing Dashboard Component
 * Main portal for customers to manage subscriptions, invoices, and payment methods
 */

import React, { useState } from 'react';
import { useStripe } from '../../contexts/StripeContext';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Settings,
} from 'lucide-react';
import SubscriptionTierWarning from './SubscriptionTierWarning';

export const BillingDashboard: React.FC = () => {
  const {
    currentSubscription,
    paymentMethods,
    invoices,
    plans,
    loading,
    error,
    formatPrice,
    getRemainingDays,
    selectPlan,
    upgradePlan,
    downgradePlan,
    cancelCurrentSubscription,
  } = useStripe();

  const [expandedSection, setExpandedSection] = useState<string | null>('subscription');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Tier Warning */}
      <SubscriptionTierWarning />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Billing Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'subscription' ? null : 'subscription')
          }
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Current Subscription</h2>
          </div>
          <div className="text-sm">
            {currentSubscription ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {currentSubscription.status.charAt(0).toUpperCase() +
                  currentSubscription.status.slice(1)}
              </span>
            ) : (
              <span className="text-gray-500">No active subscription</span>
            )}
          </div>
        </button>

        {expandedSection === 'subscription' && (
          <div className="border-t px-6 py-4 space-y-4">
            {currentSubscription ? (
              <>
                {/* Subscription Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold">
                      {plans.find((p) => p.id === currentSubscription.planId)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Cycle</p>
                    <p className="font-semibold capitalize">{currentSubscription.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold">
                      {formatPrice(currentSubscription.amount, currentSubscription.currency)}
                      {currentSubscription.billingCycle === 'monthly' ? '/month' : '/year'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Days</p>
                    <p className="font-semibold">{getRemainingDays()} days</p>
                  </div>
                </div>

                {/* Period */}
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600 mb-2">Current Billing Period</p>
                  <p className="text-sm">
                    {new Date(currentSubscription.currentPeriodStart).toLocaleDateString('da-DK')}{' '}
                    –{' '}
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('da-DK')}
                  </p>
                </div>

                {/* Plan Management */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Change Plan</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`border rounded p-3 ${
                          plan.id === currentSubscription.planId ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-semibold text-sm">{plan.name}</p>
                        <p className="text-xs text-gray-600 mb-2">{plan.features.length} features</p>
                        {plan.id !== currentSubscription.planId && (
                          <button
                            onClick={() =>
                              plan.tier >
                              (plans.find((p) => p.id === currentSubscription.planId)?.tier as any)
                                ? upgradePlan(plan.id)
                                : downgradePlan(plan.id)
                            }
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 w-full"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancel Subscription */}
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-sm text-red-900 mb-3">
                      Are you sure you want to cancel? You'll lose access after the current billing period
                      ends.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelCurrentSubscription('User requested cancellation')}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                      >
                        Keep Subscription
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active subscription yet</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border rounded p-4">
                      <h3 className="font-semibold mb-2">{plan.name}</h3>
                      <p className="text-lg font-bold mb-2">
                        {formatPrice(plan.price, plan.currency)}
                        <span className="text-sm text-gray-600">
                          {plan.billingCycle === 'monthly' ? '/month' : '/year'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mb-3">Up to {plan.buildingLimit} buildings</p>
                      <button 
                        onClick={() => selectPlan(plan.id)}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {loading ? 'Processing...' : 'Subscribe Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'payments' ? null : 'payments')
          }
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Payment Methods</h2>
          </div>
          <span className="text-sm text-gray-500">{paymentMethods.length} saved</span>
        </button>

        {expandedSection === 'payments' && (
          <div className="border-t px-6 py-4 space-y-3">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <div key={method.id} className="border rounded p-4 flex items-center justify-between">
                  <div>
                    {method.cardBrand && (
                      <>
                        <p className="font-semibold capitalize">
                          {method.cardBrand} ending in {method.cardLast4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {method.cardExpMonth}/{method.cardExpYear}
                        </p>
                      </>
                    )}
                    {method.isDefault && (
                      <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('Remove this payment method?')) {
                        // TODO: Implement remove payment method
                        alert('Payment method removal not yet implemented');
                      }
                    }}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">No payment methods saved</p>
            )}
            <button 
              onClick={() => {
                // TODO: Implement add payment method with Stripe
                alert('Payment method management not yet implemented');
              }}
              className="w-full py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium text-sm"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setExpandedSection(expandedSection === 'invoices' ? null : 'invoices')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Invoices</h2>
          </div>
          <span className="text-sm text-gray-500">{invoices.length} total</span>
        </button>

        {expandedSection === 'invoices' && (
          <div className="border-t px-6 py-4">
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'open'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString('da-DK')} –{' '}
                        {formatPrice(invoice.amount, invoice.currency)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          download
                          className="text-blue-600 hover:text-blue-700"
                          title="Download PDF"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      )}
                      {invoice.hostedUrl && (
                        <a
                          href={invoice.hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          title="View Invoice"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No invoices yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
