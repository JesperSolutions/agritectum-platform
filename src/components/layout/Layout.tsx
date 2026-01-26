import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { usePageState, useBranchContext } from '../../hooks/usePageState';
import Breadcrumb from '../navigation/Breadcrumb';
import NavigationMenu, { NavigationItem } from './NavigationMenu';
import { LogOut, WifiOff, FolderSync as Sync, Menu, X } from 'lucide-react';
import OfflineIndicator from '../OfflineIndicator';
import NotificationCenter from '../NotificationCenter';
import AgritectumLogo from '../AgritectumLogo';

const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { state } = useReports();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);
  const { t } = useIntl();

  // Redirect customer users to portal
  useEffect(() => {
    if (currentUser && (currentUser.role === 'customer' || currentUser.userType === 'customer')) {
      navigate('/portal/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Initialize page state persistence
  usePageState({ persistBranch: true, persistFilters: true });
  useBranchContext(currentUser?.branchId);

  // Fetch branch information
  useEffect(() => {
    const fetchBranchInfo = async () => {
      if (currentUser?.branchId) {
        try {
          const { getBranchById } = await import('../../services/branchService');
          const branch = await getBranchById(currentUser.branchId);
          if (branch) {
            setBranchInfo({
              name: branch.name,
              logoUrl: branch.logoUrl,
            });
          }
        } catch (error) {
          console.warn('Could not load branch information:', error);
        }
      }
    };

    fetchBranchInfo();
  }, [currentUser?.branchId]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Logout error handled by error display
    }
  };

  // Build navigation menu structure based on user role
  const navigationItems = useMemo((): NavigationItem[] => {
    if (!currentUser) return [];

    const role = currentUser.role;
    const items: NavigationItem[] = [];

    // Dashboard (always first, standalone)
    items.push({
      label: t('navigation.dashboard'),
      path: '/dashboard',
    });

    // Reports section - Data Entry & Reports
    const reportsChildren: NavigationItem[] = [
      {
        label: t('navigation.newTagReport'),
        path: '/report/new',
        roles: ['inspector', 'branchAdmin', 'superadmin'],
      },
    ];

    if (role === 'inspector') {
      reportsChildren.push({
        label: t('navigation.myTagReports'),
        path: '/reports',
      });
    } else if (role === 'branchAdmin' || role === 'superadmin') {
      reportsChildren.push({
        label: t('navigation.allTagReports'),
        path: '/admin/reports',
      });
    }

    if (role === 'branchAdmin' || role === 'superadmin') {
      reportsChildren.push(
        {
          label: t('navigation.newESGReport'),
          path: '/admin/esg-service',
        },
        {
          label: t('navigation.allESGReports'),
          path: '/admin/esg-reports',
        }
      );
    }

    if (reportsChildren.length > 0) {
      items.push({
        label: t('navigation.reports'),
        children: reportsChildren.filter(child => !child.roles || child.roles.includes(role)),
      });
    }

    // Operations section - Day-to-day operational tasks
    const operationsChildren: NavigationItem[] = [
      {
        label: t('navigation.schedule'),
        path: '/schedule',
        roles: ['inspector', 'branchAdmin', 'superadmin'],
      },
      {
        label: t('navigation.customers'),
        path: '/admin/customers',
        roles: ['inspector', 'branchAdmin', 'superadmin'],
      },
      {
        label: t('navigation.offers'),
        path: '/offers',
        roles: ['inspector', 'branchAdmin', 'superadmin'],
      },
    ];

    if (role === 'branchAdmin' || role === 'superadmin') {
      operationsChildren.push({
        label: t('navigation.serviceAgreements'),
        path: '/admin/service-agreements',
      });
    }

    items.push({
      label: t('navigation.operations'),
      children: operationsChildren.filter(child => !child.roles || child.roles.includes(role)),
    });

    // Administration section (for branchAdmin and superadmin)
    if (role === 'branchAdmin' || role === 'superadmin') {
      const adminChildren: NavigationItem[] = [
        {
          label: t('navigation.users'),
          path: '/admin/users',
        },
        {
          label: t('navigation.analytics'),
          path: '/admin/analytics',
        },
      ];

      if (role === 'superadmin') {
        adminChildren.splice(1, 0, {
          label: t('navigation.branches'),
          path: '/admin/branches',
        });
        adminChildren.push({
          label: t('navigation.emailTemplates'),
          path: '/admin/email-templates',
        });
      }

      items.push({
        label: t('navigation.admin'),
        children: adminChildren,
      });
    }

    // Settings section - User settings
    const settingsChildren: NavigationItem[] = [
      {
        label: t('navigation.profile'),
        path: '/profile',
      },
    ];

    // Add QA Testing in development mode for superadmin
    if (process.env.NODE_ENV === 'development' && role === 'superadmin') {
      settingsChildren.push({
        label: t('navigation.qa'),
        path: '/admin/qa',
      });
    }

    items.push({
      label: t('navigation.settings'),
      children: settingsChildren,
    });

    return items;
  }, [currentUser, t]);

  const SyncIndicator = () => {
    if (state.syncInProgress) {
      return (
        <div className='flex items-center space-x-2 text-blue-600'>
          <Sync className='w-4 h-4 animate-spin' />
          <span className='text-sm'>Syncing...</span>
        </div>
      );
    }

    if (state.isOffline) {
      return (
        <div className='flex items-center space-x-2 text-orange-600'>
          <WifiOff className='w-4 h-4' />
          <span className='text-sm'>{t('common.offline')}</span>
          {state.offlineReports.length > 0 && (
            <span className='bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>
              {state.offlineReports.length} pending
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-material'>
      {/* Material Design Mobile Header */}
      <div className='lg:hidden bg-white shadow-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between'>
        <Link to='/dashboard'>
          <AgritectumLogo size='sm' />
        </Link>

        <div className='flex items-center space-x-2'>
          <NotificationCenter />
          <SyncIndicator />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='p-2 rounded-lg hover:bg-slate-100'
          >
            {isMobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className='lg:hidden bg-white border-b border-slate-200'>
          <nav className='px-4 py-2'>
            <NavigationMenu
              items={navigationItems}
              currentUserRole={currentUser?.role || ''}
              isMobile={true}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
            <button
              onClick={handleLogout}
              className='flex items-center space-x-3 px-3 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full font-medium hover:text-slate-900 mt-2'
            >
              <LogOut className='w-5 h-5' />
              <span>{t('common.signOut')}</span>
            </button>
          </nav>
        </div>
      )}

      <div className='lg:flex'>
        {/* Material Design Desktop Sidebar with Elevation */}
        <div className='hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-sm border-r border-slate-200'>
          <div className='flex flex-col flex-grow pt-5 overflow-y-auto'>
            {/* Logo and Branch Info */}
            <div className='flex items-center flex-shrink-0 px-6 mb-6'>
              <Link to='/dashboard' className='flex items-center gap-3 w-full'>
                <AgritectumLogo size='sm' />
                {branchInfo?.name && (
                  <div className='flex-1 min-w-0'>
                    <div className='text-xs text-slate-500 truncate leading-tight'>
                      {branchInfo.name}
                    </div>
                  </div>
                )}
              </Link>
            </div>

            {/* User info */}
            <div className='px-6 mb-6'>
              <div className='text-xs text-slate-500'>{t('common.signedInAs')}</div>
              <div
                className='text-xs font-medium text-slate-900 truncate'
                title={currentUser?.email}
              >
                {currentUser?.email}
              </div>
              <div className='text-xs text-slate-600 capitalize'>
                {currentUser?.role === 'branchAdmin'
                  ? t('dashboard.roles.branchAdmin')
                  : currentUser?.role === 'inspector'
                    ? t('dashboard.roles.inspector')
                    : currentUser?.role === 'superadmin'
                      ? t('dashboard.roles.superadmin')
                      : currentUser?.role || 'User'}
              </div>
            </div>

            {/* Navigation */}
            <nav className='flex-1 px-4'>
              <NavigationMenu
                items={navigationItems}
                currentUserRole={currentUser?.role || ''}
                isMobile={false}
              />
            </nav>

            {/* Footer */}
            <div className='flex-shrink-0 px-4 py-4 border-t border-slate-200'>
              {/* Status Indicators Section */}
              <div className='mb-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200'>
                <div className='flex items-center justify-between space-x-2'>
                  <SyncIndicator />
                  <NotificationCenter />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className='flex items-center space-x-3 px-3 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full font-medium hover:text-slate-900'
              >
                <LogOut className='w-5 h-5' />
                <span>{t('common.signOut')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className='lg:pl-64 flex flex-col flex-1'>
          <main className='flex-1'>
            <div className='py-6'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                {/* Breadcrumb Navigation */}
                <div className='mb-6'>
                  <Breadcrumb />
                </div>

                {/* Page Content */}
                <Outlet />
              </div>
            </div>
          </main>
        </div>

        {/* Offline Indicator */}
        <OfflineIndicator />
      </div>
    </div>
  );
};

export default Layout;
