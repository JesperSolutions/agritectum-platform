#!/usr/bin/env node

/**
 * Create QA Test Accounts
 * Creates a QA branch with inspector and customer accounts
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Load service account
const serviceAccountPath = 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// QA Branch data
const qaBranch = {
  id: 'qa-test-branch',
  name: 'QA Test Branch',
  address: 'Test Street 1, Copenhagen',
  phone: '+45 12 34 56 78',
  email: 'qa@agritectum.dk',
  isActive: true,
  country: 'Denmark',
  createdAt: new Date(),
  description: 'Branch for QA testing purposes',
};

// QA Inspector
const qaInspector = {
  uid: 'qa-inspector-001',
  email: 'qa.inspector@agritectum.dk',
  password: 'QAInspector2026!',
  displayName: 'QA Test Inspector',
  role: 'inspector',
  permissionLevel: 0,
  branchId: 'qa-test-branch',
};

// QA Customer company
const qaCustomer = {
  id: 'qa-customer-001',
  name: 'QA Test Company ApS',
  email: 'qa.company@test.dk',
  phone: '+45 98 76 54 32',
  address: 'Testgade 42, 2100 København Ø',
  city: 'København',
  postalCode: '2100',
  country: 'Danmark',
  branchId: 'qa-test-branch',
  status: 'active',
  createdAt: new Date(),
  contactPerson: 'QA Contact Person',
};

// QA Customer user
const qaCustomerUser = {
  uid: 'qa-customer-user-001',
  email: 'qa.customer@agritectum.dk',
  password: 'QACustomer2026!',
  displayName: 'QA Test Customer',
  role: 'customer',
  userType: 'customer',
  permissionLevel: -1,
  companyId: 'qa-customer-001',
};

// QA Buildings
const qaBuildings = [
  {
    id: 'qa-building-001',
    customerId: 'qa-customer-001',
    name: 'QA Office Building',
    address: 'Testgade 42, 2100 København Ø',
    buildingType: 'commercial',
    constructionYear: 2015,
    squareMeters: 1500,
    stories: 4,
    roofType: 'flat',
    status: 'active',
    branchId: 'qa-test-branch',
    createdAt: new Date(),
    lastInspection: new Date('2025-12-01'),
  },
  {
    id: 'qa-building-002',
    customerId: 'qa-customer-001',
    name: 'QA Warehouse',
    address: 'Industrivej 10, 2650 Hvidovre',
    buildingType: 'industrial',
    constructionYear: 2000,
    squareMeters: 3500,
    stories: 1,
    roofType: 'corrugated_metal',
    status: 'active',
    branchId: 'qa-test-branch',
    createdAt: new Date(),
    lastInspection: new Date('2025-11-15'),
  },
];

// QA Report
const qaReport = {
  id: 'qa-report-001',
  customerId: 'qa-customer-001',
  buildingId: 'qa-building-001',
  inspectorId: 'qa-inspector-001',
  branchId: 'qa-test-branch',
  reportType: 'standard',
  inspectionDate: new Date('2025-12-01'),
  createdAt: new Date('2025-12-02'),
  updatedAt: new Date('2025-12-02'),
  status: 'completed',
  title: 'QA Test Inspection Report',
  description: 'Test inspection report for QA purposes',
  customerName: 'QA Test Company ApS',
  customerAddress: 'Testgade 42, 2100 København Ø',
  issuesFound: [
    {
      id: 'issue-qa-1',
      title: 'Test Issue - Minor Wear',
      description: 'Minor wear observed on roof surface',
      severity: 'low',
      type: 'wear',
      location: 'Roof - Section A',
    },
  ],
  recommendedActions: [
    {
      id: 'action-qa-1',
      title: 'Routine Maintenance',
      description: 'Schedule routine maintenance within 6 months',
      priority: 'low',
      urgency: 'low',
      estimatedCost: 5000,
    },
  ],
  offerValue: 5000,
  offerValidUntil: new Date('2026-03-01'),
  isOffer: true,
  isShared: true,
  isPublic: false,
};

async function createQAAccounts() {
  try {
    console.log('🧪 Creating QA Test Accounts...\n');

    // 1. Create QA Branch
    console.log('🏢 Creating QA branch...');
    await db.collection('branches').doc(qaBranch.id).set({
      ...qaBranch,
      createdAt: admin.firestore.Timestamp.fromDate(qaBranch.createdAt),
    });
    console.log('✅ QA branch created\n');

    // 2. Create QA Inspector
    console.log('🔍 Creating QA inspector account...');
    try {
      await auth.deleteUser(qaInspector.uid);
    } catch (e) { /* User doesn't exist */ }
    
    await auth.createUser({
      uid: qaInspector.uid,
      email: qaInspector.email,
      password: qaInspector.password,
      displayName: qaInspector.displayName,
    });
    
    await auth.setCustomUserClaims(qaInspector.uid, {
      role: qaInspector.role,
      permissionLevel: qaInspector.permissionLevel,
      branchId: qaInspector.branchId,
    });
    
    await db.collection('users').doc(qaInspector.uid).set({
      uid: qaInspector.uid,
      email: qaInspector.email,
      displayName: qaInspector.displayName,
      role: qaInspector.role,
      permissionLevel: qaInspector.permissionLevel,
      branchId: qaInspector.branchId,
      createdAt: admin.firestore.Timestamp.now(),
    });
    console.log('✅ QA inspector created\n');

    // 3. Create QA Customer User
    console.log('👤 Creating QA customer account...');
    try {
      await auth.deleteUser(qaCustomerUser.uid);
    } catch (e) { /* User doesn't exist */ }
    
    await auth.createUser({
      uid: qaCustomerUser.uid,
      email: qaCustomerUser.email,
      password: qaCustomerUser.password,
      displayName: qaCustomerUser.displayName,
    });
    
    await auth.setCustomUserClaims(qaCustomerUser.uid, {
      role: qaCustomerUser.role,
      permissionLevel: qaCustomerUser.permissionLevel,
      userType: qaCustomerUser.userType,
      companyId: qaCustomerUser.companyId,
    });
    
    await db.collection('users').doc(qaCustomerUser.uid).set({
      uid: qaCustomerUser.uid,
      email: qaCustomerUser.email,
      displayName: qaCustomerUser.displayName,
      role: qaCustomerUser.role,
      userType: qaCustomerUser.userType,
      permissionLevel: qaCustomerUser.permissionLevel,
      companyId: qaCustomerUser.companyId,
      createdAt: admin.firestore.Timestamp.now(),
    });
    console.log('✅ QA customer user created\n');

    // 4. Create QA Customer Company
    console.log('🏪 Creating QA customer company...');
    await db.collection('customers').doc(qaCustomer.id).set({
      ...qaCustomer,
      createdAt: admin.firestore.Timestamp.fromDate(qaCustomer.createdAt),
    });
    console.log('✅ QA customer company created\n');

    // 5. Create QA Buildings
    console.log('🏭 Creating QA buildings...');
    for (const building of qaBuildings) {
      await db.collection('buildings').doc(building.id).set({
        ...building,
        createdAt: admin.firestore.Timestamp.fromDate(building.createdAt),
        lastInspection: admin.firestore.Timestamp.fromDate(building.lastInspection),
      });
      console.log(`✅ Building created: ${building.name}`);
    }

    // 6. Create QA Report
    console.log('\n📊 Creating QA test report...');
    await db.collection('reports').doc(qaReport.id).set({
      ...qaReport,
      inspectionDate: admin.firestore.Timestamp.fromDate(qaReport.inspectionDate),
      createdAt: admin.firestore.Timestamp.fromDate(qaReport.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(qaReport.updatedAt),
      offerValidUntil: admin.firestore.Timestamp.fromDate(qaReport.offerValidUntil),
    });
    console.log('✅ QA report created\n');

    // Print summary
    console.log('='.repeat(60));
    console.log('✅ QA ACCOUNTS CREATED SUCCESSFULLY!\n');
    console.log('='.repeat(60));
    
    console.log('\n📋 QA INSPECTOR ACCOUNT:');
    console.log('─'.repeat(40));
    console.log(`   URL: https://agritectum-platform.web.app/login`);
    console.log(`   Email: ${qaInspector.email}`);
    console.log(`   Password: ${qaInspector.password}`);
    console.log(`   Role: Inspector`);
    console.log(`   Branch: QA Test Branch`);
    
    console.log('\n📋 QA CUSTOMER ACCOUNT:');
    console.log('─'.repeat(40));
    console.log(`   URL: https://agritectum-platform.web.app/portal/login`);
    console.log(`   Email: ${qaCustomerUser.email}`);
    console.log(`   Password: ${qaCustomerUser.password}`);
    console.log(`   Role: Customer`);
    console.log(`   Company: QA Test Company ApS`);
    console.log(`   Buildings: 2 (Office + Warehouse)`);
    console.log(`   Reports: 1 (with test inspection data)`);
    
    console.log('\n='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating QA accounts:', error.message);
    process.exit(1);
  }
}

createQAAccounts();
