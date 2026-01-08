import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Bell,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingActionButton from './FloatingActionButton';
import OfflineIndicator from './OfflineIndicator';

const LayoutModern: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { state } = useReports();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useIntl();

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
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: Home,
      current: isActiveRoute('/dashboard'),
    },
    {
      name: t('nav.reports'),
      href: '/reports',
      icon: FileText,
      current: isActiveRoute('/reports'),
    },
    {
      name: t('nav.analytics'),
      href: '/analytics',
      icon: BarChart3,
      current: isActiveRoute('/analytics'),
    },
  ];

  const adminItems = [
    {
      name: t('nav.userManagement'),
      href: '/admin/users',
      icon: Users,
      current: isActiveRoute('/admin/users'),
    },
    {
      name: t('nav.branchManagement'),
      href: '/admin/branches',
      icon: Building,
      current: isActiveRoute('/admin/branches'),
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className={cn('flex flex-col h-full bg-card border-r', isMobile ? 'w-64' : 'w-64')}>
      {/* Logo */}
      <div className='flex items-center justify-between p-6 border-b'>
        <div className='flex items-center space-x-2'>
          <div className='p-2 bg-primary rounded-lg'>
            <Building className='h-6 w-6 text-primary-foreground' />
          </div>
          <div>
            <h1 className='text-lg font-semibold'>Taklaget</h1>
            <p className='text-xs text-muted-foreground'>Roof Inspection</p>
          </div>
        </div>
        {isMobile && (
          <Button variant='ghost' size='sm' onClick={() => setIsMobileMenuOpen(false)}>
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-2'>
        <div className='space-y-1'>
          {navigationItems.map(item => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                item.current
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            >
              <item.icon className='h-4 w-4' />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        {currentUser?.role === 'super_admin' && (
          <>
            <Separator className='my-4' />
            <div className='space-y-1'>
              <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                {t('nav.admin')}
              </p>
              {adminItems.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    item.current
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                >
                  <item.icon className='h-4 w-4' />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className='p-4 border-t'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='w-full justify-start p-2 h-auto'>
              <div className='flex items-center space-x-3 w-full'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={currentUser?.photoURL || ''} />
                  <AvatarFallback>
                    {currentUser?.displayName ? getInitials(currentUser.displayName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 text-left'>
                  <p className='text-sm font-medium'>{currentUser?.displayName || 'User'}</p>
                  <p className='text-xs text-muted-foreground'>
                    {currentUser?.role?.replace('_', ' ').toUpperCase() || 'USER'}
                  </p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className='h-4 w-4 mr-2' />
              {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className='h-4 w-4 mr-2' />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
              <LogOut className='h-4 w-4 mr-2' />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-background'>
      {/* Mobile Header */}
      <div className='lg:hidden flex items-center justify-between p-4 border-b bg-card'>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant='ghost' size='sm'>
              <Menu className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='p-0'>
            <Sidebar isMobile />
          </SheetContent>
        </Sheet>

        <div className='flex items-center space-x-2'>
          <div className='p-1 bg-primary rounded'>
            <Building className='h-5 w-5 text-primary-foreground' />
          </div>
          <span className='font-semibold'>Taklaget</span>
        </div>

        <div className='flex items-center space-x-2'>
          <Button variant='ghost' size='sm'>
            <Bell className='h-4 w-4' />
          </Button>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={currentUser?.photoURL || ''} />
            <AvatarFallback>
              {currentUser?.displayName ? getInitials(currentUser.displayName) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className='flex h-screen'>
        {/* Desktop Sidebar */}
        <div className='hidden lg:flex'>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Desktop Header */}
          <div className='hidden lg:flex items-center justify-between p-4 border-b bg-card'>
            <div className='flex items-center space-x-4'>
              <h2 className='text-lg font-semibold'>
                {navigationItems.find(item => item.current)?.name || 'Dashboard'}
              </h2>
              {state.syncing && (
                <Badge variant='secondary' className='flex items-center space-x-1'>
                  <Sync className='h-3 w-3 animate-spin' />
                  <span>{t('nav.syncing')}</span>
                </Badge>
              )}
            </div>

            <div className='flex items-center space-x-4'>
              <Button variant='ghost' size='sm'>
                <Bell className='h-4 w-4' />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' className='flex items-center space-x-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={currentUser?.photoURL || ''} />
                      <AvatarFallback>
                        {currentUser?.displayName ? getInitials(currentUser.displayName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-left'>
                      <p className='text-sm font-medium'>{currentUser?.displayName || 'User'}</p>
                      <p className='text-xs text-muted-foreground'>
                        {currentUser?.role?.replace('_', ' ').toUpperCase() || 'USER'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className='h-4 w-4 mr-2' />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className='h-4 w-4 mr-2' />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
                    <LogOut className='h-4 w-4 mr-2' />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Page Content */}
          <main className='flex-1 overflow-auto'>
            <div className='h-full'>
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default LayoutModern;
