import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home, Building, Users, FileText, BarChart3, Settings, DollarSign } from 'lucide-react';
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
  customItems 
}) => {
  const location = useLocation();
  const params = useParams();
  const { currentUser } = useAuth();
  const { t } = useIntl();

  // Route mapping for breadcrumbs
  const routeMap: Record<string, BreadcrumbItem> = {
    '/': { label: t('navigation.home'), icon: <Home className="w-4 h-4" /> },
    '/dashboard': { label: t('navigation.dashboard'), icon: <Home className="w-4 h-4" /> },
    '/admin/branches': { label: t('navigation.branches'), icon: <Building className="w-4 h-4" /> },
    '/admin/users': { label: t('navigation.users'), icon: <Users className="w-4 h-4" /> },
    '/admin/reports': { label: t('navigation.reports'), icon: <FileText className="w-4 h-4" /> },
    '/reports': { label: t('navigation.reports'), icon: <FileText className="w-4 h-4" /> },
    '/offers': { label: t('navigation.offers'), icon: <DollarSign className="w-4 h-4" /> },
    '/analytics': { label: t('navigation.analytics'), icon: <BarChart3 className="w-4 h-4" /> },
    '/customers': { label: t('navigation.customers'), icon: <Users className="w-4 h-4" /> },
    '/settings': { label: t('navigation.settings'), icon: <Settings className="w-4 h-4" /> },
    '/report/new': { label: t('navigation.newReport'), icon: <FileText className="w-4 h-4" /> },
    '/report/edit': { label: t('navigation.editReport'), icon: <FileText className="w-4 h-4" /> },
    '/report/view': { label: t('navigation.viewReport'), icon: <FileText className="w-4 h-4" /> },
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if enabled
    if (showHome && location.pathname !== '/dashboard') {
      breadcrumbs.push({
        label: t('navigation.home'),
        path: '/dashboard',
        icon: <Home className="w-4 h-4" />,
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
              icon: <Settings className="w-4 h-4" />,
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
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          )}
          
          {item.path ? (
            <Link
              to={item.path}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {item.icon}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </Link>
          ) : (
            <span 
              className={`flex items-center space-x-1 ${
                item.isActive 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;