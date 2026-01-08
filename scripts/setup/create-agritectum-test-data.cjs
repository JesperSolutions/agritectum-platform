#!/usr/bin/env node

/**
 * Agritectum Test Data Creation Script
 * 
 * Creates comprehensive test data for Agritectum Platform:
 * - Test branch
 * - Test rooflayer/inspector
 * - 3 test customer users with buildings, service agreements, and scheduled visits
 * 
 * Usage: node scripts/setup/create-agritectum-test-data.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin for Agritectum project
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

// Geocode address (simplified - using Nominatim)
async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Agritectum Platform Test Data Script',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      }
    }
  } catch (error) {
    console.warn(`  ⚠️  Could not geocode ${address}: ${error.message}`);
  }
  return null;
}

async function createTestData() {
  console.log('🔧 CREATING AGRITECTUM TEST DATA\n');
  console.log('='.repeat(80));
  
  const now = new Date();

  const created = {
    branch: null,
    rooflayer: null,
    customers: [],
    companies: [],
    buildings: [],
    serviceAgreements: [],
    scheduledVisits: [],
  };
  
  try {
    // Step 1: Create or get test branch
    console.log('\n📋 STEP 1: CREATING TEST BRANCH\n');
    console.log('─'.repeat(80));
    
    const branchId = 'test-branch';
    const branchData = {
      id: branchId,
      name: 'Agritectum Test Branch',
      address: '123 Test Street, Copenhagen, Denmark',
      phone: '+45 12 34 56 78',
      email: 'test@agritectum.com',
      country: 'Denmark',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection('branches').doc(branchId).set(branchData);
    created.branch = branchId;
    console.log(`✅ Created branch: ${branchData.name} (${branchId})`);
    
    // Step 2: Create test rooflayer/inspector
    console.log('\n📋 STEP 2: CREATING TEST ROOFLAYER\n');
    console.log('─'.repeat(80));
    
    // Step 2a: Create test branch manager
    console.log('\n📋 STEP 2a: CREATING TEST BRANCH MANAGER\n');
    console.log('─'.repeat(80));
    
    const branchManagerEmail = 'branchmanager@agritectum.com';
    const branchManagerPassword = 'Test1234!';
    const branchManagerName = 'Test Branch Manager';
    
    let branchManagerUser;
    try {
      branchManagerUser = await auth.createUser({
        email: branchManagerEmail,
        password: branchManagerPassword,
        displayName: branchManagerName,
        emailVerified: false,
      });
      
      // Set custom claims
      await auth.setCustomUserClaims(branchManagerUser.uid, {
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
      });
      
      // Create user document
      await db.collection('users').doc(branchManagerUser.uid).set({
        uid: branchManagerUser.uid,
        email: branchManagerEmail,
        displayName: branchManagerName,
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
        userType: 'internal',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      
      console.log(`✅ Created branch manager: ${branchManagerEmail} (${branchManagerUser.uid})`);
      console.log(`   Password: ${branchManagerPassword}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Branch manager already exists, skipping...`);
      } else {
        throw error;
      }
    }
    
    const rooflayerEmail = 'rooflayer@agritectum.com';
    const rooflayerPassword = 'Test1234!';
    const rooflayerName = 'Test Rooflayer';
    
    let rooflayerUser;
    try {
      rooflayerUser = await auth.createUser({
        email: rooflayerEmail,
        password: rooflayerPassword,
        displayName: rooflayerName,
        emailVerified: false,
      });
      
      // Set custom claims
      await auth.setCustomUserClaims(rooflayerUser.uid, {
        role: 'inspector',
        permissionLevel: 0,
        branchId: branchId,
      });
      
      // Create user document
      await db.collection('users').doc(rooflayerUser.uid).set({
        uid: rooflayerUser.uid,
        email: rooflayerEmail,
        displayName: rooflayerName,
        role: 'inspector',
        permissionLevel: 0,
        branchId: branchId,
        userType: 'internal',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      
      created.rooflayer = rooflayerUser.uid;
      console.log(`✅ Created rooflayer: ${rooflayerEmail} (${rooflayerUser.uid})`);
      console.log(`   Password: ${rooflayerPassword}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Rooflayer already exists, skipping...`);
        // Try to find existing user
        const usersSnapshot = await db.collection('users').where('email', '==', rooflayerEmail).get();
        if (!usersSnapshot.empty) {
          created.rooflayer = usersSnapshot.docs[0].id;
        }
      } else {
        throw error;
      }
    }
    
    // Step 4: Create Customer 1 (Individual - 2 buildings, 2 agreements, 3 visits)
    console.log('\n📋 STEP 4: CREATING CUSTOMER 1 (Individual)\n');
    console.log('─'.repeat(80));
    
    const customer1Email = 'customer1@agritectum.com';
    const customer1Password = 'Test1234!';
    const customer1Name = 'John Customer';
    
    let customer1User;
    try {
      customer1User = await auth.createUser({
        email: customer1Email,
        password: customer1Password,
        displayName: customer1Name,
        emailVerified: false,
      });
      
      await auth.setCustomUserClaims(customer1User.uid, {
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
      });
      
      await db.collection('users').doc(customer1User.uid).set({
        uid: customer1User.uid,
        email: customer1Email,
        displayName: customer1Name,
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
        customerProfile: {
          phone: '+45 11 22 33 44',
          address: 'Copenhagen Street 10, 2100 Copenhagen, Denmark',
        },
        createdAt: new Date().toISOString(),
      });
      
      created.customers.push({ id: customer1User.uid, email: customer1Email });
      console.log(`✅ Created customer 1: ${customer1Email}`);
      
      // Create 2 buildings for customer 1
      const building1_1 = {
        customerId: customer1User.uid,
        address: 'Copenhagen Street 10, 2100 Copenhagen, Denmark',
        buildingType: 'residential',
        roofType: 'tile',
        roofSize: 120,
        branchId: branchId,
        createdBy: customer1User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const coords1_1 = await geocodeAddress(building1_1.address);
      if (coords1_1) {
        building1_1.latitude = coords1_1.lat;
        building1_1.longitude = coords1_1.lon;
      }
      
      const building1_1Ref = await db.collection('buildings').add(building1_1);
      created.buildings.push({ id: building1_1Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created building 1: ${building1_1.address}`);
      
      const building1_2 = {
        customerId: customer1User.uid,
        address: 'Aarhus Boulevard 25, 8000 Aarhus, Denmark',
        buildingType: 'commercial',
        roofType: 'flat',
        roofSize: 250,
        branchId: branchId,
        createdBy: customer1User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const coords1_2 = await geocodeAddress(building1_2.address);
      if (coords1_2) {
        building1_2.latitude = coords1_2.lat;
        building1_2.longitude = coords1_2.lon;
      }
      
      const building1_2Ref = await db.collection('buildings').add(building1_2);
      created.buildings.push({ id: building1_2Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created building 2: ${building1_2.address}`);
      
      // Create 2 service agreements for customer 1
      const now = new Date();
      const agreement1_1 = {
        customerId: customer1User.uid,
        customerName: customer1Name,
        customerAddress: building1_1.address,
        customerEmail: customer1Email,
        customerPhone: '+45 11 22 33 44',
        branchId: branchId,
        createdBy: customer1User.uid,
        createdByName: customer1Name,
        agreementType: 'maintenance',
        title: 'Annual Roof Maintenance',
        description: 'Complete annual maintenance including cleaning, inspection, and minor repairs',
        startDate: now.toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextServiceDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceFrequency: 'annual',
        status: 'active',
        price: 15000,
        currency: 'DKK',
        buildingId: building1_1Ref.id,
        isPublic: true,
        publicToken: generatePublicToken(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const coordsAgreement1_1 = await geocodeAddress(agreement1_1.customerAddress);
      if (coordsAgreement1_1) {
        agreement1_1.latitude = coordsAgreement1_1.lat;
        agreement1_1.longitude = coordsAgreement1_1.lon;
      }
      
      const agreement1_1Ref = await db.collection('serviceAgreements').add(agreement1_1);
      created.serviceAgreements.push({ id: agreement1_1Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created service agreement 1: ${agreement1_1.title}`);
      
      const agreement1_2 = {
        customerId: customer1User.uid,
        customerName: customer1Name,
        customerAddress: building1_2.address,
        customerEmail: customer1Email,
        customerPhone: '+45 11 22 33 44',
        branchId: branchId,
        createdBy: customer1User.uid,
        createdByName: customer1Name,
        agreementType: 'inspection',
        title: 'Quarterly Roof Inspection',
        description: 'Regular quarterly inspections to ensure roof condition',
        startDate: now.toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextServiceDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceFrequency: 'quarterly',
        status: 'active',
        price: 5000,
        currency: 'DKK',
        buildingId: building1_2Ref.id,
        isPublic: true,
        publicToken: generatePublicToken(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const coordsAgreement1_2 = await geocodeAddress(agreement1_2.customerAddress);
      if (coordsAgreement1_2) {
        agreement1_2.latitude = coordsAgreement1_2.lat;
        agreement1_2.longitude = coordsAgreement1_2.lon;
      }
      
      const agreement1_2Ref = await db.collection('serviceAgreements').add(agreement1_2);
      created.serviceAgreements.push({ id: agreement1_2Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created service agreement 2: ${agreement1_2.title}`);
      
      // Create 3 scheduled visits for customer 1
      const visit1_1 = {
        branchId: branchId,
        customerId: customer1User.uid,
        customerName: customer1Name,
        customerAddress: building1_1.address,
        customerEmail: customer1Email,
        customerPhone: '+45 11 22 33 44',
        buildingId: building1_1Ref.id,
        assignedInspectorId: created.rooflayer,
        assignedInspectorName: rooflayerName,
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '10:00',
        duration: 120,
        status: 'scheduled',
        visitType: 'inspection',
        title: `Roof Inspection - ${building1_1.address}`,
        description: 'Annual maintenance inspection',
        createdBy: created.rooflayer,
        createdByName: rooflayerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const visit1_1Ref = await db.collection('scheduledVisits').add(visit1_1);
      created.scheduledVisits.push({ id: visit1_1Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created scheduled visit 1: ${visit1_1.scheduledDate} at ${visit1_1.scheduledTime}`);
      
      const visit1_2 = {
        ...visit1_1,
        buildingId: building1_2Ref.id,
        customerAddress: building1_2.address,
        scheduledDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '14:00',
        title: `Roof Inspection - ${building1_2.address}`,
      };
      
      const visit1_2Ref = await db.collection('scheduledVisits').add(visit1_2);
      created.scheduledVisits.push({ id: visit1_2Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created scheduled visit 2: ${visit1_2.scheduledDate} at ${visit1_2.scheduledTime}`);
      
      const visit1_3 = {
        ...visit1_1,
        scheduledDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '09:00',
        visitType: 'maintenance',
        title: `Roof Maintenance - ${building1_1.address}`,
        description: 'Scheduled maintenance visit',
      };
      
      const visit1_3Ref = await db.collection('scheduledVisits').add(visit1_3);
      created.scheduledVisits.push({ id: visit1_3Ref.id, customerId: customer1User.uid });
      console.log(`  ✅ Created scheduled visit 3: ${visit1_3.scheduledDate} at ${visit1_3.scheduledTime}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Customer 1 already exists, skipping...`);
      } else {
        throw error;
      }
    }
    
    // Step 5: Create Customer 2 (Company - 1 company, 2 buildings, 1 agreement, 2 visits)
    console.log('\n📋 STEP 5: CREATING CUSTOMER 2 (Company)\n');
    console.log('─'.repeat(80));
    
    const customer2Email = 'customer2@agritectum.com';
    const customer2Password = 'Test1234!';
    const customer2Name = 'Jane Company Owner';
    const companyName = 'Test Property Management A/S';
    
    let customer2User;
    try {
      customer2User = await auth.createUser({
        email: customer2Email,
        password: customer2Password,
        displayName: customer2Name,
        emailVerified: false,
      });
      
      // Create company first
      const company2 = {
        name: companyName,
        address: 'Business Park 5, 2300 Copenhagen, Denmark',
        phone: '+45 22 33 44 55',
        email: customer2Email,
        cvrNumber: '12345678',
        branchId: branchId,
        isActive: true,
        createdBy: customer2User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const company2Ref = await db.collection('companies').add(company2);
      created.companies.push({ id: company2Ref.id });
      console.log(`✅ Created company: ${companyName} (${company2Ref.id})`);
      
      await auth.setCustomUserClaims(customer2User.uid, {
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
        companyId: company2Ref.id,
      });
      
      await db.collection('users').doc(customer2User.uid).set({
        uid: customer2User.uid,
        email: customer2Email,
        displayName: customer2Name,
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
        companyId: company2Ref.id,
        customerProfile: {
          phone: '+45 22 33 44 55',
          address: company2.address,
          companyName: companyName,
        },
        createdAt: new Date().toISOString(),
      });
      
      created.customers.push({ id: customer2User.uid, email: customer2Email });
      console.log(`✅ Created customer 2: ${customer2Email}`);
      
      // Create 2 buildings for company
      const building2_1 = {
        companyId: company2Ref.id,
        customerId: customer2User.uid,
        address: 'Business Park 5, Building A, 2300 Copenhagen, Denmark',
        buildingType: 'commercial',
        roofType: 'flat',
        roofSize: 500,
        branchId: branchId,
        createdBy: customer2User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const coords2_1 = await geocodeAddress(building2_1.address);
      if (coords2_1) {
        building2_1.latitude = coords2_1.lat;
        building2_1.longitude = coords2_1.lon;
      }
      
      const building2_1Ref = await db.collection('buildings').add(building2_1);
      created.buildings.push({ id: building2_1Ref.id, companyId: company2Ref.id });
      console.log(`  ✅ Created building 1: ${building2_1.address}`);
      
      const building2_2 = {
        companyId: company2Ref.id,
        customerId: customer2User.uid,
        address: 'Business Park 5, Building B, 2300 Copenhagen, Denmark',
        buildingType: 'commercial',
        roofType: 'metal',
        roofSize: 350,
        branchId: branchId,
        createdBy: customer2User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const coords2_2 = await geocodeAddress(building2_2.address);
      if (coords2_2) {
        building2_2.latitude = coords2_2.lat;
        building2_2.longitude = coords2_2.lon;
      }
      
      const building2_2Ref = await db.collection('buildings').add(building2_2);
      created.buildings.push({ id: building2_2Ref.id, companyId: company2Ref.id });
      console.log(`  ✅ Created building 2: ${building2_2.address}`);
      
      // Create 1 service agreement for customer 2
      const agreement2_1 = {
        customerId: customer2User.uid,
        customerName: customer2Name,
        customerAddress: building2_1.address,
        customerEmail: customer2Email,
        customerPhone: '+45 22 33 44 55',
        branchId: branchId,
        createdBy: customer2User.uid,
        createdByName: customer2Name,
        agreementType: 'maintenance',
        title: 'Commercial Building Maintenance',
        description: 'Comprehensive maintenance for commercial properties',
        startDate: now.toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextServiceDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceFrequency: 'quarterly',
        status: 'active',
        price: 35000,
        currency: 'DKK',
        buildingId: building2_1Ref.id,
        companyId: company2Ref.id,
        isPublic: true,
        publicToken: generatePublicToken(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const coordsAgreement2_1 = await geocodeAddress(agreement2_1.customerAddress);
      if (coordsAgreement2_1) {
        agreement2_1.latitude = coordsAgreement2_1.lat;
        agreement2_1.longitude = coordsAgreement2_1.lon;
      }
      
      const agreement2_1Ref = await db.collection('serviceAgreements').add(agreement2_1);
      created.serviceAgreements.push({ id: agreement2_1Ref.id, customerId: customer2User.uid });
      console.log(`  ✅ Created service agreement: ${agreement2_1.title}`);
      
      // Create 2 scheduled visits for customer 2
      const visit2_1 = {
        branchId: branchId,
        customerId: customer2User.uid,
        customerName: customer2Name,
        customerAddress: building2_1.address,
        customerEmail: customer2Email,
        customerPhone: '+45 22 33 44 55',
        buildingId: building2_1Ref.id,
        companyId: company2Ref.id,
        assignedInspectorId: created.rooflayer,
        assignedInspectorName: rooflayerName,
        scheduledDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '10:00',
        duration: 180,
        status: 'scheduled',
        visitType: 'maintenance',
        title: `Roof Maintenance - ${building2_1.address}`,
        description: 'Quarterly maintenance visit',
        createdBy: created.rooflayer,
        createdByName: rooflayerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const visit2_1Ref = await db.collection('scheduledVisits').add(visit2_1);
      created.scheduledVisits.push({ id: visit2_1Ref.id, customerId: customer2User.uid });
      console.log(`  ✅ Created scheduled visit 1: ${visit2_1.scheduledDate} at ${visit2_1.scheduledTime}`);
      
      const visit2_2 = {
        ...visit2_1,
        buildingId: building2_2Ref.id,
        customerAddress: building2_2.address,
        scheduledDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '13:00',
        title: `Roof Inspection - ${building2_2.address}`,
        visitType: 'inspection',
      };
      
      const visit2_2Ref = await db.collection('scheduledVisits').add(visit2_2);
      created.scheduledVisits.push({ id: visit2_2Ref.id, customerId: customer2User.uid });
      console.log(`  ✅ Created scheduled visit 2: ${visit2_2.scheduledDate} at ${visit2_2.scheduledTime}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Customer 2 already exists, skipping...`);
      } else {
        throw error;
      }
    }
    
    // Step 6: Create Customer 3 (Individual - 1 building, 1 agreement, 1 visit)
    console.log('\n📋 STEP 6: CREATING CUSTOMER 3 (Individual)\n');
    console.log('─'.repeat(80));
    
    const customer3Email = 'customer3@agritectum.com';
    const customer3Password = 'Test1234!';
    const customer3Name = 'Bob Property Owner';
    
    let customer3User;
    try {
      customer3User = await auth.createUser({
        email: customer3Email,
        password: customer3Password,
        displayName: customer3Name,
        emailVerified: false,
      });
      
      await auth.setCustomUserClaims(customer3User.uid, {
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
      });
      
      await db.collection('users').doc(customer3User.uid).set({
        uid: customer3User.uid,
        email: customer3Email,
        displayName: customer3Name,
        role: 'customer',
        permissionLevel: -1,
        userType: 'customer',
        customerProfile: {
          phone: '+45 33 44 55 66',
          address: 'Odense Street 42, 5000 Odense, Denmark',
        },
        createdAt: new Date().toISOString(),
      });
      
      created.customers.push({ id: customer3User.uid, email: customer3Email });
      console.log(`✅ Created customer 3: ${customer3Email}`);
      
      // Create 1 building for customer 3
      const building3_1 = {
        customerId: customer3User.uid,
        address: 'Odense Street 42, 5000 Odense, Denmark',
        buildingType: 'residential',
        roofType: 'shingle',
        roofSize: 80,
        branchId: branchId,
        createdBy: customer3User.uid,
        createdAt: new Date().toISOString(),
      };
      
      const coords3_1 = await geocodeAddress(building3_1.address);
      if (coords3_1) {
        building3_1.latitude = coords3_1.lat;
        building3_1.longitude = coords3_1.lon;
      }
      
      const building3_1Ref = await db.collection('buildings').add(building3_1);
      created.buildings.push({ id: building3_1Ref.id, customerId: customer3User.uid });
      console.log(`  ✅ Created building: ${building3_1.address}`);
      
      // Create 1 service agreement for customer 3
      const agreement3_1 = {
        customerId: customer3User.uid,
        customerName: customer3Name,
        customerAddress: building3_1.address,
        customerEmail: customer3Email,
        customerPhone: '+45 33 44 55 66',
        branchId: branchId,
        createdBy: customer3User.uid,
        createdByName: customer3Name,
        agreementType: 'inspection',
        title: 'Annual Roof Inspection',
        description: 'Annual inspection and condition assessment',
        startDate: now.toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextServiceDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceFrequency: 'annual',
        status: 'active',
        price: 8000,
        currency: 'DKK',
        buildingId: building3_1Ref.id,
        isPublic: true,
        publicToken: generatePublicToken(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const coordsAgreement3_1 = await geocodeAddress(agreement3_1.customerAddress);
      if (coordsAgreement3_1) {
        agreement3_1.latitude = coordsAgreement3_1.lat;
        agreement3_1.longitude = coordsAgreement3_1.lon;
      }
      
      const agreement3_1Ref = await db.collection('serviceAgreements').add(agreement3_1);
      created.serviceAgreements.push({ id: agreement3_1Ref.id, customerId: customer3User.uid });
      console.log(`  ✅ Created service agreement: ${agreement3_1.title}`);
      
      // Create 1 scheduled visit for customer 3
      const visit3_1 = {
        branchId: branchId,
        customerId: customer3User.uid,
        customerName: customer3Name,
        customerAddress: building3_1.address,
        customerEmail: customer3Email,
        customerPhone: '+45 33 44 55 66',
        buildingId: building3_1Ref.id,
        assignedInspectorId: created.rooflayer,
        assignedInspectorName: rooflayerName,
        scheduledDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '11:00',
        duration: 90,
        status: 'scheduled',
        visitType: 'inspection',
        title: `Roof Inspection - ${building3_1.address}`,
        description: 'Annual inspection visit',
        createdBy: created.rooflayer,
        createdByName: rooflayerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const visit3_1Ref = await db.collection('scheduledVisits').add(visit3_1);
      created.scheduledVisits.push({ id: visit3_1Ref.id, customerId: customer3User.uid });
      console.log(`  ✅ Created scheduled visit: ${visit3_1.scheduledDate} at ${visit3_1.scheduledTime}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Customer 3 already exists, skipping...`);
      } else {
        throw error;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST DATA CREATION SUMMARY\n');
    console.log('='.repeat(80));
    
    console.log('\n✅ CREATED:');
    console.log(`  Branch: ${created.branch || 'N/A'}`);
    console.log(`  Rooflayer: ${created.rooflayer || 'N/A'}`);
    console.log(`  Customers: ${created.customers.length}`);
    created.customers.forEach((c, i) => {
      console.log(`    ${i + 1}. ${c.email}`);
    });
    console.log(`  Companies: ${created.companies.length}`);
    console.log(`  Buildings: ${created.buildings.length}`);
    console.log(`  Service Agreements: ${created.serviceAgreements.length}`);
    console.log(`  Scheduled Visits: ${created.scheduledVisits.length}`);
    
    console.log('\n📝 TEST CREDENTIALS:');
    console.log(`  Branch Manager: ${branchManagerEmail} / ${branchManagerPassword}`);
    console.log(`  Rooflayer: ${rooflayerEmail} / ${rooflayerPassword}`);
    console.log(`  Customer 1: ${customer1Email} / ${customer1Password}`);
    console.log(`  Customer 2: ${customer2Email} / ${customer2Password}`);
    console.log(`  Customer 3: ${customer3Email} / ${customer3Password}`);
    
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

