/**
 * Test data for Danish Agritectum branch
 * Use this to seed a test user account with buildings and reports
 */

import { Building, Report, Customer } from '../types';

// Test Customer
export const testCustomerDK: Customer = {
  id: 'customer-test-dk-001',
  name: 'Test Kunde A/S',
  email: 'kontakt@testkunde.dk',
  phone: '+4540123456',
  address: 'Nørregade 15, 1165 København K',
  city: 'København',
  postalCode: '1165',
  country: 'Danmark',
  branchId: 'agritectum-danmark',
  status: 'active',
  createdAt: '2025-06-15',
  createdBy: 'system',
  totalReports: 2,
  totalRevenue: 53500,
  contactPerson: 'Henrik Andersen',
};

// Test Buildings
export const testBuildingDK1: Building = {
  id: 'building-test-dk-001',
  customerId: 'customer-test-dk-001',
  address: 'Nørregade 15, 1165 København K',
  buildingType: 'commercial',
  roofType: 'slate',
  branchId: 'agritectum-danmark',
  createdAt: '2025-06-15',
  createdBy: 'test-user-dk-001',
};

export const testBuildingDK2: Building = {
  id: 'building-test-dk-002',
  customerId: 'customer-test-dk-001',
  address: 'Banemarksvej 45, 2100 København Ø',
  buildingType: 'industrial',
  roofType: 'flat',
  branchId: 'agritectum-danmark',
  createdAt: '2025-07-20',
  createdBy: 'test-user-dk-001',
};

// Test Reports
export const testReportDK1: Report = {
  id: 'report-test-dk-001',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-001',
  createdBy: 'test-user-dk-001',
  createdByName: 'Test Bruger',
  branchId: 'agritectum-danmark',
  roofType: 'slate',
  inspectionDate: '2025-12-01',
  createdAt: '2025-12-02',
  lastEdited: '2025-12-02',
  status: 'completed',
  customerName: 'Test Kunde A/S',
  customerAddress: 'Nørregade 15, 1165 København K',
  conditionNotes: 'Grundig inspektion af tag, facader og indvendige systemer',
  issuesFound: [
    {
      id: 'issue-1',
      title: 'Mindre revner i tagbeklædning',
      description: 'Observeret 3 mindre revner i slatstakket på nordsiden',
      severity: 'medium',
      type: 'damage',
      location: 'Roof - north side',
      images: [],
    },
  ],
  recommendedActions: [
    {
      id: 'action-1',
      description: 'Reparér de identificerede revner før vinteren',
      priority: 'high',
      urgency: 'short_term',
      estimatedCost: 8500,
    },
  ],
  images: [],
  offerValue: 8500,
  offerValidUntil: '2026-01-13',
  isOffer: true,
  isShared: false,
};

export const testReportDK2: Report = {
  id: 'report-test-dk-002',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-002',
  createdBy: 'test-user-dk-001',
  createdByName: 'Test Bruger',
  branchId: 'agritectum-danmark',
  roofType: 'flat',
  inspectionDate: '2025-11-15',
  createdAt: '2025-11-18',
  lastEdited: '2025-11-18',
  status: 'completed',
  customerName: 'Test Kunde A/S',
  customerAddress: 'Banemarksvej 45, 2100 København Ø',
  conditionNotes: 'Omfattende inspektion af industriel lagerbygning',
  issuesFound: [
    {
      id: 'issue-2',
      title: 'Slidt gulvbelægning i lagerhal',
      description: 'Gulvbelægningen viser tegn på betydelig slitage',
      severity: 'medium',
      type: 'wear',
      location: 'Warehouse floor - area B',
      images: [],
    },
  ],
  recommendedActions: [
    {
      id: 'action-2',
      description: 'Reparér eller forny gulvbelægningen inden 6 måneder',
      priority: 'medium',
      urgency: 'long_term',
      estimatedCost: 45000,
    },
  ],
  images: [],
  offerValue: 45000,
  offerValidUntil: '2026-02-18',
  isOffer: true,
  isShared: false,
};

// Test User Account
export const testUserDK = {
  uid: 'test-user-dk-001',
  email: 'test@agritectum.dk',
  password: 'TestUser123!',
  displayName: 'Test Bruger',
  photoURL: null,
  branchId: 'agritectum-danmark',
  role: 'inspector',
  createdAt: '2025-06-01',
  lastLogin: new Date().toISOString(),
  preferences: {
    language: 'da',
    currency: 'DKK',
  },
};
