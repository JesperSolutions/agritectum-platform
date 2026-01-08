import React, { Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { RouteErrorBoundary } from '../error-boundaries/RouteErrorBoundary';
import LoginForm from '../../components/forms/LoginForm';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm';
import ResetPasswordForm from '../../components/forms/ResetPasswordForm';
import {
  LazyPortalLogin,
  LazyPortalRegister,
  LoadingFallback,
} from '../../components/LazyComponents';

/**
 * Authentication routes - login, password reset, etc.
 */
export const getAuthRoutes = (currentUser: any): RouteObject[] => [
  {
    path: '/login',
    element: currentUser 
      ? (currentUser.role === 'customer' || currentUser.userType === 'customer' 
        ? <Navigate to='/portal/dashboard' replace /> 
        : <Navigate to='/dashboard' replace />)
      : <LoginForm />,
  },
  {
    path: '/forgot-password',
    element: currentUser 
      ? (currentUser.role === 'customer' || currentUser.userType === 'customer' 
        ? <Navigate to='/portal/dashboard' replace /> 
        : <Navigate to='/dashboard' replace />)
      : <ForgotPasswordForm />,
  },
  {
    path: '/reset-password',
    element: currentUser 
      ? (currentUser.role === 'customer' || currentUser.userType === 'customer' 
        ? <Navigate to='/portal/dashboard' replace /> 
        : <Navigate to='/dashboard' replace />)
      : <ResetPasswordForm />,
  },
  {
    path: '/portal/login',
    element: currentUser?.userType === 'customer' ? <Navigate to='/portal/dashboard' replace /> : (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPortalLogin />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/portal/register',
    element: currentUser?.userType === 'customer' ? <Navigate to='/portal/dashboard' replace /> : (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LazyPortalRegister />
        </Suspense>
      </ErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary />,
  },
];
