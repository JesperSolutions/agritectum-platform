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
    scheduled: 'bg-[#7DA8CC]/15 text-[#476279]',
    in_progress: 'bg-[#DA5062]/15 text-[#872a38]',
    completed: 'bg-[#A1BA53]/15 text-[#5c6a2f]',
    cancelled: 'bg-[#DA5062]/15 text-[#872a38]',
    no_show: 'bg-slate-100 text-slate-800',
    active: 'bg-[#A1BA53]/15 text-[#5c6a2f]',
    expired: 'bg-[#DA5062]/15 text-[#872a38]',
    pending: 'bg-[#DA5062]/15 text-[#872a38]',
    accepted: 'bg-[#A1BA53]/15 text-[#5c6a2f]',
    rejected: 'bg-[#DA5062]/15 text-[#872a38]',
    awaiting_response: 'bg-[#DA5062]/15 text-[#872a38]',
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

  const badgeClass = statusStyles[status] || 'bg-[#7DA8CC]/15 text-[#476279]';

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
