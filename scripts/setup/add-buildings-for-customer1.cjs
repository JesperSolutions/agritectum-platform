#!/usr/bin/env node

/**
 * Add Buildings for customer1@agritectum.com
 * 
 * Creates buildings for customer1@agritectum.com with proper coordinates
 * so the map feature can be tested.
 * 
 * Usage: node scripts/setup/add-buildings-for-customer1.cjs
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

// Geocode address using Nominatim API (OpenStreetMap)
async function geocodeAddress(address) {
  try {
    if (!address || address.trim().length < 5) {
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Agritectum Platform',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding address "${address}":`, error.message);
    return null;
  }
}

async function addBuildingsForCustomer1() {
  console.log('🔧 ADDING BUILDINGS FOR customer1@agritectum.com\n');
  console.log('='.repeat(80));
  
  await initializeFirebase();
  db = admin.firestore();
  auth = admin.auth();
  
  try {
    // Step 1: Find customer1@agritectum.com user
    console.log('\n📋 STEP 1: FINDING CUSTOMER1 USER\n');
    console.log('─'.repeat(80));
    
    const customerEmail = 'customer1@agritectum.com';
    let customer1User;
    let customer1Id;
    
    try {
      customer1User = await auth.getUserByEmail(customerEmail);
      customer1Id = customer1User.uid;
      console.log(`✅ Found customer: ${customerEmail}`);
      console.log(`   User ID: ${customer1Id}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ Customer not found: ${customerEmail}`);
        console.log('⚠️  Please create the customer first using create-agritectum-test-data.cjs');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    // Step 2: Find branch.manager user to get branchId
    console.log('\n📋 STEP 2: FINDING BRANCH MANAGER\n');
    console.log('─'.repeat(80));
    
    let branchId;
    try {
      const branchManagerUser = await auth.getUserByEmail('branch.manager@agritectum-platform.web.app');
      const customClaims = branchManagerUser.customClaims || {};
      branchId = customClaims.branchId || 'main';
      console.log(`✅ Found branch manager, using branchId: ${branchId}`);
    } catch (error) {
      console.log('⚠️  Using default branchId: main');
      branchId = 'main';
    }
    
    // Step 3: Check existing buildings
    console.log('\n📋 STEP 3: CHECKING EXISTING BUILDINGS\n');
    console.log('─'.repeat(80));
    
    const existingBuildingsQuery = await db.collection('buildings')
      .where('customerId', '==', customer1Id)
      .get();
    
    const existingBuildings = existingBuildingsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (existingBuildings.length > 0) {
      console.log(`ℹ️  Found ${existingBuildings.length} existing building(s):`);
      existingBuildings.forEach(building => {
        console.log(`   - ${building.address} (${building.id})`);
      });
      console.log('⚠️  Will add additional buildings...');
    } else {
      console.log('ℹ️  No existing buildings found. Will create new ones.');
    }
    
    // Step 4: Create buildings with coordinates
    console.log('\n🏢 STEP 4: CREATING BUILDINGS\n');
    console.log('─'.repeat(80));
    
    // Building data - using real Danish addresses
    const buildingsData = [
      {
        address: 'Nørregade 10, 1165 København, Denmark',
        buildingType: 'residential',
        roofType: 'tile',
        roofSize: 120,
      },
      {
        address: 'Strøget 15, 1200 København, Denmark',
        buildingType: 'commercial',
        roofType: 'flat',
        roofSize: 250,
      },
      {
        address: 'Vesterbrogade 22, 1620 København, Denmark',
        buildingType: 'residential',
        roofType: 'metal',
        roofSize: 180,
      },
      {
        address: 'Østergade 5, 1100 København, Denmark',
        buildingType: 'commercial',
        roofType: 'flat',
        roofSize: 300,
      },
    ];
    
    const createdBuildings = [];
    
    for (const buildingData of buildingsData) {
      try {
        // Geocode address
        console.log(`\n   📍 Geocoding: ${buildingData.address}`);
        const coords = await geocodeAddress(buildingData.address);
        
        if (!coords) {
          console.log(`   ⚠️  Could not geocode address, skipping coordinates`);
        } else {
          console.log(`   ✅ Coordinates: ${coords.lat}, ${coords.lon}`);
        }
        
        // Create building document
        const buildingDoc = {
          customerId: customer1Id,
          address: buildingData.address,
          buildingType: buildingData.buildingType,
          roofType: buildingData.roofType,
          roofSize: buildingData.roofSize,
          branchId: branchId,
          createdBy: customer1Id,
          createdAt: new Date().toISOString(),
          ...(coords ? { latitude: coords.lat, longitude: coords.lon } : {}),
        };
        
        const buildingRef = await db.collection('buildings').add(removeUndefinedFields(buildingDoc));
        const buildingId = buildingRef.id;
        createdBuildings.push({ id: buildingId, address: buildingData.address });
        
        console.log(`   ✅ Created building: ${buildingData.address} (${buildingId})`);
        console.log(`      Type: ${buildingData.buildingType}, Roof: ${buildingData.roofType}, Size: ${buildingData.roofSize}m²`);
      } catch (error) {
        console.error(`   ❌ Error creating building ${buildingData.address}:`, error.message);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ BUILDINGS CREATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Customer: ${customerEmail}`);
    console.log(`   - Buildings created: ${createdBuildings.length}`);
    createdBuildings.forEach((building, index) => {
      console.log(`     ${index + 1}. ${building.address} (${building.id})`);
    });
    console.log('='.repeat(80));
    console.log('\n💡 Buildings are now available for testing the map feature!\n');
    
  } catch (error) {
    console.error('\n❌ Error adding buildings:', error);
    throw error;
  }
}

// Run the script
addBuildingsForCustomer1()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
