/**
 * Test data for Danish Agritectum branch
 * Use this to seed a test user account with buildings and reports
 */

import { User, Building, Report, Customer } from '../types';

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
  createdAt: new Date('2025-06-15'),
  contactPerson: 'Henrik Andersen',
};

// Test Buildings
export const testBuildingDK1: Building = {
  id: 'building-test-dk-001',
  customerId: 'customer-test-dk-001',
  name: 'Kontorhotel København',
  address: 'Nørregade 15, 1165 København K',
  buildingType: 'commercial',
  constructionYear: 2010,
  squareMeters: 2500,
  stories: 6,
  roofType: 'slate',
  status: 'active',
  branchId: 'agritectum-danmark',
  createdAt: new Date('2025-06-15'),
  lastInspection: new Date('2025-12-01'),
};

export const testBuildingDK2: Building = {
  id: 'building-test-dk-002',
  customerId: 'customer-test-dk-001',
  name: 'Lager og Logistik',
  address: 'Banemarksvej 45, 2100 København Ø',
  buildingType: 'industrial',
  constructionYear: 2005,
  squareMeters: 4200,
  stories: 2,
  roofType: 'flat',
  status: 'active',
  branchId: 'agritectum-danmark',
  createdAt: new Date('2025-07-20'),
  lastInspection: new Date('2025-11-15'),
};

// Test Reports
export const testReportDK1: Report = {
  id: 'report-test-dk-001',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-001',
  inspectorId: 'test-user-dk-001',
  branchId: 'agritectum-danmark',
  reportType: 'standard',
  inspectionDate: new Date('2025-12-01'),
  createdAt: new Date('2025-12-02'),
  updatedAt: new Date('2025-12-02'),
  status: 'completed',
  title: 'Rutinekontrol - Kontorhotel København',
  description: 'Grundig inspektion af tag, facader og indvendige systemer',
  issuesFound: [
    {
      id: 'issue-1',
      title: 'Mindre revner i tagbeklædning',
      description: 'Observeret 3 mindre revner i slatstakket på nordsiden',
      severity: 'medium',
      type: 'crack',
      location: 'Roof - north side',
      images: [],
      coordinates: { lat: 55.6761, lon: 12.5683 },
    },
  ],
  recommendedActions: [
    {
      id: 'action-1',
      title: 'Lokale reparationer af revner',
      description: 'Reparér de identificerede revner før vinteren',
      priority: 'high',
      urgency: 'medium',
      estimatedCost: 8500,
      relatedIssueId: 'issue-1',
    },
  ],
  images: [],
  offerValue: 8500,
  offerValidUntil: new Date('2026-01-13'),
  status: 'completed',
  isOffer: true,
  isShared: false,
};

export const testReportDK2: Report = {
  id: 'report-test-dk-002',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-002',
  inspectorId: 'test-user-dk-001',
  branchId: 'agritectum-danmark',
  reportType: 'standard',
  inspectionDate: new Date('2025-11-15'),
  createdAt: new Date('2025-11-18'),
  updatedAt: new Date('2025-11-18'),
  status: 'completed',
  title: 'Inspektion - Lager og Logistik',
  description: 'Omfattende inspektion af industriel lagerbygning',
  issuesFound: [
    {
      id: 'issue-2',
      title: 'Slidt gulvbelægning i lagerhal',
      description: 'Gulvbelægningen viser tegn på betydelig slitage',
      severity: 'medium',
      type: 'wear',
      location: 'Warehouse floor - area B',
      images: [],
      coordinates: { lat: 55.7088, lon: 12.5919 },
    },
  ],
  recommendedActions: [
    {
      id: 'action-2',
      title: 'Gulvbelægning - punktvis reparation',
      description: 'Reparér eller forny gulvbelægningen inden 6 måneder',
      priority: 'medium',
      urgency: 'low',
      estimatedCost: 45000,
      relatedIssueId: 'issue-2',
    },
  ],
  images: [],
  offerValue: 45000,
  offerValidUntil: new Date('2026-02-18'),
  status: 'completed',
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
  createdAt: new Date('2025-06-01'),
  lastLogin: new Date(),
  preferences: {
    language: 'da',
    currency: 'DKK',
  },
};
