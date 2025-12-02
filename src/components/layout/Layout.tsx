import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { usePageState, useBranchContext } from '../../hooks/usePageState';
import Breadcrumb from '../navigation/Breadcrumb';
import QuickActions from '../navigation/QuickActions';
import {
  Home,
  FileText,
  LogOut,
  Users,
  Building,
  WifiOff,
  FolderSync as Sync,
  Menu,
  X,
  BarChart3,
  TestTube,
  Calendar,
  Mail,
  User,
  FileCheck,
} from 'lucide-react';
import OfflineIndicator from '../OfflineIndicator';
import NotificationCenter from '../NotificationCenter';
import AgritectumLogo from '../AgritectumLogo';
import { BRAND_CONFIG } from '../../config/brand';

const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { state } = useReports();
  const { t } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);

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

  // Check if a route is currently active
  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      label: t('navigation.dashboard'),
      icon: Home,
      path: '/dashboard',
      roles: ['inspector', 'branchAdmin', 'superadmin'],
    },
    {
      label: t('navigation.profile'),
      icon: User,
      path: '/profile',
      roles: ['inspector', 'branchAdmin', 'superadmin'],
    },
    {
      label: t('reports.new'),
      icon: FileText,
      path: '/report/new',
      roles: ['inspector', 'branchAdmin'],
    },
    {
      label: t('navigation.myReports'),
      icon: FileText,
      path: '/reports',
      roles: ['inspector'],
    },
    {
      label: t('navigation.branches'),
      icon: Building,
      path: '/admin/branches',
      roles: ['superadmin'],
    },
    {
      label: t('navigation.users'),
      icon: Users,
      path: '/admin/users',
      roles: ['superadmin', 'branchAdmin'],
    },
    {
      label: t('navigation.analytics'),
      icon: BarChart3,
      path: '/admin/analytics',
      roles: ['superadmin', 'branchAdmin'],
    },
    {
      label: t('navigation.customers'),
      icon: Users,
      path: '/admin/customers',
      roles: ['superadmin', 'branchAdmin', 'inspector'],
    },
    {
      label: t('navigation.serviceAgreements'),
      icon: FileCheck,
      path: '/admin/service-agreements',
      roles: ['superadmin', 'branchAdmin'],
    },
    // Temporarily disabled - hiding until needed
    // {
    //   label: t('navigation.schedule'),
    //   icon: Calendar,
    //   path: '/schedule',
    //   roles: ['superadmin', 'branchAdmin', 'inspector'],
    // },
    // Temporarily disabled - restructuring flow
    // {
    //   label: t('navigation.offers'),
    //   icon: DollarSign,
    //   path: '/offers',
    //   roles: ['inspector', 'branchAdmin', 'superadmin'],
    // },
    {
      label: 'Email Templates',
      icon: Mail,
      path: '/admin/email-templates',
      roles: ['superadmin'],
    },
    {
      label: t('navigation.reports'),
      icon: FileText,
      path: '/admin/reports',
      roles: ['superadmin', 'branchAdmin'],
    },
    ...(process.env.NODE_ENV === 'development'
      ? [
          {
            label: t('navigation.qa'),
            icon: TestTube,
            path: '/admin/qa',
            roles: ['superadmin'],
          },
        ]
      : []),
  ];

  const filteredNavigation = navigationItems.filter(item => {
    if (!currentUser) return false;

    // Check if user role is in allowed roles
    if (!item.roles.includes(currentUser.role)) return false;

    // Additional permission checks for specific routes
    if (item.path === '/admin/qa' && currentUser.role !== 'superadmin') return false;
    if (item.path === '/admin/branches' && currentUser.role !== 'superadmin') return false;

    return true;
  });

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
          <span className='text-sm'>Offline</span>
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
          <AgritectumLogo size="sm" />
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
            {filteredNavigation.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                  isActiveRoute(item.path)
                    ? 'bg-slate-200 text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActiveRoute(item.path) ? 'text-slate-900' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className='flex items-center space-x-3 px-3 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full font-medium hover:text-slate-900'
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
                <div className='flex-shrink-0'>
                  <div className='bg-white rounded-xl p-2 border border-slate-200 shadow-sm'>
                    <AgritectumLogo size="md" showText={false} />
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='text-lg font-bold text-slate-900 leading-tight'>{BRAND_CONFIG.BRAND_NAME.toUpperCase()}</div>
                  <div className='text-xs text-slate-500 truncate leading-tight'>{branchInfo?.name || t('common.buildingPerformance') || 'Building Performance Platform'}</div>
                </div>
              </Link>
            </div>

            {/* User info */}
            <div className='px-6 mb-6'>
              <div className='text-xs text-slate-500'>Signed in as</div>
              <div className='text-xs font-medium text-slate-900 truncate' title={currentUser?.email}>
                {currentUser?.email}
              </div>
              <div className='text-xs text-slate-600 capitalize'>
                {currentUser?.role === 'branchAdmin'
                  ? t('dashboard.roles.branchAdmin')
                  : currentUser?.role === 'inspector'
                    ? 'Inspector'
                    : currentUser?.role === 'superadmin'
                      ? 'Super Admin'
                      : currentUser?.role || 'User'}
              </div>
            </div>

            {/* Navigation */}
            <nav className='flex-1 px-4 space-y-1'>
              {filteredNavigation.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActiveRoute(item.path)
                      ? 'bg-slate-200 text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActiveRoute(item.path) ? 'text-slate-900' : 'text-slate-600'}`} />
                  <span className='truncate'>{item.label}</span>
                </Link>
              ))}
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

        {/* Quick Actions FAB - Context-aware actions */}
        <QuickActions 
          context={
            location.pathname.startsWith('/report/view') ? 'report' :
            location.pathname.startsWith('/reports') ? 'reports' :
            location.pathname.startsWith('/offers') ? 'offers' :
            location.pathname.startsWith('/customers') ? 'customer' :
            'dashboard'
          }
          reportId={location.pathname.includes('/report/view/') ? location.pathname.split('/').pop() : undefined}
        />

        {/* Offline Indicator */}
        <OfflineIndicator />
      </div>
    </div>
  );
};

export default Layout;
