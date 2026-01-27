/**
 * Script to properly fix customer/company relationships
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

async function fixCustomerRelationships() {
  try {
    const agreementId = '3cBQqTBBnrqAaKjgvpt3';
    const customerEmail = 'leitz@kluthdach.de';
    
    console.log('🔧 Fixing customer/company relationships...\n');
    
    // Get user
    const userRecord = await admin.auth().getUserByEmail(customerEmail);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    console.log('👤 User Info:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Company ID: ${userData.companyId}`);
    
    // Get agreement
    const agreementDoc = await db.collection('serviceAgreements').doc(agreementId).get();
    const agreement = agreementDoc.data();
    
    console.log('\n📄 Current Agreement:');
    console.log(`   Customer ID: ${agreement.customerId}`);
    console.log(`   Company ID: ${agreement.companyId || 'NOT SET'}`);
    console.log(`   Building ID: ${agreement.buildingId}`);
    
    // Update agreement
    console.log('\n🔧 Updating agreement...');
    await db.collection('serviceAgreements').doc(agreementId).update({
      customerId: userRecord.uid,
      companyId: userData.companyId,
      updatedAt: new Date().toISOString(),
    });
    console.log('   ✅ Agreement updated');
    console.log(`      customerId: ${agreement.customerId} → ${userRecord.uid}`);
    console.log(`      companyId: ${agreement.companyId || 'NOT SET'} → ${userData.companyId}`);
    
    // Update building if needed
    if (agreement.buildingId) {
      const buildingDoc = await db.collection('buildings').doc(agreement.buildingId).get();
      const building = buildingDoc.data();
      
      console.log('\n🏢 Current Building:');
      console.log(`   Customer ID: ${building.customerId}`);
      console.log(`   Company ID: ${building.companyId || 'NOT SET'}`);
      
      if (building.customerId !== userRecord.uid || building.companyId !== userData.companyId) {
        console.log('\n🔧 Updating building...');
        await db.collection('buildings').doc(agreement.buildingId).update({
          customerId: userRecord.uid,
          companyId: userData.companyId,
          updatedAt: new Date().toISOString(),
        });
        console.log('   ✅ Building updated');
        console.log(`      customerId: ${building.customerId} → ${userRecord.uid}`);
        console.log(`      companyId: ${building.companyId || 'NOT SET'} → ${userData.companyId}`);
      } else {
        console.log('   ℹ️  Building already has correct IDs');
      }
    }
    
    console.log('\n✅ All relationships fixed!');
    console.log('\n💡 The customer should now be able to access:');
    console.log(`   - Service agreement: https://agritectum-platform.web.app/portal/service-agreements/${agreementId}`);
    console.log(`   - Building: https://agritectum-platform.web.app/portal/buildings/${agreement.buildingId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
fixCustomerRelationships()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
