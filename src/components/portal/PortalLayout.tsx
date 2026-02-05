import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import { SkipLink } from '../common/AccessibilityComponents';
import Breadcrumb from '../navigation/Breadcrumb';
import { Home, LogOut, Building, FileCheck, Calendar, User, Menu, X, Leaf, CreditCard } from 'lucide-react';
import AgritectumLogo from '../AgritectumLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { StripeProvider } from '../../contexts/StripeContext';
import GDPRConsentFlow from '../legal/GDPRConsentFlow';

const PortalLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useIntl();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/portal/login');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/portal/dashboard') {
      return location.pathname === '/portal/dashboard' || location.pathname === '/portal';
    }
    return location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      label: t('navigation.dashboard'),
      icon: Home,
      path: '/portal/dashboard',
    },
    {
      label: 'ESG Overview',
      icon: Leaf,
      path: '/portal/esg-overview',
    },
    {
      label: t('navigation.buildings'),
      icon: Building,
      path: '/portal/buildings',
    },
    {
      label: t('navigation.serviceAgreements'),
      icon: FileCheck,
      path: '/portal/service-agreements',
    },
    {
      label: t('navigation.scheduledVisits'),
      icon: Calendar,
      path: '/portal/scheduled-visits',
    },
    {
      label: 'Billing',
      icon: CreditCard,
      path: '/portal/billing',
    },
    {
      label: t('navigation.profile'),
      icon: User,
      path: '/portal/profile',
    },
  ];

  return (
    <StripeProvider>
      <div className='min-h-screen bg-slate-50'>
      {/* Skip link for keyboard navigation */}
      <SkipLink targetId='main-content' />
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-40 lg:hidden'>
          <div
            className='fixed inset-0 bg-slate-600 bg-opacity-75'
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className='fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl z-50'>
            <div className='flex flex-col flex-grow pt-5 overflow-y-auto'>
              {/* Logo */}
              <div className='flex items-center flex-shrink-0 px-6 mb-6'>
                <Link
                  to='/portal/dashboard'
                  className='flex items-center gap-3 w-full'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <AgritectumLogo size='sm' />
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
                  {t('common.roles.customer')}
                </div>
              </div>

              {/* Navigation */}
              <nav className='flex-1 px-4 space-y-1' aria-label='Mobile navigation'>
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-200 text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-600'}`}
                      />
                      <span className='truncate'>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className='flex items-center space-x-3 px-3 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full font-medium hover:text-slate-900'
                >
                  <LogOut className='w-5 h-5' />
                  <span>{t('common.signOut') || 'Logout'}</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className='lg:flex'>
        {/* Material Design Desktop Sidebar with Elevation */}
        <div className='hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-sm border-r border-slate-200'>
          <div className='flex flex-col flex-grow pt-5 overflow-y-auto'>
            {/* Logo and Brand Info */}
            <div className='flex items-center flex-shrink-0 px-6 mb-6'>
              <Link to='/portal/dashboard' className='flex items-center gap-3 w-full'>
                <AgritectumLogo size='sm' />
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
              <div className='text-xs text-slate-600 capitalize'>{t('common.roles.customer')}</div>
            </div>

            {/* Navigation */}
            <nav className='flex-1 px-4 space-y-1' aria-label='Main navigation'>
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-slate-200 text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-600'}`}
                    />
                    <span className='truncate'>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className='flex-shrink-0 px-4 py-4 border-t border-slate-200'>
              <button
                onClick={handleLogout}
                aria-label={t('common.signOut') || 'Sign out of your account'}
                className='flex items-center space-x-3 px-3 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full font-medium hover:text-slate-900'
              >
                <LogOut className='w-5 h-5' aria-hidden='true' />
                <span>{t('common.signOut') || 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className='lg:pl-64 flex flex-col flex-1'>
          {/* Mobile header */}
          <header className='lg:hidden bg-white shadow-sm border-b border-slate-200'>
            <div className='flex items-center justify-between px-4 h-16'>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className='p-2 rounded-md text-slate-700 hover:bg-slate-100'
                aria-label='Open navigation menu'
                aria-expanded={isMobileMenuOpen}
                aria-controls='mobile-menu'
              >
                <Menu className='w-6 h-6' aria-hidden='true' />
              </button>
              <Link to='/portal/dashboard' className='flex items-center space-x-2'>
                <AgritectumLogo size='sm' />
              </Link>
              <NotificationBell />
            </div>
          </header>

          {/* Desktop header */}
          <header className='hidden lg:block bg-white shadow-sm border-b border-slate-200'>
            <div className='flex items-center justify-end px-6 h-16'>
              <NotificationBell />
            </div>
          </header>

          <main id='main-content' className='flex-1' role='main'>
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
      </div>

      {/* GDPR Consent Flow */}
      <GDPRConsentFlow />
    </div>
    </StripeProvider>
  );
};

export default PortalLayout;
