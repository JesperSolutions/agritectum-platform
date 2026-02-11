import React, { Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import { RouteErrorBoundary } from '../error-boundaries/RouteErrorBoundary';
import {
  LazyPortalLayout,
  LazyPortalDashboard,
  LazyBuildingsList,
  LazyBuildingDetail,
  LazyServiceAgreementsList,
  LazyPortalServiceAgreementDetail,
  LazyScheduledVisitsList,
  LazyAcceptAppointmentView,
  LazyPortalCustomerProfile,
  LazyReportView,
  LazyESGOverview,
  LazyPricingTable,
  LazyBillingDashboard,
  LazyPortfolioDashboard,
  LazyBuildingComparisonTool,
  LoadingFallback,
} from '../../components/LazyComponents';

/**
 * Portal routes - customer portal
 */
export const portalRoutes: RouteObject[] = [
  {
    path: '/portal',
    element: (
      <ProtectedRoute allowedRoles={['customer']}>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPortalLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to='/portal/dashboard' replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPortalDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'esg-overview',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyESGOverview />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'buildings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyBuildingsList />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'buildings/:buildingId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyBuildingDetail />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'reports/:reportId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyReportView />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'service-agreements',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyServiceAgreementsList />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'service-agreements/:agreementId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPortalServiceAgreementDetail />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'scheduled-visits',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyScheduledVisitsList />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'appointment/:visitId/respond',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyAcceptAppointmentView />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPortalCustomerProfile />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'pricing',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPricingTable />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'billing',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyBillingDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'portfolio',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPortfolioDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'compare',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyBuildingComparisonTool />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
];
