/**
 * Script to check building access for customer
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkBuildingAccess() {
  try {
    const buildingId = 'boxcGweJAnWpW3YTO5AS';
    const customerEmail = 'leitz@kluthdach.de';
    
    console.log('🔍 Checking building access...\n');
    
    // Get user
    const userRecord = await admin.auth().getUserByEmail(customerEmail);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    console.log('👤 User Info:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Company ID: ${userData.companyId}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Permission Level: ${userData.permissionLevel}`);
    
    // Get building
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      console.log('❌ Building not found');
      return;
    }
    
    const building = buildingDoc.data();
    console.log('\n🏢 Building Info:');
    console.log(`   ID: ${buildingId}`);
    console.log(`   Customer ID: ${building.customerId}`);
    console.log(`   Company ID: ${building.companyId || 'NOT SET'}`);
    console.log(`   Branch ID: ${building.branchId}`);
    console.log(`   Address: ${building.address}`);
    
    // Check access
    console.log('\n✅ Access Check:');
    const check1 = building.customerId === userRecord.uid;
    const check2 = building.customerId === userData.companyId;
    const check3 = building.companyId && building.companyId === userData.companyId;
    
    console.log(`   customerId == user.uid: ${check1} (${building.customerId} == ${userRecord.uid})`);
    console.log(`   customerId == user.companyId: ${check2} (${building.customerId} == ${userData.companyId})`);
    console.log(`   companyId == user.companyId: ${check3} (${building.companyId} == ${userData.companyId})`);
    
    const hasAccess = check1 || check2 || check3;
    console.log(`\n   ${hasAccess ? '✅' : '❌'} User ${hasAccess ? 'HAS' : 'DOES NOT HAVE'} access to this building`);
    
    // Get all buildings for this customer
    console.log('\n🏢 All Buildings for Customer:');
    const allBuildings = await db.collection('buildings')
      .where('customerId', '==', userRecord.uid)
      .get();
    
    console.log(`   Found ${allBuildings.size} building(s) with customerId = ${userRecord.uid}`);
    
    // Also check by company ID
    const companyBuildings = await db.collection('buildings')
      .where('companyId', '==', userData.companyId)
      .get();
    
    console.log(`   Found ${companyBuildings.size} building(s) with companyId = ${userData.companyId}`);
    
    // Check old company ID
    const oldBuildings = await db.collection('buildings')
      .where('customerId', '==', userData.companyId)
      .get();
    
    console.log(`   Found ${oldBuildings.size} building(s) with customerId = ${userData.companyId} (old way)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
checkBuildingAccess()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
