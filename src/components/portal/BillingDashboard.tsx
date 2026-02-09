/**
 * Billing Dashboard Component - Modernized
 * Main portal for customers to manage subscriptions, invoices, and payment methods
 */

import React from 'react';
import { useStripe } from '../../contexts/StripeContext';
import {
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Download,
  TrendingUp,
  Building,
  ExternalLink,
} from 'lucide-react';
import SubscriptionTierWarning from './SubscriptionTierWarning';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';

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

  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    try {
      await cancelCurrentSubscription('User requested cancellation');
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the billing period.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      await selectPlan(planId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='max-w-6xl mx-auto p-6 space-y-6'>
        <Skeleton className='h-12 w-[300px]' />
        <div className='grid gap-6 md:grid-cols-2'>
          <Skeleton className='h-[200px]' />
          <Skeleton className='h-[200px]' />
        </div>
        <Skeleton className='h-[300px]' />
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-3xl font-light tracking-tight text-slate-900'>Billing & Subscription</h1>
        <p className='text-slate-600 mt-2'>
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Subscription Tier Warning */}
      <SubscriptionTierWarning />

      {/* Error Alert */}
      {error && (
        <Card className='border-red-200 bg-red-50 rounded-material shadow-material-2'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <h3 className='font-semibold text-red-900'>Billing Error</h3>
                <p className='text-red-700 text-sm mt-1'>{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentSubscription ? (
        <>
          {/* Current Subscription Overview */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card className='rounded-material shadow-material-2'>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5 text-slate-600' />
                    Current Plan
                  </span>
                  <Badge
                    variant={
                      currentSubscription.status === 'active'
                        ? 'default'
                        : currentSubscription.status === 'past_due'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {currentSubscription.status.charAt(0).toUpperCase() +
                      currentSubscription.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-2xl font-bold text-slate-900'>
                    {plans.find(p => p.id === currentSubscription.planId)?.name || 'Unknown Plan'}
                  </p>
                  <p className='text-slate-600'>
                    {formatPrice(currentSubscription.amount, currentSubscription.currency)}
                    <span className='text-sm'>
                      {currentSubscription.billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </p>
                </div>

                <Separator />

                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>Billing Cycle</span>
                    <span className='font-medium capitalize'>
                      {currentSubscription.billingCycle}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>Days Remaining</span>
                    <span className='font-medium'>{getRemainingDays()} days</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>Next Billing Date</span>
                    <span className='font-medium'>
                      {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('da-DK')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage & Limits */}
            <Card className='rounded-material shadow-material-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building className='h-5 w-5 text-slate-600' />
                  Usage & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-2'>
                    <span className='text-slate-600'>Buildings</span>
                    <span className='font-medium'>
                      <span className='text-slate-900'>0</span> /{' '}
                      {plans.find(p => p.id === currentSubscription.planId)?.buildingLimit ||
                        'Unlimited'}
                    </span>
                  </div>
                  <Progress value={0} className='h-2' />
                </div>

                <Separator />

                <div className='space-y-2'>
                  <p className='text-sm font-medium flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    Included Features
                  </p>
                  <ul className='text-sm text-slate-600 space-y-1 ml-6'>
                    {plans
                      .find(p => p.id === currentSubscription.planId)
                      ?.features.slice(0, 3)
                      .map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Management */}
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5 text-slate-600' />
                Change Plan
              </CardTitle>
              <CardDescription>Upgrade or downgrade your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {plans.map(plan => {
                  const isCurrentPlan = plan.id === currentSubscription.planId;
                  const currentPlanTier = plans.find(
                    p => p.id === currentSubscription.planId
                  )?.tier;
                  const isUpgrade = (plan.tier as any) > (currentPlanTier || '');

                  return (
                    <Card
                      key={plan.id}
                      className={`border-2 transition-all ${
                        isCurrentPlan
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className='text-lg'>{plan.name}</CardTitle>
                        <CardDescription className='text-xl font-bold text-slate-900'>
                          {formatPrice(plan.price, plan.currency)}
                          <span className='text-sm font-normal text-slate-600'>
                            {plan.billingCycle === 'monthly' ? '/mo' : '/yr'}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm text-slate-600 mb-3'>
                          Up to {plan.buildingLimit} buildings
                        </p>
                        {isCurrentPlan ? (
                          <Badge variant='secondary' className='w-full justify-center'>
                            Current Plan
                          </Badge>
                        ) : (
                          <Button
                            onClick={() =>
                              isUpgrade ? upgradePlan(plan.id) : downgradePlan(plan.id)
                            }
                            variant={isUpgrade ? 'default' : 'outline'}
                            className='w-full'
                          >
                            {isUpgrade ? 'Upgrade' : 'Switch'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className='flex justify-between border-t pt-6'>
              <p className='text-sm text-slate-600'>
                Need help choosing?{' '}
                <a href='#' className='text-slate-900 underline'>
                  Contact support
                </a>
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='destructive' size='sm'>
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      Your subscription will remain active until{' '}
                      <strong>
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(
                          'da-DK'
                        )}
                      </strong>
                      . After that, you'll lose access to all premium features.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant='outline'>Keep Subscription</Button>
                    </DialogClose>
                    <Button
                      variant='destructive'
                      onClick={handleCancelSubscription}
                    >
                      Yes, Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </>
      ) : (
        /* No Active Subscription */
        <Card className='rounded-material shadow-material-2'>
          <CardHeader className='text-center'>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>Choose a plan to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {plans.map(plan => (
                <Card
                  key={plan.id}
                  className='border-2 border-slate-200 hover:border-slate-300 transition-all flex flex-col'
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className='text-2xl font-bold text-slate-900'>
                      {formatPrice(plan.price, plan.currency)}
                      <span className='text-sm font-normal text-slate-600'>
                        {plan.billingCycle === 'monthly' ? '/month' : '/year'}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4 flex-grow'>
                    <p className='text-sm text-slate-600'>Up to {plan.buildingLimit} buildings</p>
                    <ul className='text-sm text-slate-600 space-y-2'>
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className='flex items-start gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-600 mt-0.5 flex-shrink-0' />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className='mt-auto'>
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={loading}
                      className='w-full'
                      variant={(plan.tier as string) === 'professional' ? 'default' : 'outline'}
                    >
                      {loading ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card className='rounded-material shadow-material-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5 text-slate-600' />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <div className='space-y-3'>
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className='flex items-center justify-between p-4 border border-slate-200 rounded-material hover:border-slate-300 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 bg-slate-100 rounded flex items-center justify-center'>
                      <CreditCard className='h-5 w-5 text-slate-600' />
                    </div>
                    <div>
                      {method.cardBrand && (
                        <>
                          <p className='font-medium capitalize'>
                            {method.cardBrand} •••• {method.cardLast4}
                          </p>
                          <p className='text-sm text-slate-600'>
                            Expires {method.cardExpMonth}/{method.cardExpYear}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {method.isDefault && <Badge variant='secondary'>Default</Badge>}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant='ghost' size='sm' className='text-red-600 hover:text-red-700'>
                          Remove
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Payment Method</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove this payment method?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant='outline'>Cancel</Button>
                          </DialogClose>
                          <Button
                            variant='destructive'
                            onClick={() => {
                              toast({
                                title: 'Not implemented',
                                description: 'Payment method removal will be available soon',
                                variant: 'default',
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
              <Separator className='my-4' />
              <Button
                variant='outline'
                className='w-full'
                onClick={() => {
                  toast({
                    title: 'Not implemented',
                    description: 'Payment method management will be available soon',
                    variant: 'default',
                  });
                }}
              >
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className='text-center py-12'>
              <CreditCard className='h-12 w-12 text-slate-300 mx-auto mb-4' />
              <h3 className='font-semibold text-slate-900 mb-2'>No payment methods</h3>
              <p className='text-sm text-slate-600 mb-4'>
                Add a payment method to manage your subscription
              </p>
              <Button
                variant='outline'
                onClick={() => {
                  toast({
                    title: 'Not implemented',
                    description: 'Payment method management will be available soon',
                    variant: 'default',
                  });
                }}
              >
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className='rounded-material shadow-material-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-slate-600' />
            Invoice History
          </CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className='space-y-2'>
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  className='flex items-center justify-between p-4 hover:bg-slate-50 rounded-material transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <FileText className='h-5 w-5 text-slate-600' />
                    <div>
                      <p className='font-medium'>{invoice.invoiceNumber}</p>
                      <p className='text-sm text-slate-600'>
                        {new Date(invoice.invoiceDate).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <p className='font-medium'>
                        {formatPrice(invoice.amount, invoice.currency)}
                      </p>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'open'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className='flex gap-1'>
                      {invoice.pdfUrl && (
                        <Button variant='ghost' size='sm' asChild>
                          <a href={invoice.pdfUrl} download title='Download PDF'>
                            <Download className='h-4 w-4' />
                          </a>
                        </Button>
                      )}
                      {invoice.hostedUrl && (
                        <Button variant='ghost' size='sm' asChild>
                          <a
                            href={invoice.hostedUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            title='View Invoice'
                          >
                            <FileText className='h-4 w-4' />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <FileText className='h-12 w-12 text-slate-300 mx-auto mb-4' />
              <h3 className='font-semibold text-slate-900 mb-2'>No invoices yet</h3>
              <p className='text-sm text-slate-600'>Your invoice history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;
