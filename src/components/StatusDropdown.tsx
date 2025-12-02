import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  Archive,
  DollarSign,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Report } from '../types';

interface StatusDropdownProps {
  isMobile?: boolean;
  reports?: Report[];
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  isMobile: _isMobile = false,
  reports = [],
}) => {
  const location = useLocation();

  const statusItems = [
    {
      label: 'All Reports',
      path: '/admin/reports',
      icon: FileText,
      count: reports.length,
    },
    {
      label: 'Draft',
      path: '/admin/reports?status=draft',
      icon: Clock,
      count: reports.filter(r => r.status === 'draft').length,
    },
    {
      label: 'Completed',
      path: '/admin/reports?status=completed',
      icon: CheckCircle,
      count: reports.filter(r => r.status === 'completed').length,
    },
    {
      label: 'Sent',
      path: '/admin/reports?status=sent',
      icon: Send,
      count: reports.filter(r => r.status === 'sent').length,
    },
    {
      label: 'Offer Sent',
      path: '/admin/reports?status=offer_sent',
      icon: DollarSign,
      count: reports.filter(r => r.status === 'offer_sent').length,
    },
    {
      label: 'Offer Accepted',
      path: '/admin/reports?status=offer_accepted',
      icon: CheckCircle,
      count: reports.filter(r => r.status === 'offer_accepted').length,
    },
    {
      label: 'Offer Rejected',
      path: '/admin/reports?status=offer_rejected',
      icon: XCircle,
      count: reports.filter(r => r.status === 'offer_rejected').length,
    },
    {
      label: 'Offer Expired',
      path: '/admin/reports?status=offer_expired',
      icon: AlertTriangle,
      count: reports.filter(r => r.status === 'offer_expired').length,
    },
    {
      label: 'Archived',
      path: '/admin/reports?status=archived',
      icon: Archive,
      count: reports.filter(r => r.status === 'archived').length,
    },
  ];

  return (
    <>
      {statusItems.map((item, index) => {
        const isActive =
          item.path === '/admin/reports'
            ? location.pathname === '/admin/reports' && !location.search
            : location.pathname === item.path || location.pathname + location.search === item.path;

        return (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className='w-4 h-4 mr-2' />
            <span className='flex-1'>{item.label}</span>
            {item.count > 0 && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
};

export default StatusDropdown;
