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
  LazyScheduledVisitsList,
  LazyCustomerProfile,
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
        path: 'service-agreements',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyServiceAgreementsList />
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
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyCustomerProfile />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
];
