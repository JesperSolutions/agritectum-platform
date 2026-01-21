/**
 * Form Data Validation Utilities
 *
 * Comprehensive validation and sanitization utilities to prevent form breakage
 * from invalid data, corrupted localStorage, or user input errors.
 */

import { Report, Issue, RecommendedAction, RoofType, ReportStatus } from '../types';

/**
 * Safely parse a number, returning undefined if invalid
 */
export function safeParseNumber(
  value: string | number | null | undefined,
  min?: number,
  max?: number
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return undefined;
  }

  if (min !== undefined && num < min) {
    return undefined;
  }

  if (max !== undefined && num > max) {
    return undefined;
  }

  return num;
}

/**
 * Safely parse an integer, returning undefined if invalid
 */
export function safeParseInt(
  value: string | number | null | undefined,
  min?: number,
  max?: number
): number | undefined {
  const num = safeParseNumber(value, min, max);
  return num !== undefined ? Math.floor(num) : undefined;
}

/**
 * Validate coordinates are within valid ranges
 */
export function validateCoordinates(
  lat: number | string | null | undefined,
  lon: number | string | null | undefined
): { lat: number; lon: number } | null {
  const latNum = safeParseNumber(lat, -90, 90);
  const lonNum = safeParseNumber(lon, -180, 180);

  if (latNum === undefined || lonNum === undefined) {
    return null;
  }

  return { lat: latNum, lon: lonNum };
}

/**
 * Validate a date string and return a valid date string or null
 */
export function validateDateString(dateString: string | Date | null | undefined): string | null {
  if (!dateString) {
    return null;
  }

  try {
    let date: Date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string') {
      // Handle ISO strings
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // Handle YYYY-MM-DD format
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);

          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            date = new Date(year, month, day);
          } else {
            return null;
          }
        } else {
          date = new Date(dateString);
        }
      }
    } else {
      return null;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Return in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Validate an array and ensure it contains valid items
 */
export function validateArray<T>(value: any, validator?: (item: any) => item is T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  if (validator) {
    return value.filter(validator);
  }

  return value as T[];
}

/**
 * Validate an Issue object
 */
function isValidIssue(obj: any): obj is Issue {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.severity === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.location === 'string'
  );
}

/**
 * Validate a RecommendedAction object
 */
function isValidRecommendedAction(obj: any): obj is RecommendedAction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.priority === 'string' &&
    typeof obj.description === 'string'
  );
}

/**
 * Validate roof type is valid
 */
function isValidRoofType(value: any): value is RoofType {
  const validTypes: RoofType[] = [
    'tile',
    'metal',
    'shingle',
    'slate',
    'flat',
    'flat_bitumen_2layer',
    'flat_bitumen_3layer',
    'flat_rubber',
    'flat_pvc',
    'flat_tpo',
    'flat_epdm',
    'other',
  ];
  return typeof value === 'string' && validTypes.includes(value as RoofType);
}

/**
 * Validate report status is valid
 */
function isValidReportStatus(value: any): value is ReportStatus {
  const validStatuses: ReportStatus[] = [
    'draft',
    'completed',
    'sent',
    'archived',
    'offer_sent',
    'offer_accepted',
    'offer_rejected',
    'offer_expired',
  ];
  return typeof value === 'string' && validStatuses.includes(value as ReportStatus);
}

/**
 * Sanitize and validate draft data from localStorage
 */
export function sanitizeDraftData(draftData: any): Partial<Report> {
  const sanitized: Partial<Report> = {};

  // String fields with trim and min length checks
  if (typeof draftData.customerName === 'string' && draftData.customerName.trim().length >= 2) {
    sanitized.customerName = draftData.customerName.trim();
  }

  if (
    typeof draftData.customerAddress === 'string' &&
    draftData.customerAddress.trim().length >= 5
  ) {
    sanitized.customerAddress = draftData.customerAddress.trim();
  }

  if (typeof draftData.customerPhone === 'string' && draftData.customerPhone.trim().length > 0) {
    sanitized.customerPhone = draftData.customerPhone.trim();
  }

  if (typeof draftData.customerEmail === 'string' && draftData.customerEmail.trim().length > 0) {
    const email = draftData.customerEmail.trim();
    // Basic email validation
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sanitized.customerEmail = email;
    }
  }

  // Date fields
  const inspectionDate = validateDateString(draftData.inspectionDate);
  if (inspectionDate) {
    sanitized.inspectionDate = inspectionDate;
  }

  const offerValidUntil = validateDateString(draftData.offerValidUntil);
  if (offerValidUntil) {
    sanitized.offerValidUntil = offerValidUntil;
  }

  // Numeric fields with bounds
  const roofAge = safeParseInt(draftData.roofAge, 0, 100);
  if (roofAge !== undefined) {
    sanitized.roofAge = roofAge;
  }

  const offerValue = safeParseNumber(draftData.offerValue, 0, 10000000);
  if (offerValue !== undefined) {
    sanitized.offerValue = offerValue;
  }

  // Roof type validation
  if (isValidRoofType(draftData.roofType)) {
    sanitized.roofType = draftData.roofType;
  }

  // Status validation
  if (isValidReportStatus(draftData.status)) {
    sanitized.status = draftData.status;
  }

  // Condition notes
  if (typeof draftData.conditionNotes === 'string') {
    sanitized.conditionNotes = draftData.conditionNotes.trim();
  }

  // Arrays with item validation
  sanitized.issuesFound = validateArray(draftData.issuesFound, isValidIssue);
  sanitized.recommendedActions = validateArray(
    draftData.recommendedActions,
    isValidRecommendedAction
  );

  // Image URL
  if (typeof draftData.roofImageUrl === 'string' && draftData.roofImageUrl.trim().length > 0) {
    try {
      new URL(draftData.roofImageUrl);
      sanitized.roofImageUrl = draftData.roofImageUrl.trim();
    } catch {
      // Invalid URL, skip it
    }
  }

  // Roof image pins
  if (Array.isArray(draftData.roofImagePins)) {
    sanitized.roofImagePins = draftData.roofImagePins.filter(
      (pin: any) =>
        typeof pin === 'object' &&
        pin !== null &&
        typeof pin.id === 'string' &&
        typeof pin.x === 'number' &&
        !isNaN(pin.x) &&
        pin.x >= 0 &&
        pin.x <= 100 &&
        typeof pin.y === 'number' &&
        !isNaN(pin.y) &&
        pin.y >= 0 &&
        pin.y <= 100
    );
  }

  // Boolean fields
  if (typeof draftData.isShared === 'boolean') {
    sanitized.isShared = draftData.isShared;
  }

  if (typeof draftData.isOffer === 'boolean') {
    sanitized.isOffer = draftData.isOffer;
  }

  // Prior report ID
  if (typeof draftData.priorReportId === 'string' && draftData.priorReportId.trim().length > 0) {
    sanitized.priorReportId = draftData.priorReportId.trim();
  }

  // Appointment ID
  if (typeof draftData.appointmentId === 'string' && draftData.appointmentId.trim().length > 0) {
    sanitized.appointmentId = draftData.appointmentId.trim();
  }

  return sanitized;
}

/**
 * Validate step number is within valid range
 */
export function validateStepNumber(
  step: number | string | null | undefined,
  totalSteps: number
): number {
  const stepNum = safeParseInt(step, 1, totalSteps);
  return stepNum !== undefined ? stepNum : 1;
}

/**
 * Validate and sanitize roof image pins
 */
export function validateRoofPins(
  pins: any[]
): Array<{ id: string; x: number; y: number; [key: string]: any }> {
  if (!Array.isArray(pins)) {
    return [];
  }

  return pins
    .filter(
      (pin: any) =>
        typeof pin === 'object' &&
        pin !== null &&
        typeof pin.id === 'string' &&
        typeof pin.x === 'number' &&
        !isNaN(pin.x) &&
        typeof pin.y === 'number' &&
        !isNaN(pin.y)
    )
    .map((pin: any) => ({
      ...pin,
      x: Math.max(0, Math.min(100, pin.x)),
      y: Math.max(0, Math.min(100, pin.y)),
    }));
}
