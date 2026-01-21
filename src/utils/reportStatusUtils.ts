import { ReportStatus } from '../types';

/**
 * State machine for report status transitions
 * Prevents invalid status changes that could corrupt data
 */

export const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  // Draft can become completed, archived
  draft: ['completed', 'archived'],

  // Completed can become sent, shared, archived
  completed: ['sent', 'shared', 'archived'],

  // Sent can become shared, archived (but not back to completed/draft)
  sent: ['shared', 'archived'],

  // Shared can become sent, archived (allows toggling public access)
  shared: ['sent', 'archived'],

  // Archived is terminal - no transitions allowed
  archived: [],

  // Offer statuses
  offer_sent: ['offer_accepted', 'offer_rejected', 'offer_expired', 'archived'],
  offer_accepted: ['archived'],
  offer_rejected: ['archived'],
  offer_expired: ['archived'],
};

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (
  currentStatus: ReportStatus,
  newStatus: ReportStatus
): boolean => {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  return validNextStatuses.includes(newStatus);
};

/**
 * Get all valid next statuses for a given status
 */
export const getValidNextStatuses = (currentStatus: ReportStatus): ReportStatus[] => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if a status is terminal (no transitions allowed)
 */
export const isTerminalStatus = (status: ReportStatus): boolean => {
  return VALID_TRANSITIONS[status]?.length === 0;
};

/**
 * Check if a status is an offer status
 */
export const isOfferStatus = (status: ReportStatus): boolean => {
  return status.startsWith('offer_');
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: ReportStatus): string => {
  const labels: Record<ReportStatus, string> = {
    draft: 'Draft (Incomplete)',
    completed: 'Completed',
    sent: 'Sent to Customer',
    shared: 'Shared (Public)',
    archived: 'Archived',
    offer_sent: 'Offer Sent',
    offer_accepted: 'Offer Accepted',
    offer_rejected: 'Offer Rejected',
    offer_expired: 'Offer Expired',
  };

  return labels[status] || status;
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: ReportStatus): string => {
  const colors: Record<ReportStatus, string> = {
    draft: 'gray',
    completed: 'blue',
    sent: 'green',
    shared: 'purple',
    archived: 'red',
    offer_sent: 'yellow',
    offer_accepted: 'green',
    offer_rejected: 'red',
    offer_expired: 'orange',
  };

  return colors[status] || 'gray';
};
