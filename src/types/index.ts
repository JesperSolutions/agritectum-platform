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
}

export interface Employee {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

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
  duration: number;      // Duration in minutes (default: 120)
  
  // Status and workflow
  status: AppointmentStatus;
  reportId?: string; // Links to report once inspection starts
  
  // Details
  title: string;                  // e.g., "Roof Inspection - Åkergatan 15"
  description?: string;           // Admin notes for inspector
  inspectorNotes?: string;        // Inspector's post-appointment notes
  appointmentType?: 'inspection' | 'follow_up' | 'estimate' | 'other';
  
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
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType?: 'individual' | 'company'; // Customer type: individual or company
  buildingAddress?: string; // Building address for company customers (when different from main address)
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

export type RoofType = 'tile' | 'metal' | 'shingle' | 'slate' | 'flat' | 'other';

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

export type OfferStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'awaiting_response'
  | 'expired';

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

export interface Building {
  id: string;
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
}

// Scheduled Visit Types (extends Appointment)

export type ScheduledVisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

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
  duration: number;      // Duration in minutes (default: 120)
  
  // Status and workflow
  status: ScheduledVisitStatus;
  reportId?: string; // Links to report once inspection starts
  
  // Details
  title: string;                  // e.g., "Roof Inspection - Åkergatan 15"
  description?: string;           // Admin notes for inspector
  inspectorNotes?: string;        // Inspector's post-visit notes
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

export interface ServiceAgreement {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  customerPhone?: string;
  branchId: string;
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