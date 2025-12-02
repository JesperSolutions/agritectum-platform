import React from 'react';
import { OfferStatus } from '../../types';

interface OfferStatusBadgeProps {
  status: OfferStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * Offer Status Badge Component
 * Displays color-coded status badge for offers
 */
const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = false,
}) => {
  const getStatusConfig = (status: OfferStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Väntar',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '🕒',
          iconColor: 'text-yellow-600',
        };
      case 'accepted':
        return {
          label: 'Accepterad',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✅',
          iconColor: 'text-green-600',
        };
      case 'rejected':
        return {
          label: 'Avvisad',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '❌',
          iconColor: 'text-red-600',
        };
      case 'awaiting_response':
        return {
          label: 'Väntar på svar',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: '📧',
          iconColor: 'text-orange-600',
        };
      case 'expired':
        return {
          label: 'Utgången',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '⏰',
          iconColor: 'text-gray-600',
        };
      default:
        return {
          label: 'Okänd',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '?',
          iconColor: 'text-gray-600',
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-lg px-4 py-2';
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${config.color} ${sizeClasses}`}
      title={config.label}
    >
      {showIcon && (
        <span className={config.iconColor} aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default OfferStatusBadge;

