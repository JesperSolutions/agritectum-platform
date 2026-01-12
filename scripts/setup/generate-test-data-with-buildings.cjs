#!/usr/bin/env node

/**
 * Generate Test Data with Buildings
 * 
 * Creates comprehensive test data with proper building-report relationships:
 * - Customers (individual and company)
 * - Buildings (linked to customers)
 * - Reports (linked to buildings - required!)
 * - Inspector users
 * - Service agreements
 * - Scheduled visits
 * 
 * Usage: node scripts/setup/generate-test-data-with-buildings.cjs
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
  const statuses = ['draft', 'completed', 'sent', 'offer_sent', 'offer_accepted', 'offer_rejected'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Generate random date in the future
function getRandomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
}

// Test data
const testData = {
  customers: [
    // Individual customers
    { name: 'Erik Andersson', email: 'erik.andersson@example.com', phone: '+46 70 123 45 67', address: 'Storgatan 15, 123 45 Stockholm', type: 'individual' },
    { name: 'Maria Johansson', email: 'maria.johansson@example.com', phone: '+46 70 234 56 78', address: 'Kungsgatan 22, 111 22 Stockholm', type: 'individual' },
    { name: 'Lars Svensson', email: 'lars.svensson@example.com', phone: '+46 70 345 67 89', address: 'Drottninggatan 8, 111 51 Stockholm', type: 'individual' },
    // Company customers
    { name: 'Fastighets AB Nord', email: 'info@fastighetsnord.se', phone: '+46 8 123 45 67', address: 'Vasagatan 10, 111 20 Stockholm', type: 'company' },
    { name: 'Byggbolaget Sverige', email: 'kontakt@byggbolaget.se', phone: '+46 8 234 56 78', address: 'Birger Jarlsgatan 5, 114 34 Stockholm', type: 'company' },
    { name: 'Fastighetsservice AB', email: 'info@fastighetsservice.se', phone: '+46 8 345 67 89', address: 'Sveavägen 20, 111 57 Stockholm', type: 'company' },
  ],
  inspectors: [
    { email: 'inspector1@agritectum-platform.web.app', name: 'Inspector One', password: 'Test123!@#' },
    { email: 'inspector2@agritectum-platform.web.app', name: 'Inspector Two', password: 'Test123!@#' },
    { email: 'inspector3@agritectum-platform.web.app', name: 'Inspector Three', password: 'Test123!@#' },
  ],
};

async function generateTestData() {
  console.log('🔧 GENERATING TEST DATA WITH BUILDINGS\n');
  console.log('='.repeat(80));
  
  await initializeFirebase();
  db = admin.firestore();
  auth = admin.auth();
  
  try {
    // Step 1: Find branch.manager user and get their branchId
    console.log('\n📋 STEP 1: FINDING BRANCH MANAGER USER\n');
    console.log('─'.repeat(80));
    
    let branchManagerUser;
    let branchId;
    
    try {
      const userRecord = await auth.getUserByEmail('branch.manager@agritectum-platform.web.app');
      branchManagerUser = userRecord;
      
      // Get custom claims to find branchId
      const customClaims = userRecord.customClaims || {};
      branchId = customClaims.branchId || 'main';
      
      console.log(`✅ Found branch manager: ${userRecord.email}`);
      console.log(`   User ID: ${userRecord.uid}`);
      console.log(`   Branch ID: ${branchId}`);
    } catch (error) {
      console.error('❌ Error finding branch manager:', error.message);
      console.log('⚠️  Using default branchId: main');
      branchId = 'main';
    }
    
    // Step 2: Create inspector users
    console.log('\n👷 STEP 2: CREATING INSPECTOR USERS\n');
    console.log('─'.repeat(80));
    
    const inspectorIds = [];
    for (const inspector of testData.inspectors) {
      try {
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(inspector.email);
          console.log(`   ℹ️  Inspector already exists: ${inspector.email}`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email: inspector.email,
              password: inspector.password,
              displayName: inspector.name,
              emailVerified: true,
            });
            
            // Set custom claims
            await auth.setCustomUserClaims(userRecord.uid, {
              role: 'inspector',
              permissionLevel: 'branch',
              branchId: branchId,
            });
            
            console.log(`   ✅ Created inspector: ${inspector.email} (${inspector.name})`);
          } else {
            throw error;
          }
        }
        inspectorIds.push(userRecord.uid);
      } catch (error) {
        console.error(`   ❌ Error creating inspector ${inspector.email}:`, error.message);
      }
    }
    
    // Step 3: Create customers and buildings
    console.log('\n🏢 STEP 3: CREATING CUSTOMERS AND BUILDINGS\n');
    console.log('─'.repeat(80));
    
    const customerIds = [];
    const buildingIds = [];
    const customerBuildingMap = new Map(); // Maps customerId to array of buildingIds
    
    for (const customerData of testData.customers) {
      try {
        // Create customer
        const customerDoc = {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          customerType: customerData.type,
          branchId: branchId,
          createdAt: new Date().toISOString(),
        };
        
        const customerRef = await db.collection('customers').add(removeUndefinedFields(customerDoc));
        const customerId = customerRef.id;
        customerIds.push(customerId);
        
        console.log(`   ✅ Created customer: ${customerData.name} (${customerId})`);
        
        // Create 1-3 buildings per customer
        const numBuildings = customerData.type === 'company' ? 2 + Math.floor(Math.random() * 2) : 1;
        const customerBuildings = [];
        
        for (let i = 0; i < numBuildings; i++) {
          const buildingAddress = i === 0 
            ? customerData.address 
            : `${customerData.address.split(',')[0]} ${i + 1}, ${customerData.address.split(',')[1]}`;
          
          const roofType = getRandomRoofType();
          const buildingType = getRandomBuildingType();
          const roofSize = 50 + Math.floor(Math.random() * 200); // 50-250 m²
          
          const buildingDoc = {
            customerId: customerId,
            address: buildingAddress.trim(),
            branchId: branchId,
            roofType: roofType,
            roofSize: roofSize,
            buildingType: buildingType,
            createdAt: new Date().toISOString(),
            createdBy: branchManagerUser?.uid || 'system',
          };
          
          const buildingRef = await db.collection('buildings').add(removeUndefinedFields(buildingDoc));
          const buildingId = buildingRef.id;
          buildingIds.push(buildingId);
          customerBuildings.push(buildingId);
          
          console.log(`      ✅ Created building: ${buildingAddress} (${buildingId}) - ${roofType}, ${roofSize}m²`);
        }
        
        customerBuildingMap.set(customerId, customerBuildings);
      } catch (error) {
        console.error(`   ❌ Error creating customer ${customerData.name}:`, error.message);
      }
    }
    
    // Step 4: Create reports (linked to buildings!)
    console.log('\n📄 STEP 4: CREATING REPORTS (LINKED TO BUILDINGS)\n');
    console.log('─'.repeat(80));
    
    const reportIds = [];
    
    for (const [customerId, buildingIdsForCustomer] of customerBuildingMap.entries()) {
      const customer = testData.customers[customerIds.indexOf(customerId)];
      if (!customer) continue;
      
      // Create 1-3 reports per building
      for (const buildingId of buildingIdsForCustomer) {
        const numReports = 1 + Math.floor(Math.random() * 3);
        
        // Get building data
        const buildingDoc = await db.collection('buildings').doc(buildingId).get();
        const buildingData = buildingDoc.data();
        
        for (let i = 0; i < numReports; i++) {
          const status = getRandomReportStatus();
          const inspectionDate = getRandomPastDate(30 + i * 10);
          const inspectorId = inspectorIds[Math.floor(Math.random() * inspectorIds.length)];
          const inspectorIndex = inspectorIds.indexOf(inspectorId);
          const inspectorName = testData.inspectors[inspectorIndex]?.name || 'Inspector';
          
          const reportDoc = {
            createdBy: inspectorId,
            createdByName: inspectorName,
            branchId: branchId,
            inspectionDate: inspectionDate.split('T')[0],
            customerId: customerId,
            customerName: customer.name,
            customerAddress: customer.address,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            customerType: customer.type,
            buildingId: buildingId, // REQUIRED: Link to building
            buildingAddress: buildingData.address,
            roofType: buildingData.roofType,
            roofSize: buildingData.roofSize,
            roofAge: 5 + Math.floor(Math.random() * 30),
            conditionNotes: `Test rapport for ${buildingData.address}. Taget er i ${status === 'completed' ? 'god' : 'moderat'} stand.`,
            issuesFound: [
              {
                id: `issue-${Date.now()}-${i}`,
                description: 'Mindre skade på taget',
                severity: 'low',
                location: 'Nordøst hjørne',
                estimatedCost: 5000 + Math.floor(Math.random() * 10000),
              },
            ],
            recommendedActions: [
              {
                id: `action-${Date.now()}-${i}`,
                description: 'Regelmæssig vedligeholdelse anbefales',
                priority: 'medium',
                estimatedCost: 3000 + Math.floor(Math.random() * 5000),
              },
            ],
            status: status,
            createdAt: inspectionDate,
            lastEdited: inspectionDate,
            isShared: status !== 'draft',
            isOffer: status.startsWith('offer_'),
            offerValue: status.startsWith('offer_') ? 10000 + Math.floor(Math.random() * 50000) : undefined,
            offerValidUntil: status.startsWith('offer_') ? getRandomFutureDate(30).split('T')[0] : undefined,
          };
          
          const reportRef = await db.collection('reports').add(removeUndefinedFields(reportDoc));
          reportIds.push(reportRef.id);
          
          console.log(`   ✅ Created report: ${customer.name} - ${buildingData.address} (${status})`);
        }
      }
    }
    
    // Step 5: Create service agreements
    console.log('\n📋 STEP 5: CREATING SERVICE AGREEMENTS\n');
    console.log('─'.repeat(80));
    
    const agreementIds = [];
    const selectedCustomers = customerIds.slice(0, 4); // First 4 customers
    
    for (const customerId of selectedCustomers) {
      const customer = testData.customers[customerIds.indexOf(customerId)];
      if (!customer) continue;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const nextServiceDate = new Date();
      nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
      
      const agreementDoc = {
        customerId: customerId,
        customerName: customer.name,
        customerAddress: customer.address,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        branchId: branchId,
        createdBy: branchManagerUser?.uid || 'system',
        createdByName: branchManagerUser?.displayName || 'Branch Manager',
        agreementType: 'annual',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        nextServiceDate: nextServiceDate.toISOString(),
        serviceFrequency: 'quarterly',
        status: 'active',
        publicToken: generatePublicToken(),
        createdAt: new Date().toISOString(),
      };
      
      const agreementRef = await db.collection('serviceAgreements').add(removeUndefinedFields(agreementDoc));
      agreementIds.push(agreementRef.id);
      
      console.log(`   ✅ Created service agreement: ${customer.name}`);
    }
    
    // Step 6: Create scheduled visits
    console.log('\n📅 STEP 6: CREATING SCHEDULED VISITS\n');
    console.log('─'.repeat(80));
    
    const visitIds = [];
    const selectedBuildings = buildingIds.slice(0, 5);
    
    for (const buildingId of selectedBuildings) {
      const buildingDoc = await db.collection('buildings').doc(buildingId).get();
      const buildingData = buildingDoc.data();
      const customerDoc = await db.collection('customers').doc(buildingData.customerId).get();
      const customerData = customerDoc.data();
      
      const scheduledDate = getRandomFutureDate(7 + Math.floor(Math.random() * 30));
      const inspectorId = inspectorIds[Math.floor(Math.random() * inspectorIds.length)];
      
      const visitDoc = {
        customerId: buildingData.customerId,
        customerName: customerData.name,
        customerAddress: customerData.address,
        buildingId: buildingId,
        branchId: branchId,
        assignedInspectorId: inspectorId,
        assignedInspectorName: testData.inspectors[inspectorIds.indexOf(inspectorId)]?.name || 'Inspector',
        scheduledDate: scheduledDate.split('T')[0],
        scheduledTime: `${9 + Math.floor(Math.random() * 8)}:00`,
        duration: 120,
        status: 'scheduled',
        title: `Taginspektion - ${buildingData.address}`,
        visitType: 'inspection',
        createdAt: new Date().toISOString(),
      };
      
      const visitRef = await db.collection('scheduledVisits').add(removeUndefinedFields(visitDoc));
      visitIds.push(visitRef.id);
      
      console.log(`   ✅ Created scheduled visit: ${buildingData.address} - ${scheduledDate.split('T')[0]}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST DATA GENERATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Customers: ${customerIds.length}`);
    console.log(`   - Buildings: ${buildingIds.length}`);
    console.log(`   - Reports: ${reportIds.length} (all linked to buildings!)`);
    console.log(`   - Inspectors: ${inspectorIds.length}`);
    console.log(`   - Service Agreements: ${agreementIds.length}`);
    console.log(`   - Scheduled Visits: ${visitIds.length}`);
    console.log('='.repeat(80));
    console.log('\n💡 All reports are now properly linked to buildings!\n');
    
  } catch (error) {
    console.error('\n❌ Error generating test data:', error);
    throw error;
  }
}

// Run the script
generateTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
