import React, { Suspense, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useIntl } from './hooks/useIntl';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginForm from './components/forms/LoginForm';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import EnhancedErrorBoundary from './components/common/EnhancedErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import {
  LazyDashboard,
  LazyReportForm,
  LazyReportView,
  LazyBranchManagement,
  LazyUserManagement,
  LazyAnalyticsDashboard,
  LazyAllReports,
  LazyCustomerManagement,
  LazyQATestingPage,
  LazySchedulePage,
  LazyEmailTemplateViewer,
  LazyOffersPage,
  LazyPublicOfferView,
  LazyUserProfile,
  LoadingFallback,
  LazyOfferThankYou,
  LazyServiceAgreements,
  LazyPublicServiceAgreementView,
  LazyCustomerRegistration,
  LazyCustomerDashboard,
} from './components/LazyComponents';
import PublicReportView from './components/reports/PublicReportView';
import AdminTestingPage from './components/admin/AdminTestingPage';
import UnsubscribePage from './components/UnsubscribePage';
// import OptimizedDashboard from './components/OptimizedDashboard';

// Error boundary component
const ErrorPage = () => {
  const { t } = useIntl();
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>{t('common.somethingWentWrong')}</h1>
        <p className='text-gray-600 mb-6'>{t('common.somethingUnexpectedHappened')}</p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
        >
          {t('common.goToDashboard')}
        </button>
      </div>
    </div>
  );
};

const UnauthorizedPage = () => {
  const { t } = useIntl();
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h1>
        <p className='text-gray-600 mb-6'>You don't have permission to access this resource.</p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
        >
          {t('common.goToDashboard')}
        </button>
      </div>
    </div>
  );
};

const NoBranchPage = () => (
  <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
    <div className='bg-white p-8 rounded-lg shadow-md text-center'>
      <h1 className='text-2xl font-bold text-gray-900 mb-4'>No Branch Assigned</h1>
      <p className='text-gray-600 mb-6'>
        You haven't been assigned to a branch yet. Please contact your administrator.
      </p>
      <button
        onClick={() => (window.location.href = '/login')}
        className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
      >
        Back to Login
      </button>
    </div>
  </div>
);

// Placeholder components for admin routes with lazy loading and error boundaries
const BranchesAdmin = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyBranchManagement />
  </Suspense>
);

const UsersAdmin = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyUserManagement />
  </Suspense>
);

const Analytics = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAnalyticsDashboard />
  </Suspense>
);

const ReportsAdmin = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAllReports />
  </Suspense>
);

const CustomersAdmin = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyCustomerManagement />
  </Suspense>
);

const QA = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyQATestingPage />
  </Suspense>
);

const EmailTemplates = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyEmailTemplateViewer />
  </Suspense>
);

const AppRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Memoize router to prevent recreation on every render
  const router = useMemo(() => createBrowserRouter([
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
      path: '/register',
      element: currentUser ? <Navigate to='/dashboard' replace /> : (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <LazyCustomerRegistration />
          </Suspense>
        </ErrorBoundary>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/login',
      element: currentUser ? <Navigate to='/dashboard' replace /> : <LoginForm />,
    },
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
        // Customer routes
        {
          path: 'customer/dashboard',
          element: (
            <ProtectedRoute allowedRoles={['customer']}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyCustomerDashboard />
              </Suspense>
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'customer/buildings',
          element: (
            <ProtectedRoute allowedRoles={['customer']}>
              <Suspense fallback={<LoadingFallback />}>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Your Buildings</h1>
                  <p className="text-gray-600">Building management coming soon...</p>
                </div>
              </Suspense>
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'customer/offers',
          element: (
            <ProtectedRoute allowedRoles={['customer']}>
              <Suspense fallback={<LoadingFallback />}>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Your Offers</h1>
                  <p className="text-gray-600">Offers management coming soon...</p>
                </div>
              </Suspense>
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'customer/agreements',
          element: (
            <ProtectedRoute allowedRoles={['customer']}>
              <Suspense fallback={<LoadingFallback />}>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Your Service Agreements</h1>
                  <p className="text-gray-600">Service agreements management coming soon...</p>
                </div>
              </Suspense>
            </ProtectedRoute>
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
              <BranchesAdmin />
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'admin/users',
          element: (
            <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
              <UsersAdmin />
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'admin/analytics',
          element: (
            <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
              <EnhancedErrorBoundary context='Analytics Dashboard'>
                <Analytics />
              </EnhancedErrorBoundary>
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/reports',
          element: (
            <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
              <ReportsAdmin />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/customers',
          element: (
            <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin', 'inspector']}>
              <EnhancedErrorBoundary context='Customer Management'>
                <CustomersAdmin />
              </EnhancedErrorBoundary>
            </ProtectedRoute>
          ),
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
              <EmailTemplates />
            </ProtectedRoute>
          ),
          errorElement: <RouteErrorBoundary />,
        },
        // QA Testing page - available for super admins
        {
          path: 'admin/qa',
          element: (
            <ProtectedRoute allowedRoles={['superadmin']}>
              <QA />
            </ProtectedRoute>
          ),
        },
        // Admin Testing page - available for admins
        {
          path: 'admin/testing',
          element: (
            <ProtectedRoute allowedRoles={['superadmin', 'branchAdmin']}>
              <AdminTestingPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: '/unauthorized',
      element: <UnauthorizedPage />,
    },
    {
      path: '/no-branch',
      element: <NoBranchPage />,
    },
    {
      path: '*',
      element: <ErrorPage />,
    },
  ]), [currentUser]); // Only recreate if currentUser changes

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default AppRouter;
