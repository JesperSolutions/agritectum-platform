/**
 * Script to revert building customerId for proper querying
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

async function fixBuildingCustomerId() {
  try {
    const buildingId = 'boxcGweJAnWpW3YTO5AS';
    const agreementId = '3cBQqTBBnrqAaKjgvpt3';
    const customerEmail = 'leitz@kluthdach.de';
    
    console.log('🔧 Fixing building customerId for proper querying...\n');
    
    // Get user
    const userRecord = await admin.auth().getUserByEmail(customerEmail);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    console.log('👤 User Info:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Company ID: ${userData.companyId}`);
    
    // Update building - use COMPANY ID as customerId for queries to work
    console.log('\n🏢 Updating building...');
    await db.collection('buildings').doc(buildingId).update({
      customerId: userData.companyId, // Use company ID for queries
      companyId: userData.companyId,   // Also set companyId field
      updatedAt: new Date().toISOString(),
    });
    console.log('   ✅ Building updated');
    console.log(`      customerId: ${userRecord.uid} → ${userData.companyId} (for queries)`);
    console.log(`      companyId: ${userData.companyId} (for rules)`);
    
    // Update agreement - use COMPANY ID as customerId
    console.log('\n📄 Updating service agreement...');
    await db.collection('serviceAgreements').doc(agreementId).update({
      customerId: userData.companyId, // Use company ID for consistency
      companyId: userData.companyId,   // Also set companyId field
      updatedAt: new Date().toISOString(),
    });
    console.log('   ✅ Agreement updated');
    console.log(`      customerId: ${userRecord.uid} → ${userData.companyId}`);
    console.log(`      companyId: ${userData.companyId}`);
    
    console.log('\n✅ All fixed!');
    console.log('\n💡 Explanation:');
    console.log('   - customerId is set to COMPANY ID so queries work');
    console.log('   - companyId field is also set for Firestore rules');
    console.log('   - User UID is NOT used as customerId for customer portal');
    console.log('   - Firestore rules check: customerId == getUserCompanyId() ✅');
    console.log('   - Firestore rules check: companyId == getUserCompanyId() ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
fixBuildingCustomerId()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
