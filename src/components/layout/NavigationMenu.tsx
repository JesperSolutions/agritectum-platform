/**
 * Navigation Menu Component
 * 
 * Provides a collapsible navigation menu with grouped items
 * Supports nested menu items with expand/collapse functionality
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavigationItem[];
  roles?: string[];
}

interface NavigationMenuProps {
  items: NavigationItem[];
  currentUserRole: string;
  isMobile?: boolean;
  onItemClick?: () => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  currentUserRole,
  isMobile = false,
  onItemClick,
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Check if a route is currently active
  const isActiveRoute = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Check if any child route is active (for expanding parent groups)
  const hasActiveChild = (item: NavigationItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => {
      if (child.path && isActiveRoute(child.path)) return true;
      return child.children ? hasActiveChild(child) : false;
    });
  };

  // Auto-expand groups with active children
  useEffect(() => {
    const newExpanded = new Set<string>();
    items.forEach(item => {
      if (item.children && hasActiveChild(item)) {
        newExpanded.add(item.label);
      }
    });
    setExpandedItems(newExpanded);
  }, [location.pathname, items]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderItem = (item: NavigationItem, level: number = 0): React.ReactNode => {
    // Filter by role if specified
    if (item.roles && !item.roles.includes(currentUserRole)) {
      return null;
    }

    // Filter children by role
    const filteredChildren = item.children?.filter(child => 
      !child.roles || child.roles.includes(currentUserRole)
    );

    const hasChildren = filteredChildren && filteredChildren.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive = item.path ? isActiveRoute(item.path) : false;
    const hasActive = hasActiveChild(item);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
              hasActive
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${0.75 + level * 1}rem` }}
          >
            <span className="truncate">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
            )}
          </button>
          {isExpanded && filteredChildren && (
            <div className="mt-1 space-y-1">
              {filteredChildren.map(child => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path || item.label}
        to={item.path || '#'}
        onClick={onItemClick}
        className={`block px-3 py-2.5 rounded-lg transition-all ${
          isActive
            ? 'bg-slate-100 text-slate-900 font-semibold'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${0.75 + level * 1}rem` }}
      >
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return <div className="space-y-1">{items.map(item => renderItem(item))}</div>;
};

export default NavigationMenu;
