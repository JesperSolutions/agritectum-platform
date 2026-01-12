#!/usr/bin/env node

/**
 * Create Test Data for branch.manager@agritectum-platform.web.app
 * 
 * Creates comprehensive test data for the branch manager account:
 * - 5-6 test customers with buildings
 * - 8-10 test reports (mix of draft, completed, sent, offers)
 * - 2-3 inspector users
 * - Service agreements
 * - Scheduled visits
 * 
 * Usage: node scripts/setup/create-branch-manager-test-data.cjs
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

// Generate public token for service agreements
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

// Get random report status
function getRandomReportStatus() {
  const statuses = ['draft', 'completed', 'sent', 'offer_sent', 'offer_accepted'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Generate random date in the future
function getRandomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

async function createTestData() {
  console.log('🔧 CREATING TEST DATA FOR BRANCH MANAGER\n');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Find branch.manager user and get their branchId
    console.log('\n📋 STEP 1: FINDING BRANCH MANAGER USER\n');
    console.log('─'.repeat(80));
    
    const managerEmail = 'branch.manager@agritectum-platform.web.app';
    let managerUser;
    let branchId;
    
    try {
      managerUser = await auth.getUserByEmail(managerEmail);
      console.log(`✅ Found branch manager: ${managerEmail} (${managerUser.uid})`);
      
      // Get user document to find branchId
      const userDoc = await db.collection('users').doc(managerUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        branchId = userData.branchId;
        console.log(`✅ Found branchId: ${branchId}`);
      } else {
        // Try to get from custom claims
        const customClaims = managerUser.customClaims || {};
        branchId = customClaims.branchId;
        if (branchId) {
          console.log(`✅ Found branchId from custom claims: ${branchId}`);
        } else {
          throw new Error('Could not find branchId for branch manager. Please ensure the user has a branchId set.');
        }
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`Branch manager user not found: ${managerEmail}. Please create the user first.`);
      }
      throw error;
    }
    
    if (!branchId) {
      throw new Error('Could not determine branchId for branch manager');
    }
    
    const created = {
      customers: [],
      buildings: [],
      reports: [],
      inspectors: [],
      serviceAgreements: [],
      scheduledVisits: [],
    };
    
    // Step 2: Create inspector users
    console.log('\n📋 STEP 2: CREATING INSPECTOR USERS\n');
    console.log('─'.repeat(80));
    
    const inspectorData = [
      { email: 'inspector1@agritectum-platform.web.app', name: 'Erik Andersson', password: 'Inspector123!' },
      { email: 'inspector2@agritectum-platform.web.app', name: 'Sofia Johansson', password: 'Inspector123!' },
      { email: 'inspector3@agritectum-platform.web.app', name: 'Lars Larsson', password: 'Inspector123!' },
    ];
    
    for (const inspector of inspectorData) {
      try {
        const inspectorUser = await auth.createUser({
          email: inspector.email,
          password: inspector.password,
          displayName: inspector.name,
          emailVerified: false,
        });
        
        await auth.setCustomUserClaims(inspectorUser.uid, {
          role: 'inspector',
          permissionLevel: 0,
          branchId: branchId,
        });
        
        await db.collection('users').doc(inspectorUser.uid).set({
          uid: inspectorUser.uid,
          email: inspector.email,
          displayName: inspector.name,
          role: 'inspector',
          permissionLevel: 0,
          branchId: branchId,
          userType: 'internal',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        
        created.inspectors.push({ id: inspectorUser.uid, email: inspector.email, name: inspector.name });
        console.log(`✅ Created inspector: ${inspector.name} (${inspector.email})`);
        console.log(`   Password: ${inspector.password}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  Inspector ${inspector.email} already exists, skipping...`);
          // Try to find existing user
          const usersSnapshot = await db.collection('users').where('email', '==', inspector.email).get();
          if (!usersSnapshot.empty) {
            const existingUser = usersSnapshot.docs[0].data();
            created.inspectors.push({ id: existingUser.uid, email: inspector.email, name: inspector.name });
          }
        } else {
          console.error(`❌ Error creating inspector ${inspector.email}:`, error.message);
        }
      }
    }
    
    // Step 3: Create customers and their data
    console.log('\n📋 STEP 3: CREATING CUSTOMERS AND BUILDINGS\n');
    console.log('─'.repeat(80));
    
    const customerData = [
      {
        name: 'Anders Nielsen',
        email: 'anders.nielsen@example.com',
        phone: '+45 20 12 34 56',
        address: 'Vesterbrogade 15, 1620 København V, Denmark',
        buildingAddress: 'Vesterbrogade 15, 1620 København V, Denmark',
        customerType: 'individual',
      },
      {
        name: 'Maria Hansen',
        email: 'maria.hansen@example.com',
        phone: '+45 30 23 45 67',
        address: 'Nørrebrogade 42, 2200 København N, Denmark',
        buildingAddress: 'Nørrebrogade 42, 2200 København N, Denmark',
        customerType: 'individual',
      },
      {
        name: 'Jens Pedersen',
        email: 'jens.pedersen@example.com',
        phone: '+45 40 34 56 78',
        address: 'Østerbrogade 88, 2100 København Ø, Denmark',
        buildingAddress: 'Østerbrogade 88, 2100 København Ø, Denmark',
        customerType: 'individual',
      },
      {
        name: 'København Ejendomme A/S',
        email: 'info@kobenhavnejendomme.dk',
        phone: '+45 70 45 67 89',
        address: 'Børsgade 1, 1215 København K, Denmark',
        buildingAddress: 'Børsgade 1, 1215 København K, Denmark',
        customerType: 'company',
        company: 'København Ejendomme A/S',
      },
      {
        name: 'Lise Andersen',
        email: 'lise.andersen@example.com',
        phone: '+45 50 56 78 90',
        address: 'Frederiksberg Allé 25, 1820 Frederiksberg, Denmark',
        buildingAddress: 'Frederiksberg Allé 25, 1820 Frederiksberg, Denmark',
        customerType: 'individual',
      },
      {
        name: 'Nordic Properties ApS',
        email: 'kontakt@nordicproperties.dk',
        phone: '+45 60 67 89 01',
        address: 'Strandvejen 100, 2900 Hellerup, Denmark',
        buildingAddress: 'Strandvejen 100, 2900 Hellerup, Denmark',
        customerType: 'company',
        company: 'Nordic Properties ApS',
      },
    ];
    
    for (let i = 0; i < customerData.length; i++) {
      const customerInfo = customerData[i];
      console.log(`\n  Creating customer ${i + 1}: ${customerInfo.name}`);
      
      // Create customer document
      const customerDoc = {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        customerType: customerInfo.customerType,
        company: customerInfo.company || null,
        branchId: branchId,
        totalReports: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString(),
      };
      
      const customerRef = await db.collection('customers').add(customerDoc);
      const customerId = customerRef.id;
      created.customers.push({ id: customerId, name: customerInfo.name, email: customerInfo.email });
      console.log(`    ✅ Created customer: ${customerInfo.name} (${customerId})`);
      
      // Create building for customer
      const building = {
        customerId: customerId,
        address: customerInfo.buildingAddress,
        buildingType: customerInfo.customerType === 'company' ? 'commercial' : 'residential',
        roofType: getRandomRoofType(),
        roofSize: Math.floor(Math.random() * 200) + 80, // 80-280 m²
        branchId: branchId,
        createdAt: new Date().toISOString(),
      };
      
      const buildingRef = await db.collection('buildings').add(building);
      created.buildings.push({ id: buildingRef.id, customerId: customerId });
      console.log(`    ✅ Created building: ${customerInfo.buildingAddress}`);
      
      // Create 1-2 reports per customer
      const numReports = i < 3 ? 2 : 1; // First 3 customers get 2 reports, others get 1
      for (let r = 0; r < numReports; r++) {
        const reportStatus = getRandomReportStatus();
        const inspectionDate = getRandomPastDate(Math.floor(Math.random() * 90) + 1); // 1-90 days ago
        const createdAt = getRandomPastDate(Math.floor(Math.random() * 60) + 1);
        
        const isOffer = reportStatus.startsWith('offer_');
        const report = {
          createdBy: created.inspectors[Math.floor(Math.random() * created.inspectors.length)]?.id || managerUser.uid,
          createdByName: created.inspectors[Math.floor(Math.random() * created.inspectors.length)]?.name || 'Branch Manager',
          branchId: branchId,
          inspectionDate: inspectionDate,
          customerId: customerId,
          customerName: customerInfo.name,
          customerAddress: customerInfo.address,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          customerType: customerInfo.customerType,
          buildingAddress: customerInfo.buildingAddress,
          roofType: building.roofType,
          roofAge: Math.floor(Math.random() * 30) + 5, // 5-35 years
          roofSize: building.roofSize,
          conditionNotes: `Roof inspection completed. Overall condition is ${reportStatus === 'completed' ? 'good' : 'needs attention'}.`,
          issuesFound: [],
          recommendedActions: [],
          status: reportStatus,
          createdAt: createdAt,
          lastEdited: createdAt,
          isShared: reportStatus === 'sent' || reportStatus === 'offer_sent',
          isOffer: isOffer,
        };
        
        // Only add offer-related fields if it's an offer
        if (isOffer) {
          report.offerValue = Math.floor(Math.random() * 100000) + 20000; // 20k-120k DKK
          report.offerStatus = reportStatus.replace('offer_', '');
        }
        
        // Remove undefined values
        const cleanReport = Object.fromEntries(
          Object.entries(report).filter(([_, value]) => value !== undefined)
        );
        
        const reportRef = await db.collection('reports').add(cleanReport);
        created.reports.push({ id: reportRef.id, customerId: customerId, status: reportStatus });
        console.log(`    ✅ Created report: ${reportStatus} (${inspectionDate})`);
        
        // Update customer stats
        await db.collection('customers').doc(customerId).update({
          totalReports: admin.firestore.FieldValue.increment(1),
          totalRevenue: admin.firestore.FieldValue.increment(report.offerValue || 0),
          lastReportDate: inspectionDate,
        });
      }
      
      // Create service agreement for some customers
      if (i < 4) { // First 4 customers get service agreements
        const now = new Date();
        const agreement = {
          customerId: customerId,
          customerName: customerInfo.name,
          customerAddress: customerInfo.address,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          branchId: branchId,
          createdBy: managerUser.uid,
          createdByName: 'Branch Manager',
          agreementType: Math.random() > 0.5 ? 'maintenance' : 'inspection',
          title: `${customerInfo.name} - ${Math.random() > 0.5 ? 'Maintenance' : 'Inspection'} Agreement`,
          description: `Service agreement for ${customerInfo.name}`,
          startDate: getRandomPastDate(30),
          endDate: getRandomFutureDate(335),
          nextServiceDate: getRandomFutureDate(Math.floor(Math.random() * 60) + 7),
          serviceFrequency: Math.random() > 0.5 ? 'annual' : 'quarterly',
          status: 'active',
          price: Math.floor(Math.random() * 50000) + 10000, // 10k-60k DKK
          currency: 'DKK',
          buildingId: buildingRef.id,
          isPublic: true,
          publicToken: generatePublicToken(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const agreementRef = await db.collection('serviceAgreements').add(agreement);
        created.serviceAgreements.push({ id: agreementRef.id, customerId: customerId });
        console.log(`    ✅ Created service agreement: ${agreement.title}`);
      }
      
      // Create scheduled visit for some customers
      if (i < 3 && created.inspectors.length > 0) { // First 3 customers get scheduled visits
        const visit = {
          branchId: branchId,
          customerId: customerId,
          customerName: customerInfo.name,
          customerAddress: customerInfo.address,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          buildingId: buildingRef.id,
          assignedInspectorId: created.inspectors[Math.floor(Math.random() * created.inspectors.length)].id,
          assignedInspectorName: created.inspectors[Math.floor(Math.random() * created.inspectors.length)].name,
          scheduledDate: getRandomFutureDate(Math.floor(Math.random() * 30) + 7),
          scheduledTime: `${Math.floor(Math.random() * 8) + 9}:00`, // 9:00-16:00
          duration: Math.floor(Math.random() * 120) + 60, // 60-180 minutes
          status: 'scheduled',
          visitType: Math.random() > 0.5 ? 'inspection' : 'maintenance',
          title: `Roof ${Math.random() > 0.5 ? 'Inspection' : 'Maintenance'} - ${customerInfo.buildingAddress}`,
          description: `Scheduled ${Math.random() > 0.5 ? 'inspection' : 'maintenance'} visit`,
          createdBy: managerUser.uid,
          createdByName: 'Branch Manager',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const visitRef = await db.collection('scheduledVisits').add(visit);
        created.scheduledVisits.push({ id: visitRef.id, customerId: customerId });
        console.log(`    ✅ Created scheduled visit: ${visit.scheduledDate} at ${visit.scheduledTime}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST DATA CREATION SUMMARY\n');
    console.log('='.repeat(80));
    
    console.log('\n✅ CREATED:');
    console.log(`  Branch ID: ${branchId}`);
    console.log(`  Customers: ${created.customers.length}`);
    created.customers.forEach((c, i) => {
      console.log(`    ${i + 1}. ${c.name} (${c.email})`);
    });
    console.log(`  Buildings: ${created.buildings.length}`);
    console.log(`  Reports: ${created.reports.length}`);
    const statusCounts = {};
    created.reports.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });
    console.log(`  Inspectors: ${created.inspectors.length}`);
    created.inspectors.forEach((insp, i) => {
      console.log(`    ${i + 1}. ${insp.name} (${insp.email})`);
    });
    console.log(`  Service Agreements: ${created.serviceAgreements.length}`);
    console.log(`  Scheduled Visits: ${created.scheduledVisits.length}`);
    
    console.log('\n📝 TEST CREDENTIALS:');
    console.log(`  Branch Manager: ${managerEmail} (existing user)`);
    created.inspectors.forEach(insp => {
      console.log(`  Inspector: ${insp.email} / Inspector123!`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ TEST DATA CREATION COMPLETE!\n');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await initializeFirebase();
    db = admin.firestore();
    auth = admin.auth();
    await createTestData();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
})();
