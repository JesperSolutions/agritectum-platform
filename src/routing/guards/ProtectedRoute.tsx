import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredBranch?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredBranch = false,
}) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    // Redirect to portal login if accessing portal routes, otherwise internal login
    const isPortalRoute = window.location.pathname.startsWith('/portal');
    return <Navigate to={isPortalRoute ? '/portal/login' : '/login'} replace />;
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Also check permission level for superadmin access
    if (currentUser.role === 'superadmin' && currentUser.permissionLevel >= 2) {
      // Super admin with permission level 2 can access everything
    } else {
      return <Navigate to='/unauthorized' replace />;
    }
  }

  // Check branch requirement - but only for routes that explicitly require it
  // Branch admins and inspectors need a branch, but don't block dashboard access
  if (requiredBranch && !currentUser.branchId && currentUser.role !== 'superadmin') {
    return <Navigate to='/no-branch' replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
