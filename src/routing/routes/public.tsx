import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { RouteErrorBoundary } from '../error-boundaries/RouteErrorBoundary';
import {
  LazyPublicOfferView,
  LazyOfferThankYou,
  LazyPublicServiceAgreementView,
  LazyPublicESGReportView,
  LoadingFallback,
} from '../../components/LazyComponents';
import PublicReportView from '../../components/reports/PublicReportView';
import UnsubscribePage from '../../components/UnsubscribePage';
import PrivacyPolicy from '../../components/legal/PrivacyPolicy';
import TermsOfService from '../../components/legal/TermsOfService';
import CustomerSignup from '../../components/portal/CustomerSignup';

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes: RouteObject[] = [
  {
    path: '/report/public/:reportId',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PublicReportView />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/unsubscribe',
    element: <UnsubscribePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/offer/public/:offerId',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPublicOfferView />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/service-agreement/public/:token',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPublicServiceAgreementView />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/esg-report/public/:reportId',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPublicESGReportView />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/offer/thank-you',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyOfferThankYou />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfService />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/portal/signup/:token',
    element: (
      <ErrorBoundary>
        <CustomerSignup />
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
];
