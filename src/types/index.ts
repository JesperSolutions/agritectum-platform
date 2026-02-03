export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  branchId?: string;
  branchIds?: string[]; // For superadmin access to multiple branches
  createdAt: string;
  lastLogin?: string;
  // Customer user fields
  userType?: 'internal' | 'customer';
  companyId?: string; // For customer users linked to companies
  customerProfile?: {
    phone?: string;
    address?: string;
    companyName?: string;
  };
}

export type UserRole = 'inspector' | 'branchAdmin' | 'superadmin' | 'customer';

export type PermissionLevel = -1 | 0 | 1 | 2; // -1=customer, 0=inspector, 1=branch admin, 2=super admin

// Permission level constants
export const PERMISSION_LEVELS = {
  CUSTOMER: -1,
  INSPECTOR: 0,
  BRANCH_ADMIN: 1,
  SUPER_ADMIN: 2,
} as const;

// Helper functions for permission checking
export const hasPermission = (
  userLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean => {
  return userLevel >= requiredLevel;
};

export const canAccessAllBranches = (permissionLevel: PermissionLevel): boolean => {
  return permissionLevel >= PERMISSION_LEVELS.SUPER_ADMIN;
};

export const canAccessBranch = (
  userLevel: PermissionLevel,
  userBranchId: string | undefined,
  targetBranchId: string
): boolean => {
  if (canAccessAllBranches(userLevel)) return true;
  return userBranchId === targetBranchId;
};

export const canManageUsers = (permissionLevel: PermissionLevel): boolean => {
  return permissionLevel >= PERMISSION_LEVELS.BRANCH_ADMIN;
};

export const canManageBranches = (permissionLevel: PermissionLevel): boolean => {
  return permissionLevel >= PERMISSION_LEVELS.SUPER_ADMIN;
};

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
  // Danish business requirements
  cvrNumber?: string;
  vatNumber?: string;
  businessType?: string;
  industryCode?: string;
  registrationDate?: string;
  bankAccount?: string;
  authorizedSignatory?: string;
  licenseNumbers?: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: string;
  };
  // Additional business information
  website?: string;
  description?: string;
  isActive: boolean;
  parentCompany?: string;
  // Compliance and certifications
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
  }>;
  // Contact information
  contactPerson?: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  // Regional information
  region?: string;
  municipality?: string;
  postalCode?: string;
  country: string;
  // Currency configuration for this branch
  currency?: string; // Currency code (e.g., 'DKK', 'SEK', 'EUR', 'NOK'). If not set, will be determined by country.
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  customerType?: 'individual' | 'company'; // Customer type: individual or company
  buildingAddress?: string; // Building address for company customers (when different from main address)
  parentCompanyId?: string; // Link to parent company (for sub-companies)
  createdAt: string;
  createdBy: string;
  branchId?: string; // Branch that owns this customer
  lastReportDate?: string;
  totalReports: number;
  totalRevenue: number;
  notes?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

// Note: Employee interface removed - use User interface instead
// All employee data is stored in /users collection

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  branchId: string;

  // Customer information
  customerId?: string; // Optional link to customers collection
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;

  // Assignment information
  assignedInspectorId: string;
  assignedInspectorName: string;

  // Scheduling information
  scheduledDate: string; // ISO date string: "2025-10-02"
  scheduledTime: string; // Time string: "10:00"
  duration: number; // Duration in minutes (default: 120)

  // Status and workflow
  status: AppointmentStatus;
  reportId?: string; // Links to report once inspection starts

  // Details
  title: string; // e.g., "Roof Inspection - Åkergatan 15"
  description?: string; // Admin notes for inspector
  inspectorNotes?: string; // Inspector's post-appointment notes
  appointmentType?: 'inspection' | 'follow_up' | 'estimate' | 'other';

  // Customer response (for acceptance/denial workflow)
  customerResponse?: 'pending' | 'accepted' | 'rejected';
  customerResponseAt?: string;
  customerResponseReason?: string;
  scheduledVisitId?: string; // Link to scheduledVisit

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Report {
  id: string;
  createdBy: string;
  createdByName: string;
  branchId: string;
  inspectionDate: string;
  customerId?: string; // Link to customers collection
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType?: 'individual' | 'company'; // Customer type: individual or company
  buildingId: string; // Required: Link to buildings collection - all reports must be associated with a building
  buildingName?: string; // Building name (denormalized for quick access and display)
  buildingAddress?: string; // Building address (denormalized for quick access, but buildingId is source of truth)
  buildingSnapshot?: BuildingSnapshot; // Snapshot of building data at time of report creation (for audit trail)
  roofType: RoofType;
  roofAge?: number;
  roofSize?: number; // Total roof area in square meters (optional)
  conditionNotes: string;
  issuesFound: Issue[];
  recommendedActions: RecommendedAction[];
  status: ReportStatus;
  createdAt: string;
  lastEdited: string;
  isShared: boolean;
  isPublic?: boolean; // Enables public access without authentication (used in firestore.rules)
  pdfLink?: string;
  images?: string[];
  inspectionDuration?: number; // minutes
  inspectionChecklist?: Record<string, InspectionChecklistItem>; // Inspection checklist items with status and comments
  priorReportId?: string; // Link to previous report/offer for the same customer
  appointmentId?: string; // Link to appointment this report was created from
  isOffer: boolean; // Indicates if this is an offer being sent to customer
  offerValue?: number; // Estimated value of the offer
  offerValidUntil?: string; // Offer expiration date
  offerId?: string; // Link to associated offer if exists
  offerCreatedAt?: string; // When the offer was created
  offerStatus?: OfferStatus; // Denormalized offer status for quick access
  roofImageUrl?: string; // Roof overview image URL
  roofImagePins?: RoofPinMarker[]; // Pins marking issues on roof image
  roofMapMarkers?: MapMarker[]; // Markers on the satellite map linked to issues
  // Cost estimation fields
  laborCost?: number; // Labor cost in SEK
  materialCost?: number; // Material cost in SEK
  travelCost?: number; // Travel cost in SEK
  overheadCost?: number; // Overhead cost in SEK
  profitMargin?: number; // Profit margin percentage (optional, for future use)
}

export interface InspectionChecklistItem {
  id: string;
  status: 'pass' | 'fail' | 'needs_review' | 'na';
  comment?: string;
}

export interface RoofPinMarker {
  id: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  issueId?: string;
  severity: IssueSeverity;
}

export interface MapMarker {
  id: string;
  lat: number; // Latitude coordinate
  lon: number; // Longitude coordinate
  issueId?: string; // Link to an issue
  severity: IssueSeverity;
}

export type RoofType =
  | 'tile'
  | 'metal'
  | 'shingle'
  | 'slate'
  | 'flat_bitumen_2layer'
  | 'flat_bitumen_3layer'
  | 'flat_rubber'
  | 'flat_pvc'
  | 'flat_tpo'
  | 'flat_epdm'
  | 'flat'
  | 'other';

export type ReportStatus =
  | 'draft'
  | 'completed'
  | 'sent'
  | 'shared'
  | 'archived'
  | 'offer_sent'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_expired';

export interface Issue {
  id: string;
  title?: string; // Issue title/name
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  location: string;
  imageUrl?: string; // Deprecated: use images array instead
  images?: string[]; // Array of image URLs
}

export type IssueType =
  | 'leak'
  | 'damage'
  | 'wear'
  | 'structural'
  | 'ventilation'
  | 'gutters'
  | 'flashing'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RecommendedAction {
  id: string;
  priority: ActionPriority;
  description: string;
  estimatedCost?: number;
  urgency: ActionUrgency;
}

export type ActionPriority = 'low' | 'medium' | 'high';
export type ActionUrgency = 'immediate' | 'short_term' | 'long_term';

export interface CustomClaims {
  role: UserRole;
  permissionLevel: PermissionLevel;
  branchId?: string;
  branchIds?: string[];
  userType?: 'internal' | 'customer';
  companyId?: string;
}

export interface OfflineReport extends Omit<Report, 'id'> {
  localId: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt?: string;
}

// Offer and Acceptance Flow Types

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'awaiting_response' | 'expired';

export interface Offer {
  id: string;
  reportId: string; // Link to inspection report
  branchId: string;
  createdBy: string;
  createdByName: string;

  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress: string;

  // Offer details
  title: string;
  description: string;
  totalAmount: number;
  currency: string; // Default: 'DKK'

  // Pricing breakdown
  laborCost: number;
  materialCost: number;
  travelCost: number;
  overheadCost: number;
  profitMargin: number;

  // Status and workflow
  status: OfferStatus;
  statusHistory: OfferStatusHistory[];

  // Validity and timing
  validUntil: string; // ISO date string
  sentAt: string;
  respondedAt?: string;

  // Communication
  publicLink: string; // Unique URL for customer access
  emailSent: boolean;
  followUpAttempts: number;
  lastFollowUpAt?: string;

  // Response
  customerResponse?: 'accept' | 'reject';
  customerResponseReason?: string;
  customerResponseAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface OfferStatusHistory {
  status: OfferStatus;
  timestamp: string;
  changedBy: string;
  changedByName: string;
  reason?: string;
  notes?: string;
}

export interface OfferCommunication {
  id: string;
  offerId: string;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  errorMessage?: string;
}

export interface OfferNotificationSettings {
  offerId: string;
  followUpReminder: boolean; // Default: true
  followUpDays: number; // Default: 7
  escalationEnabled: boolean; // Default: true
  escalationDays: number; // Default: 14
  expirationWarning: boolean; // Default: true
  expirationWarningDays: number; // Default: 3
}

// Company Types

export interface Company {
  id: string;
  name: string;
  cvrNumber?: string;
  vatNumber?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  createdBy: string;
  branchId?: string; // Service provider branch
  isActive: boolean;
}

// Building Types

/**
 * ESG Metrics interface for building-level sustainability tracking
 * Adapted from agritectum-roof-calculator/src/types/esg.ts
 */
export interface ESGMetrics {
  sustainabilityScore: number; // 0-100
  carbonFootprint: number; // kg CO₂
  solarPotential: number; // kWh/year
  recyclingPotential: number; // 0-100%
  annualCO2Offset: number; // kg CO₂/year
  neutralityTimeline: number | null; // years to CO2 neutrality
  sdgAlignment: string[]; // Array of SDG goals addressed
  sdgScore: number; // 0-100
  rating: string; // Sustainability rating
  lastCalculated?: string; // ISO date
  // Additional calculated metrics for ESG reporting
  co2ReductionKgPerYear?: number; // kg CO₂/year reduction
  energySavingsKwhPerYear?: number; // kWh/year energy savings
  waterManagementLitersPerYear?: number; // L/year water management
}

export interface BuildingDocument {
  id: string; // Unique document ID
  fileName: string;
  fileSize: number; // Bytes
  fileType: string; // MIME type
  storagePath: string; // Path in Firebase Storage
  uploadedAt: string; // ISO timestamp
  uploadedBy: string; // User ID
}

export interface Building {
  id: string;
  name?: string; // Building name (e.g., "Main Office", "Warehouse")
  companyId?: string; // If owned by company
  customerId?: string; // If owned by individual customer
  address: string;
  buildingType?: 'residential' | 'commercial' | 'industrial';
  roofType?: RoofType;
  roofSize?: number; // m²
  latitude?: number;
  longitude?: number;
  createdAt: string;
  createdBy: string;
  branchId?: string;
  esgMetrics?: ESGMetrics; // Optional ESG metrics
  lastVerified?: string; // Last time building data was verified as accurate
  documents?: BuildingDocument[]; // Max 5 documents of 3MB each
}

// Building history snapshot for audit trail
export interface BuildingSnapshot {
  id: string;
  buildingId: string;
  address: string;
  buildingType?: 'residential' | 'commercial' | 'industrial';
  roofType?: RoofType;
  roofSize?: number;
  latitude?: number;
  longitude?: number;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
}

// Building ESG Improvements Types

export type ImprovementType =
  | 'green_roof' // Sedum/green roof
  | 'solar_panels' // Solar power
  | 'water_management' // Water retention/collection
  | 'insulation' // Enhanced insulation
  | 'cooling' // Cooling systems
  | 'biodiversity'; // Biodiversity enhancements

export interface RoofImprovement {
  type: ImprovementType;
  percentage: number; // 0-100% of roof area
  startYear: number; // When improvement starts (0 = immediate)
  costPerSqm: number; // Cost per square meter
  estimatedCost?: number; // Total estimated cost (calculated)
}

export interface ImprovementMetrics {
  totalCost: number;
  annualSavings: number;
  paybackPeriod: number;
  npv: number;
  irr: number;
  roi: number;
}

// ESG Service Report Types

/**
 * Roof division areas for ESG service reports
 * Based on the 4 areas from agritectum-roof-calculator project
 */
export interface RoofDivisionAreas {
  greenRoof: number; // Percentage allocated to Green Roof Area (uses "Green Roof System")
  noxReduction: number; // Percentage allocated to NOₓ Reduction Area (uses "Photocatalytic Coating")
  coolRoof: number; // Percentage allocated to Cool Roof Area (uses "White - Cool Roof Coating")
  socialActivities: number; // Percentage allocated to Social Activities Area (uses "Social Activities Area")
}

/**
 * ESG Service Report - Created by branch managers
 * Stores roof division data and calculated ESG metrics
 */
export interface ESGServiceReport {
  id: string;
  buildingId: string;
  branchId: string;
  createdBy: string; // Branch manager user ID
  createdAt: string;
  updatedAt: string;
  roofSize: number; // m² - Confirmed roof square meters
  divisions: RoofDivisionAreas; // Percentage allocation for each area (must sum to 100%)
  calculatedMetrics?: ESGMetrics; // Calculated ESG metrics
  isPublic: boolean; // Whether report is publicly accessible
  publicLinkId?: string; // Unique ID for public access (used in URL)
}

export interface BuildingImprovements {
  id: string;
  buildingId: string;
  roofArea: number; // Total roof area in m²
  improvements: RoofImprovement[];
  calculatedAt: string;
  calculatedBy: string;
  branchId: string;

  // Calculated metrics
  metrics: {
    totalCost: number;
    annualCO2Reduction: number;
    annualEnergySavings: number; // kWh
    annualWaterSavings: number; // m³
    paybackPeriod: number; // years
    roi10Year: number; // %
    sustainabilityScore: number; // 0-100
    neutralityTimeline: number | null; // years
  };

  // Scenario analysis
  scenarios: {
    optimistic: ImprovementMetrics;
    realistic: ImprovementMetrics;
    pessimistic: ImprovementMetrics;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Scheduled Visit Types (extends Appointment)

export type ScheduledVisitStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface ScheduledVisit {
  id: string;
  branchId: string;

  // Customer information
  customerId?: string; // Optional link to customers collection
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;

  // Building and company links
  buildingId?: string;
  companyId?: string;

  // Assignment information
  assignedInspectorId: string;
  assignedInspectorName: string;

  // Scheduling information
  scheduledDate: string; // ISO date string: "2025-10-02"
  scheduledTime: string; // Time string: "10:00"
  duration: number; // Duration in minutes (default: 120)

  // Status and workflow
  status: ScheduledVisitStatus;
  reportId?: string; // Links to report once inspection starts
  appointmentId?: string; // Link back to appointment

  // Customer response (for acceptance/denial workflow)
  customerResponse?: 'pending' | 'accepted' | 'rejected';
  customerResponseAt?: string;
  customerResponseReason?: string;
  publicToken?: string; // For public acceptance link

  // Details
  title: string; // e.g., "Roof Inspection - Åkergatan 15"
  description?: string; // Admin notes for inspector
  inspectorNotes?: string; // Inspector's post-visit notes
  visitType: 'inspection' | 'maintenance' | 'repair' | 'other';

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// Service Agreements Types

export interface ExternalServiceProvider {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  cvr?: string; // Danish company registration number
  
  // Ownership & Access
  addedByCustomerId: string;
  addedByCompanyId: string;
  isShared: boolean; // If true, other customers in same company can use this provider
  
  // Platform Integration Status
  invitationStatus: 'none' | 'invited' | 'accepted' | 'declined';
  invitedAt?: string; // ISO timestamp
  invitedBy?: string;
  platformBranchId?: string; // Set when provider joins platform
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ServiceAgreement {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Provider relationship - either internal branch OR external provider
  providerType: 'internal' | 'external';
  branchId?: string; // For internal providers (platform partners)
  externalProviderId?: string; // For external providers
  
  createdBy: string;
  createdByName: string;
  agreementType: 'maintenance' | 'inspection' | 'repair' | 'other';
  title: string;
  description?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  nextServiceDate: string; // ISO date - when next service is due
  serviceFrequency: 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'custom';
  serviceInterval?: number; // For custom frequency
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  autoRenew?: boolean; // Auto-renew agreement when it expires
  renewalTermMonths?: number; // Number of months for auto-renewal (defaults to 12)
  price?: number;
  currency?: string;
  notes?: string;
  // Building and company links
  buildingId?: string;
  companyId?: string;
  // Location for map
  latitude?: number;
  longitude?: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastServiceDate?: string;
  nextNotificationDate?: string; // When to send next notification
  // Public acceptance fields
  isPublic?: boolean; // Whether agreement is publicly accessible
  publicToken?: string; // Unique token for public access
  acceptedAt?: string; // ISO timestamp when accepted
  acceptedBy?: string; // Customer name who accepted
  acceptedByEmail?: string; // Customer email who accepted
  acceptedIpAddress?: string; // IP address at acceptance
  acceptanceSignature?: string; // Digital signature/confirmation
  termsAndConditions?: string; // Terms text
  termsDocuments?: string[]; // Array of document URLs (for future)
  // Paper version fields
  purpose?: string; // Aftalens formål
  serviceVisits?: {
    oneAnnual: boolean; // 1 årligt servicebesøg
    twoAnnual: boolean; // 2 årlige servicebesøg
  };
  standardServices?: string[]; // Array of selected standard services
  addons?: {
    skylights?: string[]; // Ovenlys & faldsikring options
    solar?: string[]; // Solceller options
    steel?: string[]; // Ståltag options
    sedum?: string[]; // Sedumtag options
  };
  pricingStructure?: {
    perRoof?: number; // Pris pr. år per tag
    perSquareMeter?: number; // Pris pr. år per m²
  };
  billingFrequency?: 'annual' | 'semi-annual'; // Årlig eller halvårlig betaling
  signatures?: {
    supplier?: string; // Leverandør navn eller billede URL
    customer?: string; // Kunde navn eller billede URL
    supplierImageUrl?: string; // Leverandør underskrift billede
    customerImageUrl?: string; // Kunde underskrift billede
  };
}

// Rejected Order Types
export interface RejectedOrder {
  id: string;
  appointmentId: string;
  scheduledVisitId?: string;
  customerId: string;
  customerName: string;
  branchId: string;
  rejectedAt: string;
  rejectedReason?: string;
  createdBy: string; // Branch manager who created original appointment
  createdAt: string;
}

// Notification types
export type NotificationType =
  | 'report_completed'
  | 'esg_report_completed'
  | 'service_agreement_created'
  | 'appointment_scheduled'
  | 'appointment_reminder'
  | 'system';

export interface Notification {
  id: string;
  userId: string; // User who receives the notification
  customerId?: string; // Customer ID (for customer users)
  type: NotificationType;
  title: string;
  message: string;
  link?: string; // URL to navigate to when clicked
  read: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: {
    reportId?: string;
    esgReportId?: string;
    serviceAgreementId?: string;
    appointmentId?: string;
    buildingId?: string;
  };
}
