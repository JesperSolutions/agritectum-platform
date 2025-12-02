/**
 * Export Service
 * Handles exporting data to various formats (PDF, CSV, Excel)
 */

import { Report, Offer, ServiceAgreement } from '../types';

/**
 * Export reports to CSV
 */
export const exportReportsToCSV = (reports: Report[]): void => {
  if (reports.length === 0) {
    alert('No reports to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Customer Name',
    'Customer Address',
    'Customer Email',
    'Customer Phone',
    'Inspection Date',
    'Roof Type',
    'Status',
    'Total Issues',
    'Critical Issues',
    'Estimated Cost',
    'Created At',
    'Created By',
  ];

  // Convert reports to CSV rows
  const rows = reports.map(report => [
    report.id || '',
    report.customerName || '',
    report.customerAddress || '',
    report.customerEmail || '',
    report.customerPhone || '',
    report.inspectionDate || '',
    report.roofType || '',
    report.status || '',
    (report.issuesFound?.length || 0).toString(),
    (report.issuesFound?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0).toString(),
    (report.estimatedCost || 0).toString(),
    report.createdAt ? new Date(report.createdAt).toISOString() : '',
    report.createdByName || report.createdBy || '',
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Create download
  downloadFile(csvContent, `reports-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

/**
 * Export offers to CSV
 */
export const exportOffersToCSV = (offers: Offer[]): void => {
  if (offers.length === 0) {
    alert('No offers to export');
    return;
  }

  const headers = [
    'ID',
    'Title',
    'Customer Name',
    'Customer Email',
    'Customer Address',
    'Total Amount',
    'Currency',
    'Status',
    'Valid Until',
    'Created At',
    'Responded At',
  ];

  const rows = offers.map(offer => [
    offer.id || '',
    offer.title || '',
    offer.customerName || '',
    offer.customerEmail || '',
    offer.customerAddress || '',
    (offer.totalAmount || 0).toString(),
    offer.currency || 'SEK',
    offer.status || '',
    offer.validUntil ? new Date(offer.validUntil).toISOString() : '',
    offer.createdAt ? new Date(offer.createdAt).toISOString() : '',
    offer.respondedAt ? new Date(offer.respondedAt).toISOString() : '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, `offers-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

/**
 * Export service agreements to CSV
 */
export const exportServiceAgreementsToCSV = (agreements: ServiceAgreement[]): void => {
  if (agreements.length === 0) {
    alert('No service agreements to export');
    return;
  }

  const headers = [
    'ID',
    'Title',
    'Customer Name',
    'Customer Email',
    'Price',
    'Currency',
    'Status',
    'Start Date',
    'Next Service Date',
    'Frequency',
    'Created At',
  ];

  const rows = agreements.map(agreement => [
    agreement.id || '',
    agreement.title || '',
    agreement.customerName || '',
    agreement.customerEmail || '',
    (agreement.price || 0).toString(),
    agreement.currency || 'SEK',
    agreement.status || '',
    agreement.startDate ? new Date(agreement.startDate).toISOString() : '',
    agreement.nextServiceDate ? new Date(agreement.nextServiceDate).toISOString() : '',
    agreement.frequency || '',
    agreement.createdAt ? new Date(agreement.createdAt).toISOString() : '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, `service-agreements-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

/**
 * Export analytics data to CSV
 */
export const exportAnalyticsToCSV = (data: any, filename: string = 'analytics'): void => {
  // Flatten analytics data structure
  const rows: string[][] = [];

  // Add summary rows
  if (data.totalReports !== undefined) {
    rows.push(['Total Reports', data.totalReports.toString()]);
  }
  if (data.totalRevenue !== undefined) {
    rows.push(['Total Revenue', data.totalRevenue.toString()]);
  }
  if (data.uniqueCustomers !== undefined) {
    rows.push(['Unique Customers', data.uniqueCustomers.toString()]);
  }

  // Add customer data if available
  if (data.topCustomers && Array.isArray(data.topCustomers)) {
    rows.push([]);
    rows.push(['Top Customers']);
    rows.push(['Name', 'Revenue', 'Report Count', 'Location']);
    data.topCustomers.forEach((customer: any) => {
      rows.push([
        customer.name || '',
        (customer.revenue || 0).toString(),
        (customer.reportCount || 0).toString(),
        customer.location || '',
      ]);
    });
  }

  // Convert to CSV
  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, `${filename}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

/**
 * Helper function to download a file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export report as PDF (opens print dialog)
 */
export const exportReportToPDF = (reportId: string): void => {
  // Open report in new window with print parameter
  const url = `/report/view/${reportId}?print=1`;
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

/**
 * Export offer as PDF (opens print dialog)
 */
export const exportOfferToPDF = (offerId: string): void => {
  const url = `/offer/public/${offerId}?print=1`;
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

/**
 * Export service agreement as PDF (opens print dialog)
 */
export const exportServiceAgreementToPDF = (agreementId: string): void => {
  const url = `/service-agreement/public/${agreementId}?print=1`;
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

