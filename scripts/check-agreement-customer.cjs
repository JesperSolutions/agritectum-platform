/**
 * Script to check service agreement customer ID and user authentication
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAgreementAndUser() {
  try {
    const agreementId = '3cBQqTBBnrqAaKjgvpt3';
    const customerEmail = 'leitz@kluthdach.de';
    
    console.log('🔍 Checking service agreement and user...\n');
    
    // Get the service agreement
    const agreementDoc = await db.collection('serviceAgreements').doc(agreementId).get();
    if (!agreementDoc.exists) {
      console.log('❌ Agreement not found');
      return;
    }
    
    const agreement = agreementDoc.data();
    console.log('📄 Service Agreement:');
    console.log(`   ID: ${agreementId}`);
    console.log(`   Customer ID: ${agreement.customerId}`);
    console.log(`   Customer Name: ${agreement.customerName}`);
    console.log(`   Customer Email: ${agreement.customerEmail}`);
    console.log(`   Building ID: ${agreement.buildingId}`);
    console.log(`   Company ID: ${agreement.companyId}`);
    console.log(`   Branch ID: ${agreement.branchId}`);
    console.log(`   Is Public: ${agreement.isPublic}`);
    console.log(`   Status: ${agreement.status}`);
    
    // Check if building exists
    if (agreement.buildingId) {
      const buildingDoc = await db.collection('buildings').doc(agreement.buildingId).get();
      if (buildingDoc.exists) {
        const building = buildingDoc.data();
        console.log('\n🏢 Building:');
        console.log(`   ID: ${agreement.buildingId}`);
        console.log(`   Customer ID: ${building.customerId}`);
        console.log(`   Address: ${building.address}`);
      } else {
        console.log('\n⚠️  Building not found');
      }
    }
    
    // Find user by email
    console.log('\n👤 Looking up user by email...');
    const userRecord = await admin.auth().getUserByEmail(customerEmail);
    console.log(`   User UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`   Role: ${userData.role}`);
      console.log(`   Permission Level: ${userData.permissionLevel}`);
      console.log(`   Branch ID: ${userData.branchId}`);
      console.log(`   Company ID: ${userData.companyId}`);
      console.log(`   User Type: ${userData.userType}`);
    } else {
      console.log('   ⚠️  No Firestore user document found');
    }
    
    // Check access
    console.log('\n✅ Access Check:');
    const customerIdMatch = agreement.customerId === userRecord.uid;
    const companyIdMatch = agreement.companyId && userData?.companyId && agreement.companyId === userData.companyId;
    
    console.log(`   Customer ID matches: ${customerIdMatch}`);
    console.log(`   Company ID matches: ${companyIdMatch}`);
    
    if (agreement.buildingId) {
      const buildingDoc = await db.collection('buildings').doc(agreement.buildingId).get();
      if (buildingDoc.exists) {
        const building = buildingDoc.data();
        const buildingCustomerMatch = building.customerId === userRecord.uid;
        const buildingCompanyMatch = building.companyId && userData?.companyId && building.companyId === userData.companyId;
        console.log(`   Building customer ID matches: ${buildingCustomerMatch}`);
        console.log(`   Building company ID matches: ${buildingCompanyMatch}`);
      }
    }
    
    console.log('\n💡 Solution:');
    if (!customerIdMatch && !companyIdMatch) {
      console.log('   ⚠️  The agreement customerId needs to be updated to match the user UID');
      console.log(`   Current customerId: ${agreement.customerId}`);
      console.log(`   User UID: ${userRecord.uid}`);
      console.log(`   Run with --fix to update`);
      
      if (process.argv.includes('--fix')) {
        await db.collection('serviceAgreements').doc(agreementId).update({
          customerId: userRecord.uid,
          updatedAt: new Date().toISOString(),
        });
        console.log('   ✅ Agreement updated with correct customer ID');
      }
    } else {
      console.log('   ✅ Access should work correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
checkAgreementAndUser()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
