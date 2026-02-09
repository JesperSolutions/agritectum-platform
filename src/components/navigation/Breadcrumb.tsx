import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Building,
  Users,
  FileText,
  BarChart3,
  Settings,
  DollarSign,
  Calendar,
  FileCheck,
  Mail,
  Leaf,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  customItems?: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className = '',
  showHome = true,
  customItems,
}) => {
  const location = useLocation();
  const params = useParams();
  const { currentUser } = useAuth();
  const { t } = useIntl();

  // Route mapping for breadcrumbs
  const routeMap: Record<string, BreadcrumbItem> = {
    '/': { label: t('navigation.home'), icon: <Home className='w-4 h-4' /> },
    '/dashboard': { label: t('navigation.dashboard'), icon: <Home className='w-4 h-4' /> },
    '/profile': { label: t('navigation.profile') || 'Profile', icon: <User className='w-4 h-4' /> },
    '/admin/branches': { label: t('navigation.branches'), icon: <Building className='w-4 h-4' /> },
    '/admin/users': { label: t('navigation.users'), icon: <Users className='w-4 h-4' /> },
    '/admin/reports': { label: t('navigation.reports'), icon: <FileText className='w-4 h-4' /> },
    '/reports': { label: t('navigation.reports'), icon: <FileText className='w-4 h-4' /> },
    '/offers': { label: t('navigation.offers'), icon: <DollarSign className='w-4 h-4' /> },
    '/schedule': {
      label: t('navigation.schedule') || 'Schedule',
      icon: <Calendar className='w-4 h-4' />,
    },
    '/admin/customers': { label: t('navigation.customers'), icon: <Users className='w-4 h-4' /> },
    '/customers': { label: t('navigation.customers'), icon: <Users className='w-4 h-4' /> },
    '/admin/service-agreements': {
      label: t('navigation.serviceAgreements') || 'Service Agreements',
      icon: <FileCheck className='w-4 h-4' />,
    },
    '/admin/analytics': {
      label: t('navigation.analytics'),
      icon: <BarChart3 className='w-4 h-4' />,
    },
    '/analytics': { label: t('navigation.analytics'), icon: <BarChart3 className='w-4 h-4' /> },
    '/admin/building-esg-improvements': {
      label: t('navigation.esgImprovements') || 'ESG Improvements',
      icon: <Leaf className='w-4 h-4' />,
    },
    '/admin/esg-service': {
      label: t('navigation.newESGReport') || 'New ESG Report',
      icon: <Leaf className='w-4 h-4' />,
    },
    '/admin/esg-reports': {
      label: t('navigation.allESGReports') || 'All ESG Reports',
      icon: <Leaf className='w-4 h-4' />,
    },
    '/admin/email-templates': {
      label: t('navigation.emailTemplates') || 'Email Templates',
      icon: <Mail className='w-4 h-4' />,
    },
    '/settings': { label: t('navigation.settings'), icon: <Settings className='w-4 h-4' /> },
    '/report/new': { label: t('navigation.newTagReport'), icon: <FileText className='w-4 h-4' /> },
    '/report/edit': { label: t('navigation.editReport'), icon: <FileText className='w-4 h-4' /> },
    '/report/view': { label: t('navigation.viewReport'), icon: <FileText className='w-4 h-4' /> },
    
    // Portal routes
    '/portal': { label: t('navigation.home'), icon: <Home className='w-4 h-4' /> },
    '/portal/dashboard': { label: t('navigation.dashboard'), icon: <Home className='w-4 h-4' /> },
    '/portal/esg-overview': { label: 'ESG Overview', icon: <Leaf className='w-4 h-4' /> },
    '/portal/buildings': { label: t('navigation.buildings'), icon: <Building className='w-4 h-4' /> },
    '/portal/service-agreements': {
      label: t('navigation.serviceAgreements') || 'Service Agreements',
      icon: <FileCheck className='w-4 h-4' />,
    },
    '/portal/scheduled-visits': {
      label: t('navigation.scheduledVisits') || 'Scheduled Visits',
      icon: <Calendar className='w-4 h-4' />,
    },
    '/portal/billing': { label: 'Billing', icon: <DollarSign className='w-4 h-4' /> },
    '/portal/profile': { label: t('navigation.profile') || 'Profile', icon: <User className='w-4 h-4' /> },
    '/portal/reports': { label: t('navigation.reports'), icon: <FileText className='w-4 h-4' /> },
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Determine home path based on context
    const isPortal = location.pathname.startsWith('/portal');
    const homePath = isPortal ? '/portal/dashboard' : '/dashboard';
    const homeLabel = t('navigation.home');

    // Add home if enabled
    if (showHome && location.pathname !== '/dashboard' && location.pathname !== '/portal/dashboard') {
      breadcrumbs.push({
        label: homeLabel,
        path: homePath,
        icon: <Home className='w-4 h-4' />,
      });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Handle dynamic routes
      if (segment.match(/^[a-zA-Z0-9_-]{20,}$/)) {
        // This looks like an ID, try to get context from params
        const context = getContextForId(segment, params, currentUser);
        if (context) {
          breadcrumbs.push({
            label: context,
            path: isLast ? undefined : currentPath,
            isActive: isLast,
          });
        }
      } else {
        // Regular route segment
        const routeInfo = routeMap[currentPath];
        if (routeInfo) {
          breadcrumbs.push({
            ...routeInfo,
            path: isLast ? undefined : currentPath,
            isActive: isLast,
          });
        } else {
          // Fallback for unknown routes
          // Special handling for admin routes - don't make /admin clickable since it doesn't exist
          if (segment === 'admin') {
            breadcrumbs.push({
              label: t('navigation.admin'),
              path: undefined, // Never make it clickable
              isActive: isLast,
              icon: <Settings className='w-4 h-4' />,
            });
          } else {
            breadcrumbs.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              path: isLast ? undefined : currentPath,
              isActive: isLast,
            });
          }
        }
      }
    });

    return breadcrumbs;
  };

  // Get context for ID-based routes
  const getContextForId = (id: string, params: any, _user: any): string | null => {
    // Handle specific route patterns
    if (params.reportId === id) {
      return t('navigation.reportDetails');
    }
    if (params.userId === id) {
      return t('navigation.userDetails');
    }
    if (params.branchId === id) {
      return t('navigation.branchDetails');
    }
    if (params.offerId === id) {
      return t('navigation.offerDetails');
    }
    if (params.buildingId === id) {
      return t('navigation.buildingDetails') || 'Building Details';
    }
    if (params.agreementId === id) {
      return 'Agreement Details';
    }

    return null;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on dashboard/home page
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  // Don't show if only one item (just home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}
      aria-label='Breadcrumb'
    >
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className='w-4 h-4 text-gray-400 mx-1' />}

          {item.path ? (
            <Link
              to={item.path}
              className='flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors duration-200'
            >
              {item.icon}
              <span className='truncate max-w-[150px]'>{item.label}</span>
            </Link>
          ) : (
            <span
              className={`flex items-center space-x-1 ${
                item.isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className='truncate max-w-[150px]'>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
