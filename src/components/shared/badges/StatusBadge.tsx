import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useIntl } from '../../../hooks/useIntl';

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
  useTranslation?: boolean; // Whether to use translation keys for status
}

/**
 * Standardized status badge component using Material Design tokens
 * Uses design system semantic colors and consistent styling
 * Supports automatic translation of status values
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon: Icon,
  className = '',
  useTranslation = true,
}) => {
  const { t } = useIntl();

  // Status color mapping using design system semantic colors
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-slate-100 text-slate-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    awaiting_response: 'bg-orange-100 text-orange-800',
  };

  // Status translation key mapping
  const getStatusTranslationKey = (statusValue: string): string => {
    const statusMap: Record<string, string> = {
      scheduled: 'schedule.status.scheduled',
      in_progress: 'schedule.status.inProgress',
      completed: 'schedule.status.completed',
      cancelled: 'schedule.status.cancelled',
      no_show: 'schedule.status.noShow',
      active: 'common.status.active',
      expired: 'common.status.expired',
      pending: 'common.status.pending',
      accepted: 'schedule.status.accepted',
      rejected: 'schedule.status.rejected',
      awaiting_response: 'schedule.status.awaitingResponse',
    };
    return statusMap[statusValue] || '';
  };

  const badgeClass = statusStyles[status] || 'bg-blue-100 text-blue-800';

  // Determine display label: use provided label, or translate status, or fallback to formatted status
  let displayLabel: string;
  if (label) {
    displayLabel = label;
  } else if (useTranslation) {
    const translationKey = getStatusTranslationKey(status);
    if (translationKey) {
      displayLabel = t(translationKey) || status.replace('_', ' ');
    } else {
      displayLabel = status.replace('_', ' ');
    }
  } else {
    displayLabel = status.replace('_', ' ');
  }

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', badgeClass, className)}>
      {Icon && <Icon className='w-3 h-3 inline mr-1' />}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
