import React, { useState } from 'react';
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
  AlertTriangle,
  Clock,
} from 'lucide-react';
import SubscriptionTierWarning from './SubscriptionTierWarning';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
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
import { useIntl } from '../../hooks/useIntl';

export const BillingDashboard: React.FC = () => {
  const {
    currentSubscription,
    paymentMethods,
    invoices,
    plans,
    loading,
    actionLoading,
    error,
    formatPrice,
    getRemainingDays,
    selectPlan,
    upgradePlan,
    downgradePlan,
    cancelCurrentSubscription,
    canUpgrade,
    canDowngrade,
  } = useStripe();

  const { toast } = useToast();
  const { t, locale } = useIntl();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      await cancelCurrentSubscription('User requested cancellation');
      toast({
        title: t('billing.subscription.cancelledToast'),
        description: t('billing.subscription.cancelledDescription'),
      });
    } catch (error) {
      toast({
        title: t('billing.error.title'),
        description: t('billing.error.cancel'),
        variant: 'destructive',
      });
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      await selectPlan(planId);
    } catch (error) {
      toast({
        title: t('billing.error.title'),
        description: t('billing.error.checkout'),
        variant: 'destructive',
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const createPortalSession = httpsCallable(functions, 'createCustomerPortalSession');
      const result = await createPortalSession({
        customerId: currentSubscription?.customerId || '',
        returnUrl: window.location.href,
      }) as { data: { url: string } };
      
      // Redirect to Stripe Customer Portal
      window.location.href = result.data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
      setPortalLoading(false);
    }
  };

  // Calculate next retry date for past_due subscriptions (Stripe retries on days 3, 5, 7, 9, 11, 13, 15)
  const getNextRetryDate = () => {
    if (!currentSubscription || currentSubscription.status !== 'past_due') return null;
    
    const periodEnd = new Date(currentSubscription.currentPeriodEnd);
    const now = new Date();
    const daysSinceFailed = Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24));
    
    const retryDays = [3, 5, 7, 9, 11, 13, 15];
    const nextRetryDay = retryDays.find(day => day > daysSinceFailed);
    
    if (!nextRetryDay) return null;
    
    const nextRetry = new Date(periodEnd);
    nextRetry.setDate(periodEnd.getDate() + nextRetryDay);
    return nextRetry;
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
        <h1 className='text-3xl font-light tracking-tight text-slate-900'>{t('billing.title')}</h1>
        <p className='text-slate-600 mt-2'>
          {t('billing.subtitle')}
        </p>
      </div>

      {/* Subscription Tier Warning */}
      <SubscriptionTierWarning />

      {/* Past Due Payment Warning */}
      {currentSubscription && currentSubscription.status === 'past_due' && (
        <Alert variant='destructive' className='border-red-300 bg-red-50'>
          <AlertTriangle className='h-5 w-5' />
          <AlertTitle className='text-lg font-semibold'>Payment Failed - Action Required</AlertTitle>
          <AlertDescription className='mt-2 space-y-2'>
            <p className='text-red-900'>
              Your payment method was declined. Please update your payment information to avoid service interruption.
            </p>
            {getNextRetryDate() && (
              <p className='text-red-800 flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                Next automatic retry: {getNextRetryDate()?.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            <div className='mt-3'>
              <Button 
                variant='default' 
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className='bg-red-600 hover:bg-red-700'
              >
                {portalLoading ? 'Opening Portal...' : 'Update Payment Method'}
              </Button>
            </div>
            <p className='text-sm text-red-700 mt-2'>
              Stripe will automatically retry charging your payment method on days 3, 5, 7, 9, 11, 13, and 15 after the initial failure.
              If all retries fail, your subscription will be cancelled.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Card className='border-red-200 bg-red-50 rounded-material shadow-material-2'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <h3 className='font-semibold text-red-900'>{t('billing.error.title')}</h3>
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
                    {t('billing.subscription.currentPlan')}
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
                      {currentSubscription.billingCycle === 'monthly' ? t('billing.subscription.perMonth') : t('billing.subscription.perYear')}
                    </span>
                  </p>
                </div>

                <Separator />

                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>{t('billing.subscription.billingCycle')}</span>
                    <span className='font-medium capitalize'>
                      {currentSubscription.billingCycle === 'monthly' ? t('billing.subscription.monthly') : t('billing.subscription.annual')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>{t('billing.subscription.daysRemaining')}</span>
                    <span className='font-medium'>{t('billing.subscription.days', { count: getRemainingDays() })}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>{t('billing.subscription.nextBillingDate')}</span>
                    <span className='font-medium'>
                      {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(locale)}
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
                  {t('billing.usage.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-2'>
                    <span className='text-slate-600'>{t('billing.usage.buildings')}</span>
                    <span className='font-medium'>
                      <span className='text-slate-900'>0</span> /{' '}
                      {plans.find(p => p.id === currentSubscription.planId)?.buildingLimit ||
                        t('billing.usage.unlimited')}
                    </span>
                  </div>
                  <Progress value={0} className='h-2' />
                </div>

                <Separator />

                <div className='space-y-2'>
                  <p className='text-sm font-medium flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    {t('billing.usage.includedFeatures')}
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
                {t('billing.subscription.changePlan')}
              </CardTitle>
              <CardDescription>{t('billing.subscription.changePlanDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {plans.map(plan => {
                  const isCurrentPlan = plan.id === currentSubscription.planId;
                  const isPlanUpgrade = canUpgrade(plan.id);
                  const isPlanDowngrade = canDowngrade(plan.id);

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
                            {plan.billingCycle === 'monthly' ? t('billing.subscription.perMonthShort') : t('billing.subscription.perYearShort')}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm text-slate-600 mb-3'>
                          {t('billing.subscription.upToBuildings', { count: plan.buildingLimit })}
                        </p>
                        {isCurrentPlan ? (
                          <Badge variant='secondary' className='w-full justify-center'>
                            {t('billing.subscription.currentPlanBadge')}
                          </Badge>
                        ) : (
                          <Button
                            onClick={() =>
                              isPlanUpgrade ? upgradePlan(plan.id) : downgradePlan(plan.id)
                            }
                            disabled={!!actionLoading}
                            variant={isPlanUpgrade ? 'default' : 'outline'}
                            className='w-full'
                          >
                            {actionLoading === 'upgrade' || actionLoading === 'downgrade'
                              ? t('billing.subscription.processing')
                              : isPlanUpgrade
                                ? t('billing.subscription.upgrade')
                                : t('billing.subscription.downgrade')}
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
                {t('billing.subscription.needHelp')}{' '}
                <a href='#' className='text-slate-900 underline'>
                  {t('billing.subscription.contactSupport')}
                </a>
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='destructive' size='sm'>
                    {t('billing.subscription.cancelTitle')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('billing.subscription.cancelConfirmTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('billing.subscription.cancelConfirmDescription', {
                        date: new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(locale)
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant='outline'>{t('billing.subscription.keepSubscription')}</Button>
                    </DialogClose>
                    <Button
                      variant='destructive'
                      onClick={handleCancelSubscription}
                    >
                      {t('billing.subscription.yesCancel')}
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
            <CardTitle>{t('billing.subscription.noActive')}</CardTitle>
            <CardDescription>{t('billing.subscription.choosePlan')}</CardDescription>
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
                        {plan.billingCycle === 'monthly' ? t('billing.subscription.perMonth') : t('billing.subscription.perYear')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4 flex-grow'>
                    <p className='text-sm text-slate-600'>{t('billing.subscription.upToBuildings', { count: plan.buildingLimit })}</p>
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
                      disabled={!!actionLoading}
                      className='w-full'
                      variant={(plan.tier as string) === 'professional' ? 'default' : 'outline'}
                    >
                      {actionLoading === 'checkout' ? t('billing.subscription.processing') : t('billing.subscription.subscribeNow')}
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
            {t('billing.payment.title')}
          </CardTitle>
          <CardDescription>{t('billing.payment.subtitle')}</CardDescription>
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
                            {t('billing.payment.expires', { month: method.cardExpMonth, year: method.cardExpYear })}
                          </p>
                          {/* Card expiration warning */}
                          {(() => {
                            const now = new Date();
                            const expDate = new Date(method.cardExpYear, method.cardExpMonth - 1);
                            const monthsUntilExpiry = (expDate.getFullYear() - now.getFullYear()) * 12 + (expDate.getMonth() - now.getMonth());
                            if (monthsUntilExpiry <= 2 && monthsUntilExpiry >= 0) {
                              return (
                                <p className='text-sm text-orange-600 flex items-center gap-1 mt-1'>
                                  <AlertCircle className='h-3 w-3' />
                                  Card expiring soon
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {method.isDefault && <Badge variant='secondary'>{t('billing.payment.default')}</Badge>}
                  </div>
                </div>
              ))}
              <Separator className='my-4' />
              <Button
                variant='outline'
                className='w-full'
                onClick={openCustomerPortal}
                disabled={portalLoading}
              >
                <ExternalLink className='h-4 w-4 mr-2' />
                {portalLoading ? 'Opening Portal...' : 'Manage Payment Methods'}
              </Button>
            </div>
          ) : (
            <div className='text-center py-12'>
              <CreditCard className='h-12 w-12 text-slate-300 mx-auto mb-4' />
              <h3 className='font-semibold text-slate-900 mb-2'>{t('billing.payment.noMethods')}</h3>
              <p className='text-sm text-slate-600 mb-4'>
                {t('billing.payment.noMethodsDescription')}
              </p>
              <Button
                variant='outline'
                onClick={openCustomerPortal}
                disabled={portalLoading}
              >
                <ExternalLink className='h-4 w-4 mr-2' />
                {portalLoading ? 'Opening Portal...' : 'Add Payment Method'}
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
            {t('billing.invoices.title')}
          </CardTitle>
          <CardDescription>{t('billing.invoices.subtitle')}</CardDescription>
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
                        {new Date(invoice.invoiceDate).toLocaleDateString(locale)}
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
                          <a href={invoice.pdfUrl} download title={t('billing.invoices.downloadPdf')}>
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
                            title={t('billing.invoices.viewInvoice')}
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
              <h3 className='font-semibold text-slate-900 mb-2'>{t('billing.invoices.noInvoices')}</h3>
              <p className='text-sm text-slate-600'>{t('billing.invoices.noInvoicesDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;
