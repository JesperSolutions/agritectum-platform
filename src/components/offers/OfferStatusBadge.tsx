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
          color: 'bg-[#DA5062]/15 text-[#872a38] border-[#DA5062]/35',
          icon: '🕒',
          iconColor: 'text-[#DA5062]',
        };
      case 'accepted':
        return {
          label: 'Accepterad',
          color: 'bg-[#A1BA53]/15 text-[#5c6a2f] border-[#A1BA53]/40',
          icon: '✅',
          iconColor: 'text-[#A1BA53]',
        };
      case 'rejected':
        return {
          label: 'Avvisad',
          color: 'bg-[#DA5062]/15 text-[#872a38] border-[#DA5062]/40',
          icon: '❌',
          iconColor: 'text-[#DA5062]',
        };
      case 'awaiting_response':
        return {
          label: 'Väntar på svar',
          color: 'bg-[#DA5062]/15 text-[#872a38] border-[#DA5062]/40',
          icon: '📧',
          iconColor: 'text-[#DA5062]',
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
        <span className={config.iconColor} aria-hidden='true'>
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default OfferStatusBadge;
