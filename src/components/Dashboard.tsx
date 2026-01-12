import React from 'react';
import SmartDashboard from './dashboards/SmartDashboard';

/**
 * Dashboard Component
 * 
 * Wrapper component that delegates to SmartDashboard.
 * The original dashboard implementation has been moved to legacy.
 * 
 * @see src/components/dashboards/SmartDashboard.tsx
 * @see src/legacy/components/OriginalDashboard.tsx (legacy implementation)
 */

const Dashboard: React.FC = () => {

  // Use Smart Dashboard for all roles - COMPLETE IMPLEMENTATION
  return <SmartDashboard />;
};

// OriginalDashboard has been moved to src/legacy/components/OriginalDashboard.tsx
// This component is no longer used and is kept in legacy for reference only.
// The implementation (570+ lines) was moved on 2025-01-11.
// Migration: Use SmartDashboard from ./dashboards/SmartDashboard.tsx
// See src/legacy/ARCHIVE_MANIFEST.md for details

export default React.memo(Dashboard);
