import { Report, InspectionChecklistItem } from '../types';
import { logger } from './logger';

/**
 * Migration utility for report format updates
 * Ensures backward compatibility with existing reports
 */

/**
 * Migrate a report from old format to new format
 * Adds missing fields with default values
 */
export const migrateReport = (report: any): Report => {
  try {
    // Ensure all required Report fields exist
    const migratedReport: Report = {
      id: report.id || '',
      createdBy: report.createdBy || '',
      createdByName: report.createdByName || '',
      branchId: report.branchId || '',
      inspectionDate: report.inspectionDate || new Date().toISOString().split('T')[0],
      customerName: report.customerName || '',
      customerAddress: report.customerAddress || '',
      buildingId: report.buildingId || '',
      roofType: report.roofType || 'flat',
      conditionNotes: report.conditionNotes || '',
      issuesFound: Array.isArray(report.issuesFound) ? report.issuesFound : [],
      recommendedActions: Array.isArray(report.recommendedActions) ? report.recommendedActions : [],
      status: report.status || 'draft',
      createdAt: report.createdAt || new Date().toISOString(),
      lastEdited: report.lastEdited || new Date().toISOString(),
      isShared: report.isShared ?? false,
      isOffer: report.isOffer ?? false,

      // Optional fields - preserve if they exist
      customerId: report.customerId,
      customerPhone: report.customerPhone,
      customerEmail: report.customerEmail,
      customerType: report.customerType || 'company',
      buildingName: report.buildingName,
      buildingAddress: report.buildingAddress,
      roofAge: report.roofAge,
      roofSize: report.roofSize,
      inspectionDuration: report.inspectionDuration,

      // NEW: Inspection checklist - default to empty if missing
      inspectionChecklist: report.inspectionChecklist || {},

      // Offer fields
      isPublic: report.isPublic,
      pdfLink: report.pdfLink,
      images: report.images,
      priorReportId: report.priorReportId,
      appointmentId: report.appointmentId,
      offerValue: report.offerValue,
      offerValidUntil: report.offerValidUntil,
      offerId: report.offerId,
      offerCreatedAt: report.offerCreatedAt,
      offerStatus: report.offerStatus,

      // Image fields
      roofImageUrl: report.roofImageUrl,
      roofImagePins: report.roofImagePins,
      roofMapMarkers: report.roofMapMarkers,

      // Cost fields
      laborCost: report.laborCost,
      materialCost: report.materialCost,
      travelCost: report.travelCost,
      overheadCost: report.overheadCost,
      profitMargin: report.profitMargin,
    };

    return migratedReport;
  } catch (error) {
    logger.error('Error migrating report:', error);
    throw error;
  }
};

/**
 * Migrate multiple reports
 */
export const migrateReports = (reports: any[]): Report[] => {
  return reports.map(report => migrateReport(report));
};

/**
 * Check if a report needs migration (is missing new fields)
 */
export const reportNeedsMigration = (report: any): boolean => {
  // Check if the report is missing the inspectionChecklist field
  return !('inspectionChecklist' in report);
};

/**
 * Get migration summary for reports
 */
export const getMigrationSummary = (reports: any[]): { total: number; needsMigration: number } => {
  const needsMigration = reports.filter(reportNeedsMigration).length;
  return {
    total: reports.length,
    needsMigration,
  };
};
