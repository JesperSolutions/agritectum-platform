import React, { Suspense, useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { publicRoutes } from './routes/public';
import { getAuthRoutes } from './routes/auth';
import { portalRoutes } from './routes/portal';
import { mainRoutes } from './routes/main';
import { errorRoutes } from './routes/error';

/**
 * Main router component
 * Combines all route modules into a single router configuration
 */
const AppRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Memoize router to prevent recreation on every render
  const router = useMemo(
    () =>
      createBrowserRouter([
        ...publicRoutes,
        ...getAuthRoutes(currentUser),
        ...portalRoutes,
        ...mainRoutes,
        ...errorRoutes,
      ]),
    [currentUser]
  );

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default AppRouter;
