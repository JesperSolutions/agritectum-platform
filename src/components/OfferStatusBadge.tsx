import React from 'react';
import { Report } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  isOffer,
  getOfferStatusText,
  getOfferStatusColor,
  getDaysUntilExpiration,
} from '../utils/offerUtils';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface OfferStatusBadgeProps {
  report: Report;
  showIcon?: boolean;
}

const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({ report, showIcon = true }) => {
  if (!isOffer(report)) return null;

  const statusText = getOfferStatusText(report);
  const statusColor = getOfferStatusColor(report);
  const daysLeft = getDaysUntilExpiration(report);

  const getIcon = () => {
    if (!showIcon) return null;

    switch (report.status) {
      case 'offer_accepted':
        return <CheckCircle className='h-3 w-3' />;
      case 'offer_rejected':
      case 'offer_expired':
        return <XCircle className='h-3 w-3' />;
      case 'offer_sent':
        return daysLeft <= 3 ? (
          <AlertTriangle className='h-3 w-3' />
        ) : (
          <Clock className='h-3 w-3' />
        );
      default:
        return <Clock className='h-3 w-3' />;
    }
  };

  const getVariant = () => {
    switch (statusColor) {
      case 'green':
        return 'default';
      case 'red':
        return 'destructive';
      case 'orange':
        return 'secondary';
      case 'blue':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className='flex items-center gap-1'>
      {getIcon()}
      <span>{statusText}</span>
    </Badge>
  );
};

export default OfferStatusBadge;
