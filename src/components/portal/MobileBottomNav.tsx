import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Calendar, User, Menu } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

/**
 * Mobile Bottom Navigation Bar
 * Provides quick access to main sections on mobile devices
 * Follows iOS/Material Design mobile navigation patterns
 */
const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { t } = useIntl();

  const isActiveRoute = (path: string) => {
    if (path === '/portal/dashboard') {
      return location.pathname === '/portal/dashboard' || location.pathname === '/portal';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      label: t('navigation.dashboard'),
      icon: Home,
      path: '/portal/dashboard',
    },
    {
      label: t('navigation.buildings'),
      icon: Building,
      path: '/portal/buildings',
    },
    {
      label: t('navigation.scheduledVisits'),
      icon: Calendar,
      path: '/portal/scheduled-visits',
    },
    {
      label: t('navigation.profile'),
      icon: User,
      path: '/portal/profile',
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-500 active:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}
                aria-hidden="true"
              />
              <span className="text-xs font-medium truncate max-w-[60px]">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
            </Link>
          );
        })}

        {/* More menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-slate-500 active:text-slate-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs font-medium">
            {t('common.menu') || 'Menu'}
          </span>
        </button>
      </div>

      {/* Safe area spacing for iOS devices with notch */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
};

export default MobileBottomNav;
