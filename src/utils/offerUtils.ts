import { Report } from '../types';

// Check if a report is an offer
export const isOffer = (report: Report): boolean => {
  return report.isOffer === true;
};

// Check if an offer is expired
export const isOfferExpired = (report: Report): boolean => {
  if (!isOffer(report) || !report.offerValidUntil) return false;
  return new Date(report.offerValidUntil) < new Date();
};

// Get days until offer expires
export const getDaysUntilExpiration = (report: Report): number => {
  if (!isOffer(report) || !report.offerValidUntil) return 0;
  const expirationDate = new Date(report.offerValidUntil);
  const today = new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get offer status display text
export const getOfferStatusText = (report: Report): string => {
  if (!isOffer(report)) return '';

  switch (report.status) {
    case 'offer_sent':
      const daysLeft = getDaysUntilExpiration(report);
      if (daysLeft <= 0) return 'Utgången';
      if (daysLeft <= 3) return `Går ut om ${daysLeft} dag${daysLeft > 1 ? 'ar' : ''}`;
      return 'Skickad';
    case 'offer_accepted':
      return 'Accepterad';
    case 'offer_rejected':
      return 'Avvisad';
    case 'offer_expired':
      return 'Utgången';
    default:
      return 'Utkast';
  }
};

// Get offer status color for UI
export const getOfferStatusColor = (report: Report): string => {
  if (!isOffer(report)) return 'gray';

  switch (report.status) {
    case 'offer_sent':
      const daysLeft = getDaysUntilExpiration(report);
      if (daysLeft <= 0) return 'red';
      if (daysLeft <= 3) return 'orange';
      return 'blue';
    case 'offer_accepted':
      return 'green';
    case 'offer_rejected':
      return 'red';
    case 'offer_expired':
      return 'red';
    default:
      return 'gray';
  }
};

// Validate offer data
export const validateOffer = (report: Partial<Report>): string[] => {
  const errors: string[] = [];

  if (!report.offerValue || report.offerValue <= 0) {
    errors.push('Offertvärde måste vara större än 0');
  }

  if (!report.offerValidUntil) {
    errors.push('Offertens giltighetsdatum måste anges');
  } else {
    const expirationDate = new Date(report.offerValidUntil);
    const today = new Date();
    if (expirationDate <= today) {
      errors.push('Offertens giltighetsdatum måste vara i framtiden');
    }
  }

  return errors;
};

export const formatSvDate = (value: any): string => {
  if (!value) return '-';
  try {
    const d = (value && typeof value.toDate === 'function') ? value.toDate() : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('sv-SE');
  } catch {
    return '-';
  }
};

export const formatSvDateTime = (value: any): string => {
  if (!value) return '-';
  try {
    const d = (value && typeof value.toDate === 'function') ? value.toDate() : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};