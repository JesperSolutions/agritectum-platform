#!/usr/bin/env node

/**
 * Reset Database and Generate Comprehensive Test Data
 * 
 * This script will:
 * 1. Clear ALL data from Firebase (Firestore collections, Auth users, Storage files)
 * 2. Create fresh test data:
 *    - 1 Branch (Stockholm)
 *    - 1 Super Admin
 *    - 3 Roof Inspectors
 *    - 6 Customers (mix of individual and company)
 *    - Buildings for each customer (1-3 per customer)
 *    - Reports for each building (1-3 per building)
 *    - Service agreements for some customers
 *    - Scheduled visits
 * 
 * ⚠️ WARNING: This will completely wipe your Firebase database!
 * 
 * Usage: node scripts/setup/reset-and-generate-comprehensive-test-data.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    
    const serviceAccountFile = files.find(f => 
      f.startsWith('agritectum-platform-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      throw new Error('Agritectum service account key file not found. Expected: agritectum-platform-firebase-adminsdk-*.json');
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    if (admin.apps.length > 0) {
      admin.app().delete();
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: serviceAccount.project_id + '.appspot.com',
    });
    
    console.log('✅ Firebase Admin initialized for Agritectum Platform\n');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

let db;
let auth;
let bucket;

// Helper: Remove undefined fields
function removeUndefinedFields(obj) {
  const newObj = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

// Generate public token
function generatePublicToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get random roof type
function getRandomRoofType() {
  const types = ['tile', 'metal', 'shingle', 'slate', 'flat'];
  return types[Math.floor(Math.random() * types.length)];
}

// Get random building type
function getRandomBuildingType() {
  const types = ['residential', 'commercial', 'industrial', 'apartment'];
  return types[Math.floor(Math.random() * types.length)];
}

// Get random report status
function getRandomReportStatus() {
  const statuses = ['completed', 'sent', 'offer_sent'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

// Generate random date in the future
function getRandomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 7);
  return date.toISOString();
}

// Delete collection in batches
async function deleteCollectionInBatches(db, collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  let deletedCount = 0;
  
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    
    if (snapshot.empty) {
      break;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += snapshot.docs.length;
  }
  
  if (deletedCount > 0) {
    console.log(`   ✅ Deleted ${deletedCount} documents from ${collectionName}`);
  } else {
    console.log(`   ℹ️  No documents in ${collectionName}`);
  }
  
  return deletedCount;
}

// Delete all Firebase Auth users
async function deleteAllAuthUsers() {
  let deletedCount = 0;
  let pageToken;
  
  do {
    const result = await auth.listUsers(1000, pageToken);
    
    if (result.users.length === 0) {
      break;
    }
    
    const uids = result.users.map(user => user.uid);
    await auth.deleteUsers(uids);
    deletedCount += uids.length;
    
    pageToken = result.pageToken;
  } while (pageToken);
  
  if (deletedCount > 0) {
    console.log(`   ✅ Deleted ${deletedCount} Auth users`);
  } else {
    console.log(`   ℹ️  No Auth users to delete`);
  }
  
  return deletedCount;
}

// Delete all Storage files
async function deleteAllStorageFiles() {
  try {
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log(`   ℹ️  No Storage files to delete`);
      return 0;
    }
    
    await Promise.all(files.map(file => file.delete()));
    console.log(`   ✅ Deleted ${files.length} Storage files`);
    return files.length;
  } catch (error) {
    console.log(`   ⚠️  Could not delete Storage files: ${error.message}`);
    return 0;
  }
}

// PHASE 1: Clear Database
async function clearDatabase() {
  console.log('\n' + '='.repeat(80));
  console.log('🧹 PHASE 1: CLEARING DATABASE');
  console.log('='.repeat(80));
  
  // Delete Firestore collections
  console.log('\n📁 Deleting Firestore collections...\n');
  
  const collections = [
    'users',
    'branches',
    'reports',
    'buildings',
    'customers',
    'serviceAgreements',
    'scheduledVisits',
    'appointments',
    'offers',
    'rejectedOrders',
    'notifications',
    'emailLogs',
    'mail',
    'mail-templates',
    'reportAccessLogs',
    'performanceMetrics',
    'emailPreferences',
  ];
  
  let totalDeleted = 0;
  for (const collectionName of collections) {
    try {
      const deleted = await deleteCollectionInBatches(db, collectionName);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`   ❌ Error deleting ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n   📊 Total Firestore documents deleted: ${totalDeleted}`);
  
  // Delete Auth users
  console.log('\n👥 Deleting Firebase Auth users...\n');
  await deleteAllAuthUsers();
  
  // Delete Storage files
  console.log('\n📦 Deleting Firebase Storage files...\n');
  await deleteAllStorageFiles();
  
  console.log('\n✅ Database cleared successfully!\n');
}

// PHASE 2: Generate Test Data
async function generateTestData() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 PHASE 2: GENERATING TEST DATA');
  console.log('='.repeat(80));
  
  // Test data definitions
  const branchData = {
    id: 'stockholm',
    name: 'Stockholm Branch',
    address: 'Vasagatan 10, 111 20 Stockholm',
    phone: '+46 8 123 45 67',
    email: 'stockholm@agritectum.se',
  };
  
  const superAdminData = {
    email: 'admin@agritectum.se',
    password: 'Admin123!@#',
    displayName: 'Super Admin',
  };
  
  const branchManagerData = {
    email: 'branch.manager@agritectum.se',
    password: 'Manager123!@#',
    displayName: 'Stockholm Manager',
  };
  
  const inspectorData = [
    { email: 'inspector1@agritectum.se', password: 'Inspector123!@#', displayName: 'Erik Nilsson' },
    { email: 'inspector2@agritectum.se', password: 'Inspector123!@#', displayName: 'Maria Berg' },
    { email: 'inspector3@agritectum.se', password: 'Inspector123!@#', displayName: 'Lars Karlsson' },
  ];
  
  const customerData = [
    // Individual customers
    { 
      name: 'Anna Andersson', 
      email: 'anna.andersson@example.com', 
      phone: '+46 70 123 45 67', 
      address: 'Storgatan 15, 123 45 Stockholm', 
      type: 'individual',
      buildings: 1,
    },
    { 
      name: 'Johan Pettersson', 
      email: 'johan.pettersson@example.com', 
      phone: '+46 70 234 56 78', 
      address: 'Kungsgatan 22, 111 22 Stockholm', 
      type: 'individual',
      buildings: 1,
    },
    { 
      name: 'Sofia Lundberg', 
      email: 'sofia.lundberg@example.com', 
      phone: '+46 70 345 67 89', 
      address: 'Drottninggatan 8, 111 51 Stockholm', 
      type: 'individual',
      buildings: 1,
    },
    // Company customers
    { 
      name: 'Fastighets AB Stockholm', 
      email: 'info@fastighetsstockholm.se', 
      phone: '+46 8 111 22 33', 
      address: 'Birger Jarlsgatan 5, 114 34 Stockholm', 
      type: 'company',
      buildings: 3,
    },
    { 
      name: 'Byggkoncernen Nord AB', 
      email: 'kontakt@byggkoncernen.se', 
      phone: '+46 8 222 33 44', 
      address: 'Sveavägen 20, 111 57 Stockholm', 
      type: 'company',
      buildings: 2,
    },
    { 
      name: 'Fastighetsservice Sverige AB', 
      email: 'info@fastservice.se', 
      phone: '+46 8 333 44 55', 
      address: 'Hamngatan 12, 111 47 Stockholm', 
      type: 'company',
      buildings: 3,
    },
  ];
  
  // Step 1: Create Branch
  console.log('\n🏢 STEP 1: CREATING BRANCH\n');
  console.log('─'.repeat(80));
  
  await db.collection('branches').doc(branchData.id).set({
    ...branchData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  console.log(`✅ Created branch: ${branchData.name} (${branchData.id})`);
  
  // Step 2: Create Super Admin
  console.log('\n👤 STEP 2: CREATING SUPER ADMIN\n');
  console.log('─'.repeat(80));
  
  const superAdminUser = await auth.createUser({
    email: superAdminData.email,
    password: superAdminData.password,
    displayName: superAdminData.displayName,
    emailVerified: true,
  });
  
  await auth.setCustomUserClaims(superAdminUser.uid, {
    role: 'superadmin',
    permissionLevel: 2,
    branchId: null,
  });
  
  await db.collection('users').doc(superAdminUser.uid).set({
    uid: superAdminUser.uid,
    email: superAdminData.email,
    displayName: superAdminData.displayName,
    role: 'superadmin',
    permissionLevel: 2,
    branchId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  
  console.log(`✅ Created super admin: ${superAdminData.email}`);
  console.log(`   Password: ${superAdminData.password}`);
  
  // Step 4: Create Inspectors
  console.log('\n👷 STEP 4: CREATING BRANCH MANAGER\n');
  console.log('─'.repeat(80));
  
  const branchManagerUser = await auth.createUser({
    email: branchManagerData.email,
    password: branchManagerData.password,
    displayName: branchManagerData.displayName,
    emailVerified: true,
  });
  
  await auth.setCustomUserClaims(branchManagerUser.uid, {
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: branchData.id,
  });
  
  await db.collection('users').doc(branchManagerUser.uid).set({
    uid: branchManagerUser.uid,
    email: branchManagerData.email,
    displayName: branchManagerData.displayName,
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: branchData.id,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  
  console.log(`✅ Created branch manager: ${branchManagerData.email}`);
  console.log(`   Password: ${branchManagerData.password}`);
  console.log(`   Branch: ${branchData.name}`);
  
  // Step 4: Create Inspectors
  console.log('\n👷 STEP 4: CREATING INSPECTORS\n');
  console.log('─'.repeat(80));
  
  const inspectorIds = [];
  for (const inspector of inspectorData) {
    const inspectorUser = await auth.createUser({
      email: inspector.email,
      password: inspector.password,
      displayName: inspector.displayName,
      emailVerified: true,
    });
    
    await auth.setCustomUserClaims(inspectorUser.uid, {
      role: 'inspector',
      permissionLevel: 0,
      branchId: branchData.id,
    });
    
    await db.collection('users').doc(inspectorUser.uid).set({
      uid: inspectorUser.uid,
      email: inspector.email,
      displayName: inspector.displayName,
      role: 'inspector',
      permissionLevel: 0,
      branchId: branchData.id,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    
    inspectorIds.push(inspectorUser.uid);
    console.log(`✅ Created inspector: ${inspector.email} (${inspector.displayName})`);
    console.log(`   Password: ${inspector.password}`);
  }
  
  // Step 4: Create Customers, Buildings, and Reports
  console.log('\n🏢 STEP 4: CREATING CUSTOMERS, BUILDINGS, AND REPORTS\n');
  console.log('─'.repeat(80));
  
  const customerIds = [];
  const buildingIds = [];
  const reportIds = [];
  
  for (const customer of customerData) {
    // Create customer
    const customerDoc = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      customerType: customer.type,
      branchId: branchData.id,
      createdBy: superAdminUser.uid,
      createdAt: new Date().toISOString(),
      totalReports: 0,
      totalRevenue: 0,
    };
    
    const customerRef = await db.collection('customers').add(removeUndefinedFields(customerDoc));
    const customerId = customerRef.id;
    customerIds.push(customerId);
    
    console.log(`\n✅ Created customer: ${customer.name} (${customer.type})`);
    
    // Create buildings for this customer
    for (let i = 0; i < customer.buildings; i++) {
      const buildingAddress = i === 0 
        ? customer.address 
        : `${customer.address.split(',')[0]} Building ${i + 1}, ${customer.address.split(',').slice(1).join(',')}`;
      
      const roofType = getRandomRoofType();
      const buildingType = getRandomBuildingType();
      const roofSize = 80 + Math.floor(Math.random() * 170); // 80-250 m²
      
      const buildingDoc = {
        customerId: customerId,
        address: buildingAddress.trim(),
        branchId: branchData.id,
        roofType: roofType,
        roofSize: roofSize,
        buildingType: buildingType,
        roofAge: 5 + Math.floor(Math.random() * 30),
        constructionYear: new Date().getFullYear() - (5 + Math.floor(Math.random() * 30)),
        createdAt: new Date().toISOString(),
        createdBy: branchManagerUser.uid,
      };
      
      const buildingRef = await db.collection('buildings').add(removeUndefinedFields(buildingDoc));
      const buildingId = buildingRef.id;
      buildingIds.push(buildingId);
      
      console.log(`   📍 Building ${i + 1}: ${buildingAddress} (${roofType}, ${roofSize}m²)`);
      
      // Create 1-3 reports per building
      const numReports = 1 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numReports; j++) {
        const status = getRandomReportStatus();
        const inspectionDate = getRandomPastDate(90);
        const inspectorId = inspectorIds[Math.floor(Math.random() * inspectorIds.length)];
        const inspector = inspectorData[inspectorIds.indexOf(inspectorId)];
        
        const reportDoc = {
          createdBy: inspectorId,
          createdByName: inspector.displayName,
          branchId: branchData.id,
          inspectionDate: inspectionDate.split('T')[0],
          customerId: customerId,
          customerName: customer.name,
          customerAddress: customer.address,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerType: customer.type,
          buildingId: buildingId,
          buildingAddress: buildingDoc.address,
          roofType: roofType,
          roofSize: roofSize,
          roofAge: buildingDoc.roofAge,
          conditionNotes: `Professionel taginspektion udført for ${buildingDoc.address}. Overordnet vurdering: ${status === 'completed' ? 'God stand' : 'Moderat stand med anbefalinger'}.`,
          issuesFound: [
            {
              id: `issue-${Date.now()}-${j}-1`,
              description: 'Mindre revner i tagbelægningen',
              severity: 'low',
              location: 'Nordlige sektion',
              estimatedCost: 3000 + Math.floor(Math.random() * 7000),
            },
            {
              id: `issue-${Date.now()}-${j}-2`,
              description: 'Mos og planterester på taget',
              severity: 'medium',
              location: 'Hele taget',
              estimatedCost: 5000 + Math.floor(Math.random() * 10000),
            },
          ],
          recommendedActions: [
            {
              id: `action-${Date.now()}-${j}-1`,
              description: 'Tagrensning og behandling',
              priority: 'high',
              estimatedCost: 8000 + Math.floor(Math.random() * 12000),
              timeline: '2-4 uger',
            },
            {
              id: `action-${Date.now()}-${j}-2`,
              description: 'Årlig vedligeholdelse anbefales',
              priority: 'medium',
              estimatedCost: 4000 + Math.floor(Math.random() * 6000),
              timeline: 'Løbende',
            },
          ],
          status: status,
          createdAt: inspectionDate,
          lastEdited: inspectionDate,
          isShared: true,
          isOffer: status.startsWith('offer_'),
          offerValue: status.startsWith('offer_') ? 15000 + Math.floor(Math.random() * 40000) : undefined,
          offerValidUntil: status.startsWith('offer_') ? getRandomFutureDate(30).split('T')[0] : undefined,
        };
        
        const reportRef = await db.collection('reports').add(removeUndefinedFields(reportDoc));
        reportIds.push(reportRef.id);
        
        console.log(`      📄 Report ${j + 1}: ${status} - ${inspectionDate.split('T')[0]}`);
      }
    }
  }
  
  // Step 6: Create Service Agreements
  console.log('\n📋 STEP 6: CREATING SERVICE AGREEMENTS\n');
  console.log('─'.repeat(80));
  
  const agreementIds = [];
  const companyCustomers = customerData.filter(c => c.type === 'company').map((_, idx) => customerIds[3 + idx]);
  
  for (const customerId of companyCustomers) {
    const customerDoc = await db.collection('customers').doc(customerId).get();
    const customer = customerDoc.data();
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const nextServiceDate = new Date();
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 2 + Math.floor(Math.random() * 2));
    
    const agreementDoc = {
      customerId: customerId,
      customerName: customer.name,
      customerAddress: customer.address,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      branchId: branchData.id,
      createdBy: superAdminUser.uid,
      createdByName: superAdminData.displayName,
      agreementType: 'annual',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nextServiceDate: nextServiceDate.toISOString(),
      serviceFrequency: 'quarterly',
      status: 'active',
      publicToken: generatePublicToken(),
      annualValue: 25000 + Math.floor(Math.random() * 75000),
      createdAt: new Date().toISOString(),
    };
    
    const agreementRef = await db.collection('serviceAgreements').add(removeUndefinedFields(agreementDoc));
    agreementIds.push(agreementRef.id);
    
    console.log(`✅ Service agreement: ${customer.name} (${agreementDoc.serviceFrequency})`);
  }
  
  // Step 7: Create Scheduled Visits
  console.log('\n📅 STEP 7: CREATING SCHEDULED VISITS\n');
  console.log('─'.repeat(80));
  
  const visitIds = [];
  const selectedBuildings = buildingIds.slice(0, 8);
  
  for (const buildingId of selectedBuildings) {
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    const buildingData = buildingDoc.data();
    const customerDoc = await db.collection('customers').doc(buildingData.customerId).get();
    const customerDataFromDb = customerDoc.data();
    
    const scheduledDate = getRandomFutureDate(60);
    const inspectorId = inspectorIds[Math.floor(Math.random() * inspectorIds.length)];
    const inspector = inspectorData[inspectorIds.indexOf(inspectorId)];
    
    const visitDoc = {
      customerId: buildingData.customerId,
      customerName: customerDataFromDb.name,
      customerAddress: customerDataFromDb.address,
      customerEmail: customerDataFromDb.email,
      customerPhone: customerDataFromDb.phone,
      buildingId: buildingId,
      buildingAddress: buildingData.address,
      branchId: branchData.id,
      assignedInspectorId: inspectorId,
      assignedInspectorName: inspector.displayName,
      scheduledDate: scheduledDate.split('T')[0],
      scheduledTime: `${9 + Math.floor(Math.random() * 7)}:00`,
      duration: 120,
      status: 'scheduled',
      title: `Taginspektion - ${buildingData.address}`,
      description: 'Rutinemæssig taginspektion',
      visitType: 'inspection',
      createdBy: branchManagerUser.uid,
      createdByName: branchManagerData.displayName,
      createdAt: new Date().toISOString(),
    };
    
    const visitRef = await db.collection('scheduledVisits').add(removeUndefinedFields(visitDoc));
    visitIds.push(visitRef.id);
    
    console.log(`✅ Visit: ${buildingData.address} - ${scheduledDate.split('T')[0]} (${inspector.displayName})`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST DATA GENERATION COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   - Branch: 1 (${branchData.name})`);
  console.log(`   - Super Admin: 1`);
  console.log(`   - Branch Manager: 1`);
  console.log(`   - Inspectors: ${inspectorIds.length}`);
  console.log(`   - Customers: ${customerIds.length} (3 individual, 3 company)`);
  console.log(`   - Buildings: ${buildingIds.length}`);
  console.log(`   - Reports: ${reportIds.length}`);
  console.log(`   - Service Agreements: ${agreementIds.length}`);
  console.log(`   - Scheduled Visits: ${visitIds.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log('─'.repeat(80));
  console.log(`\n   Super Admin (Global):`);
  console.log(`   Email: ${superAdminData.email}`);
  console.log(`   Password: ${superAdminData.password}`);
  console.log(`\n   Branch Manager (Stockholm):`);
  console.log(`   Email: ${branchManagerData.email}`);
  console.log(`   Password: ${branchManagerData.password}`);
  console.log(`\n   Inspectors (Stockholm):`);
  inspectorData.forEach((inspector, idx) => {
    console.log(`   ${idx + 1}. ${inspector.email} / ${inspector.password}`);
  });
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 All data has been created with proper hierarchy!');
  console.log('💡 Super Admin → Branch Manager → Inspectors → Customers/Buildings/Reports\n');
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 RESET AND GENERATE COMPREHENSIVE TEST DATA');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This will completely wipe your Firebase database!');
  console.log('⚠️  All data, users, and files will be permanently deleted!');
  console.log('\n' + '='.repeat(80));
  
  // Initialize Firebase
  await initializeFirebase();
  db = admin.firestore();
  auth = admin.auth();
  bucket = admin.storage().bucket();
  
  // Phase 1: Clear database
  await clearDatabase();
  
  // Phase 2: Generate test data
  await generateTestData();
  
  console.log('\n🎉 All operations completed successfully!\n');
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
