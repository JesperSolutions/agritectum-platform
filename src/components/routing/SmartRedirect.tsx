import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Smart redirect component that sends users to the appropriate dashboard
 * - Not logged in -> Landing page with portal chooser
 * - Customers -> /portal/dashboard
 * - Internal users -> /dashboard
 */
const SmartRedirect: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to='/welcome' replace />;
  }

  if (currentUser.role === 'customer' || currentUser.userType === 'customer') {
    return <Navigate to='/portal/dashboard' replace />;
  }

  return <Navigate to='/dashboard' replace />;
};

export default SmartRedirect;
