import React from 'react';
import { RouteObject } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';

/**
 * Error page component
 */
const ErrorPage = () => {
  const { t } = useIntl();
  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>{t('common.somethingWentWrong')}</h1>
        <p className='text-slate-600 mb-6'>{t('common.somethingUnexpectedHappened')}</p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          {t('common.goToDashboard')}
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
  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md text-center'>
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>{t('errors.routing.accessDenied')}</h1>
        <p className='text-slate-600 mb-6'>{t('errors.routing.accessDeniedMessage')}</p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
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
        <h1 className='text-2xl font-bold text-slate-900 mb-4'>{t('errors.routing.noBranchAssigned')}</h1>
        <p className='text-slate-600 mb-6'>
          {t('errors.routing.noBranchMessage')}
        </p>
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
    element: <ErrorPage />,
  },
];
