/**
 * Billing Status Badge Component
 * Displays the current billing status for service agreements
 * 
 * Only shows for internal providers with billing enabled
 */

import React from 'react';
import { ServiceAgreement } from '../../types';
import {
  getBillingStatusText,
  getBillingStatusColor,
  isBillingAvailable,
  isBillingSetup,
} from '../../services/serviceAgreementBillingService';
import { DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BillingStatusBadgeProps {
  agreement: ServiceAgreement;
  showDetails?: boolean;
  className?: string;
}

const BillingStatusBadge: React.FC<BillingStatusBadgeProps> = ({
  agreement,
  showDetails = false,
  className = '',
}) => {
  // Don't show for external providers
  if (agreement.providerType === 'external') {
    return null;
  }

  // Check if billing is available
  const billingAvailable = isBillingAvailable(agreement);
  const billingIsSetup = isBillingSetup(agreement);

  if (!billingAvailable && !billingIsSetup) {
    return null;
  }

  const status = agreement.billingStatus || 'not_setup';
  const statusText = getBillingStatusText(status);
  const color = getBillingStatusColor(status);

  // Color classes
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  // Icon based on status
  const getIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className='w-3.5 h-3.5' />;
      case 'past_due':
        return <Clock className='w-3.5 h-3.5' />;
      case 'unpaid':
        return <AlertCircle className='w-3.5 h-3.5' />;
      case 'cancelled':
        return <XCircle className='w-3.5 h-3.5' />;
      default:
        return <DollarSign className='w-3.5 h-3.5' />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClasses[color]}`}
      >
        {getIcon()}
        <span>Billing: {statusText}</span>
      </span>

      {showDetails && agreement.nextBillingDate && status === 'active' && (
        <span className='text-xs text-gray-600 ml-1'>
          Next: {new Date(agreement.nextBillingDate).toLocaleDateString('da-DK')}
        </span>
      )}
    </div>
  );
};

export default BillingStatusBadge;
