import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useIntl();

  let title = t('common.somethingWentWrong');
  let detail = t('common.somethingUnexpectedHappened');
  let isChunkError = false;

  if (isRouteErrorResponse(error)) {
    title = t('errors.network.title') || `Error ${error.status}`;
    detail = error.statusText || detail;
  } else if (error instanceof Error) {
    // Check if it's a chunk loading error
    isChunkError = /loading chunk|chunk load|Failed to fetch dynamically imported module/i.test(
      error.message
    );

    if (isChunkError) {
      title = t('errors.app.updateRequired') || 'Application update required';
      detail = t('errors.app.updateRequiredMessage') || 'A new version is available. Please reload the page to continue.';
    } else {
      title = t('common.somethingWentWrong');
      detail = error.message || detail;
    }
  }

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <div className='text-center'>
            <AlertTriangle className='mx-auto h-12 w-12 text-red-500' />
            <h1 className='mt-4 text-2xl font-bold text-gray-900'>{title}</h1>
            <p className='mt-2 text-sm text-gray-600'>{detail}</p>

            <div className='mt-6 space-y-3'>
              <button
                onClick={handleReload}
                className='w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                {isChunkError ? (t('errors.app.updateApplication') || 'Update application') : (t('common.buttons.refresh') || 'Reload page')}
              </button>

              <button
                onClick={handleGoHome}
                className='w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                <Home className='w-4 h-4 mr-2' />
                {t('common.goToDashboard')}
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className='mt-6 text-left'>
                <summary className='text-sm text-gray-500 cursor-pointer'>
                  {t('errors.technicalDetails') || 'Technical details (development only)'}
                </summary>
                <pre className='mt-2 text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-auto'>
                  {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
