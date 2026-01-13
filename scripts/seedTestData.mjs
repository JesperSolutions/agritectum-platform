#!/usr/bin/env node

/**
 * Firebase Seeding Script
 * Creates test user account with buildings and reports
 * 
 * Usage: node scripts/seedTestData.mjs
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { 
  getFirestore, 
  setDoc, 
  doc,
  writeBatch 
} from 'firebase/firestore';

// Firebase config - update with your project details
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "agritectum-platform.firebaseapp.com",
  projectId: "agritectum-platform",
  storageBucket: "agritectum-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};

// Test data
const testUserDK = {
  uid: 'test-user-dk-001',
  email: 'test@agritectum.dk',
  password: 'TestUser123!',
  displayName: 'Test Bruger',
  branchId: 'agritectum-danmark',
  role: 'inspector',
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

const testReportDK1 = {
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
  isShared: false,
};

const testReportDK2 = {
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
  isShared: false,
};

async function seedTestData() {
  try {
    console.log('🌱 Starting Firebase seeding...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Create test user
    console.log('👤 Creating test user account...');
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        testUserDK.email,
        testUserDK.password
      );
      console.log('✅ User created:', testUserDK.email);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  User already exists:', testUserDK.email);
        console.log('   Proceeding to update data...\n');
        userCredential = { user: { uid: testUserDK.uid } };
      } else {
        throw error;
      }
    }

    const userId = userCredential.user.uid;

    // Use batch write for efficiency
    const batch = writeBatch(db);

    // Store user profile
    console.log('📝 Storing user profile...');
    batch.set(doc(db, 'users', userId), {
      ...testUserDK,
      uid: userId,
      createdAt: new Date(testUserDK.createdAt),
    });

    // Store customer
    console.log('🏢 Creating test customer...');
    batch.set(doc(db, 'customers', testCustomerDK.id), {
      ...testCustomerDK,
      createdAt: new Date(testCustomerDK.createdAt),
    });

    // Store buildings
    console.log('🏭 Creating test buildings...');
    batch.set(doc(db, 'buildings', testBuildingDK1.id), {
      ...testBuildingDK1,
      createdAt: new Date(testBuildingDK1.createdAt),
      lastInspection: new Date(testBuildingDK1.lastInspection),
    });

    batch.set(doc(db, 'buildings', testBuildingDK2.id), {
      ...testBuildingDK2,
      createdAt: new Date(testBuildingDK2.createdAt),
      lastInspection: new Date(testBuildingDK2.lastInspection),
    });

    // Store reports
    console.log('📊 Creating test reports...');
    batch.set(doc(db, 'reports', testReportDK1.id), {
      ...testReportDK1,
      inspectionDate: new Date(testReportDK1.inspectionDate),
      createdAt: new Date(testReportDK1.createdAt),
      updatedAt: new Date(testReportDK1.updatedAt),
      offerValidUntil: new Date(testReportDK1.offerValidUntil),
    });

    batch.set(doc(db, 'reports', testReportDK2.id), {
      ...testReportDK2,
      inspectionDate: new Date(testReportDK2.inspectionDate),
      createdAt: new Date(testReportDK2.createdAt),
      updatedAt: new Date(testReportDK2.updatedAt),
      offerValidUntil: new Date(testReportDK2.offerValidUntil),
    });

    // Commit batch
    console.log('💾 Committing to Firebase...');
    await batch.commit();

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Test Account Details:');
    console.log('   Email: test@agritectum.dk');
    console.log('   Password: TestUser123!');
    console.log('   Branch: Agritectum Danmark');
    console.log('   Role: Inspector\n');
    console.log('📚 Data created:');
    console.log('   ✓ 1 User account');
    console.log('   ✓ 1 Customer (Test Kunde A/S)');
    console.log('   ✓ 2 Buildings (Kontorhotel + Lager)');
    console.log('   ✓ 2 Reports (with findings & recommendations)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedTestData();
