import React from 'react';
import { RouteObject } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';

/**
 * Not Found (404) page — rendered by the catch-all `*` route.
 *
 * Fix #4: previously a generic "Something went wrong" page was shown for
 * unknown URLs, which confused users. Now shows a clear "Not Found" message
 * with a Go Home action targeting the correct dashboard based on whether the
 * user is in the customer portal or main app.
 */
export const NotFoundPage = () => {
  const { t } = useIntl();
  const isPortalRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/portal');
  const dashboardUrl = isPortalRoute ? '/portal/dashboard' : '/dashboard';
  return (
    <div
      className='min-h-screen bg-slate-50 flex items-center justify-center'
      role='main'
      data-testid='not-found-page'
    >
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>
          {t('errors.routing.notFoundTitle')}
        </h1>
        <p className='text-slate-600 mb-6'>{t('errors.routing.notFoundMessage')}</p>
        <button
          onClick={() => (window.location.href = dashboardUrl)}
          className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          {t('errors.routing.goHome')}
        </button>
      </div>
    </div>
  );
};

/**
 * Unauthorized page component
 */
export const UnauthorizedPage = () => {
  const { t } = useIntl();
  // Determine correct dashboard based on current path
  const isPortalRoute = window.location.pathname.startsWith('/portal');
  const dashboardUrl = isPortalRoute ? '/portal/dashboard' : '/dashboard';
  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>
          {t('errors.routing.accessDenied')}
        </h1>
        <p className='text-slate-600 mb-6'>{t('errors.routing.accessDeniedMessage')}</p>
        <button
          onClick={() => (window.location.href = dashboardUrl)}
          className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          {t('common.goToDashboard')}
        </button>
      </div>
    </div>
  );
};

/**
 * No branch page component
 */
export const NoBranchPage = () => {
  const { t } = useIntl();
  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>
          {t('errors.routing.noBranchAssigned')}
        </h1>
        <p className='text-slate-600 mb-6'>{t('errors.routing.noBranchMessage')}</p>
        <button
          onClick={() => (window.location.href = '/login')}
          className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          {t('errors.routing.backToLogin')}
        </button>
      </div>
    </div>
  );
};

/**
 * Error routes
 */
export const errorRoutes: RouteObject[] = [
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
    element: <NotFoundPage />,
  },
];
