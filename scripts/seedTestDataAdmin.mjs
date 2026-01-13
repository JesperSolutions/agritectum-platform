#!/usr/bin/env node

/**
 * Firebase Admin Seeding Script
 * Creates test user with buildings and reports using Admin SDK
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Load service account from Firebase console download
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(process.cwd(), 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  console.log('   Please download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// Test data
const testUserDK = {
  email: 'test@agritectum.dk',
  password: 'TestUser123!',
  displayName: 'Test Kunde',
  uid: 'test-user-dk-001',
  role: 'customer',
  userType: 'customer',
  companyId: 'customer-test-dk-001',
  createdAt: new Date('2025-06-01'),
  preferences: {
    language: 'da',
    currency: 'DKK',
  },
};

const testCustomerDK = {
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

const testBuildingDK1 = {
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

const testBuildingDK2 = {
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

const testBuildingDK3 = {
  id: 'building-test-dk-003',
  customerId: 'customer-test-dk-001',
  name: 'Boligblok Vesterbro',
  address: 'Istegade 78, 1650 København V',
  buildingType: 'residential',
  constructionYear: 1985,
  squareMeters: 6800,
  stories: 5,
  roofType: 'clay_tile',
  status: 'active',
  branchId: 'agritectum-danmark',
  createdAt: new Date('2025-08-10'),
  lastInspection: new Date('2025-10-20'),
};

const testBuildingDK4 = {
  id: 'building-test-dk-004',
  customerId: 'customer-test-dk-001',
  name: 'Handelscenter Amager',
  address: 'Amagerbrogade 120, 2300 København S',
  buildingType: 'commercial',
  constructionYear: 1998,
  squareMeters: 8500,
  stories: 3,
  roofType: 'flat',
  status: 'active',
  branchId: 'agritectum-danmark',
  createdAt: new Date('2025-05-12'),
  lastInspection: new Date('2025-12-10'),
};

const testBuildingDK5 = {
  id: 'building-test-dk-005',
  customerId: 'customer-test-dk-001',
  name: 'Fabrik Kastelsvej',
  address: 'Kastelsvej 45, 2100 København Ø',
  buildingType: 'industrial',
  constructionYear: 1975,
  squareMeters: 12000,
  stories: 2,
  roofType: 'corrugated_metal',
  status: 'active',
  branchId: 'agritectum-danmark',
  createdAt: new Date('2025-04-05'),
  lastInspection: new Date('2025-09-25'),
};

const testReportDK1 = {
  id: 'report-test-dk-001',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-001',
  inspectorId: 'inspector-001', // Reference to inspector who created the report
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
    },
  ],
  offerValue: 8500,
  offerValidUntil: new Date('2026-01-13'),
  isOffer: true,
  isShared: true, // Shared with customer
};

const testReportDK2 = {
  id: 'report-test-dk-002',
  customerId: 'customer-test-dk-001',
  buildingId: 'building-test-dk-002',
  inspectorId: 'inspector-001', // Reference to inspector who created the report
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
    },
  ],
  offerValue: 45000,
  offerValidUntil: new Date('2026-02-18'),
  isOffer: true,
  isShared: true, // Shared with customer
};

async function seedTestData() {
  try {
    console.log('🌱 Starting Firebase Admin seeding...\n');

    // Create test user
    console.log('👤 Creating test user account...');
    try {
      await auth.createUser({
        uid: testUserDK.uid,
        email: testUserDK.email,
        password: testUserDK.password,
        displayName: testUserDK.displayName,
      });
      console.log('✅ User created:', testUserDK.email);
      
      // Set custom claims for customer user
      console.log('🔐 Setting custom claims...');
      await auth.setCustomUserClaims(testUserDK.uid, {
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
        companyId: testUserDK.companyId,
      });
      console.log('✅ Custom claims set');
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.log('⚠️  User already exists:', testUserDK.email);
        // Try to set custom claims on existing user
        try {
          await auth.setCustomUserClaims(testUserDK.uid, {
            role: 'customer',
            permissionLevel: -1,
            userType: 'customer',
            companyId: testUserDK.companyId,
          });
          console.log('✅ Custom claims set on existing user');
        } catch (claimsError) {
          console.log('⚠️  Could not set custom claims:', claimsError.message);
        }
      } else if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Email already in use:', testUserDK.email);
      } else {
        throw error;
      }
    }

    // Store user profile
    console.log('📝 Storing user profile...');
    await db.collection('users').doc(testUserDK.uid).set({
      uid: testUserDK.uid,
      email: testUserDK.email,
      displayName: testUserDK.displayName,
      role: testUserDK.role,
      userType: testUserDK.userType,
      companyId: testUserDK.companyId,
      permissionLevel: -1,
      createdAt: admin.firestore.Timestamp.fromDate(testUserDK.createdAt),
      preferences: testUserDK.preferences,
    });
    console.log('✅ User profile stored');

    // Store customer
    console.log('🏢 Creating test customer...');
    await db.collection('customers').doc(testCustomerDK.id).set({
      ...testCustomerDK,
      createdAt: admin.firestore.Timestamp.fromDate(testCustomerDK.createdAt),
    });
    console.log('✅ Customer created');

    // Store buildings
    console.log('🏭 Creating test buildings...');
    await db.collection('buildings').doc(testBuildingDK1.id).set({
      ...testBuildingDK1,
      createdAt: admin.firestore.Timestamp.fromDate(testBuildingDK1.createdAt),
      lastInspection: admin.firestore.Timestamp.fromDate(testBuildingDK1.lastInspection),
    });
    console.log('✅ Building 1 created: Kontorhotel København');

    await db.collection('buildings').doc(testBuildingDK2.id).set({
      ...testBuildingDK2,
      createdAt: admin.firestore.Timestamp.fromDate(testBuildingDK2.createdAt),
      lastInspection: admin.firestore.Timestamp.fromDate(testBuildingDK2.lastInspection),
    });
    console.log('✅ Building 2 created: Lager og Logistik');

    await db.collection('buildings').doc(testBuildingDK3.id).set({
      ...testBuildingDK3,
      createdAt: admin.firestore.Timestamp.fromDate(testBuildingDK3.createdAt),
      lastInspection: admin.firestore.Timestamp.fromDate(testBuildingDK3.lastInspection),
    });
    console.log('✅ Building 3 created: Boligblok Vesterbro');

    await db.collection('buildings').doc(testBuildingDK4.id).set({
      ...testBuildingDK4,
      createdAt: admin.firestore.Timestamp.fromDate(testBuildingDK4.createdAt),
      lastInspection: admin.firestore.Timestamp.fromDate(testBuildingDK4.lastInspection),
    });
    console.log('✅ Building 4 created: Handelscenter Amager');

    await db.collection('buildings').doc(testBuildingDK5.id).set({
      ...testBuildingDK5,
      createdAt: admin.firestore.Timestamp.fromDate(testBuildingDK5.createdAt),
      lastInspection: admin.firestore.Timestamp.fromDate(testBuildingDK5.lastInspection),
    });
    console.log('✅ Building 5 created: Fabrik Kastelsvej');

    // Store reports
    console.log('📊 Creating test reports...');
    await db.collection('reports').doc(testReportDK1.id).set({
      ...testReportDK1,
      inspectionDate: admin.firestore.Timestamp.fromDate(testReportDK1.inspectionDate),
      createdAt: admin.firestore.Timestamp.fromDate(testReportDK1.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(testReportDK1.updatedAt),
      offerValidUntil: admin.firestore.Timestamp.fromDate(testReportDK1.offerValidUntil),
    });
    console.log('✅ Report 1 created');

    await db.collection('reports').doc(testReportDK2.id).set({
      ...testReportDK2,
      inspectionDate: admin.firestore.Timestamp.fromDate(testReportDK2.inspectionDate),
      createdAt: admin.firestore.Timestamp.fromDate(testReportDK2.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(testReportDK2.updatedAt),
      offerValidUntil: admin.firestore.Timestamp.fromDate(testReportDK2.offerValidUntil),
    });
    console.log('✅ Report 2 created');

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Test Customer Account Details:');
    console.log('   Email: test@agritectum.dk');
    console.log('   Password: TestUser123!');
    console.log('   Role: Customer');
    console.log('   Access: Portal Dashboard (/portal/dashboard)\n');
    console.log('📚 Data created:');
    console.log('   ✓ 1 Customer user account (permissionLevel: -1)');
    console.log('   ✓ 1 Company (Test Kunde A/S)');
    console.log('   ✓ 5 Buildings:');
    console.log('     - Kontorhotel København (2500 m², commercial, slate)');
    console.log('     - Lager og Logistik (4200 m², industrial, flat)');
    console.log('     - Boligblok Vesterbro (6800 m², residential, clay tile)');
    console.log('     - Handelscenter Amager (8500 m², commercial, flat)');
    console.log('     - Fabrik Kastelsvej (12000 m², industrial, corrugated)');
    console.log('   ✓ 2 Reports (with findings & recommendations)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedTestData();
