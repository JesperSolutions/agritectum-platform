import React, { Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import Layout from '../../components/layout/Layout';
import { RouteErrorBoundary } from '../error-boundaries/RouteErrorBoundary';
import EnhancedErrorBoundary from '../../components/common/EnhancedErrorBoundary';
import {
  LazyDashboard,
  LazyReportForm,
  LazyReportView,
  LazyBranchManagement,
  LazyUserManagement,
  LazyAnalyticsDashboard,
  LazyAllReports,
  LazyCustomerManagement,
  LazyCustomerProfile,
  LazyQATestingPage,
  LazySchedulePage,
  LazyEmailTemplateViewer,
  LazyOffersPage,
  LazyUserProfile,
  LazyServiceAgreements,
  LazyBuildingESGImprovements,
  LazyESGService,
  LoadingFallback,
} from '../../components/LazyComponents';
import AdminTestingPage from '../../components/admin/AdminTestingPage';

/**
 * Main application routes - protected routes for authenticated users
 */
export const mainRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to='/dashboard' replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyDashboard />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LazyUserProfile />
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'report/new',
        element: (
          <ProtectedRoute allowedRoles={['inspector', 'branchAdmin']} requiredBranch>
            <Suspense fallback={<LoadingFallback />}>
              <LazyReportForm mode='create' />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'report/edit/:reportId',
        element: (
          <ProtectedRoute allowedRoles={['inspector', 'branchAdmin']} requiredBranch>
            <Suspense fallback={<LoadingFallback />}>
              <LazyReportForm mode='edit' />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'report/view/:reportId',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin', 'inspector']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyReportView />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/branches',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyBranchManagement />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyUserManagement />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/analytics',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <EnhancedErrorBoundary context='Analytics Dashboard'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyAnalyticsDashboard />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/reports',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyAllReports />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/customers',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin', 'inspector']}>
            <EnhancedErrorBoundary context='Customer Management'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyCustomerManagement />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/customers/:customerId',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <EnhancedErrorBoundary context='Customer Profile'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyCustomerProfile />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/service-agreements',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <EnhancedErrorBoundary context='Service Agreements'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyServiceAgreements />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/building-esg-improvements',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <EnhancedErrorBoundary context='Building ESG Improvements'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyBuildingESGImprovements />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/esg-service',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <EnhancedErrorBoundary context='ESG Service'>
              <Suspense fallback={<LoadingFallback />}>
                <LazyESGService />
              </Suspense>
            </EnhancedErrorBoundary>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'schedule',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin', 'inspector']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazySchedulePage />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['inspector', 'branchAdmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyAllReports />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'offers',
        element: (
          <ProtectedRoute allowedRoles={['inspector', 'branchAdmin', 'superadmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyOffersPage />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/email-templates',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyEmailTemplateViewer />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/qa',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyQATestingPage />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'admin/testing',
        element: (
          <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
            <AdminTestingPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
];
