/**
 * Role Guard Higher-Order Component
 *
 * Prevents UI flicker on route load by checking permissions before rendering.
 * Works in conjunction with ProtectedRoute but provides earlier access control.
 */

import React, { ComponentType } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Navigate } from 'react-router-dom';

interface WithRoleGuardOptions {
  allowedRoles?: UserRole[];
  requiredBranch?: boolean;
  redirectTo?: string;
}

/**
 * Higher-order component that guards routes based on user role
 */
export const withRoleGuard = <P extends object>(
  Component: ComponentType<P>,
  options: WithRoleGuardOptions = {}
) => {
  const { allowedRoles, requiredBranch = false, redirectTo = '/unauthorized' } = options;

  const GuardedComponent: React.FC<P> = props => {
    const { currentUser, loading } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
      return (
        <div className='min-h-screen flex items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
      return <Navigate to='/login' replace />;
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      // Superadmin with permission level 2 can access everything
      if (currentUser.role === 'superadmin' && currentUser.permissionLevel >= 2) {
        // Allow access
      } else {
        return <Navigate to={redirectTo} replace />;
      }
    }

    // Check branch requirement
    if (requiredBranch && !currentUser.branchId && currentUser.role !== 'superadmin') {
      return <Navigate to='/no-branch' replace />;
    }

    // Render component if all checks pass
    return <Component {...props} />;
  };

  GuardedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name || 'Component'})`;

  return GuardedComponent;
};
