import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type StatusBadgeVariant =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'active'
  | 'expired'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'awaiting_response';

interface StatusBadgeProps {
  status: StatusBadgeVariant | string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Standardized status badge component matching reference design
 * Uses consistent blue badge styling: bg-blue-100 text-blue-800
 * Supports custom variants for different status types
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon: Icon,
  className = '',
}) => {
  // Status color mapping - default to blue for scheduled
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    awaiting_response: 'bg-orange-100 text-orange-800',
  };

  const badgeClass = statusStyles[status] || 'bg-blue-100 text-blue-800';
  const displayLabel = label || status.replace('_', ' ');

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded',
        badgeClass,
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3 inline mr-1" />}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
