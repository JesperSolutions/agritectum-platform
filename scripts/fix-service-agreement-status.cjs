/**
 * Script to check and fix service agreement status
 * Run with: node scripts/fix-service-agreement-status.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAndFixServiceAgreement() {
  try {
    console.log('🔍 Searching for service agreement...');
    
    // Search for the agreement by customer email
    const agreementsRef = db.collection('serviceAgreements');
    const snapshot = await agreementsRef
      .where('customerEmail', '==', 'leitz@kluthdach.de')
      .get();

    if (snapshot.empty) {
      console.log('❌ No service agreement found for leitz@kluthdach.de');
      console.log('Searching by customer name instead...');
      
      const nameSnapshot = await agreementsRef
        .where('customerName', '==', 'Kluth Dachbaustoffe GmbH')
        .get();
      
      if (nameSnapshot.empty) {
        console.log('❌ No service agreement found for Kluth Dachbaustoffe GmbH');
        console.log('\nListing all service agreements:');
        const allSnapshot = await agreementsRef.orderBy('createdAt', 'desc').limit(10).get();
        allSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`\n📄 Agreement ID: ${doc.id}`);
          console.log(`   Customer: ${data.customerName}`);
          console.log(`   Email: ${data.customerEmail}`);
          console.log(`   Status: ${data.status}`);
          console.log(`   Accepted: ${data.acceptedAt ? 'Yes' : 'No'}`);
          console.log(`   Building ID: ${data.buildingId || 'Not linked'}`);
        });
        return;
      }
      
      await processAgreements(nameSnapshot);
    } else {
      await processAgreements(snapshot);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function processAgreements(snapshot) {
  console.log(`\n✅ Found ${snapshot.size} agreement(s)\n`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`📄 Agreement ID: ${doc.id}`);
    console.log(`   Customer: ${data.customerName}`);
    console.log(`   Email: ${data.customerEmail}`);
    console.log(`   Agreement Type: ${data.agreementType}`);
    console.log(`   Current Status: ${data.status}`);
    console.log(`   Start Date: ${data.startDate}`);
    console.log(`   End Date: ${data.endDate}`);
    console.log(`   Accepted At: ${data.acceptedAt || 'Not accepted'}`);
    console.log(`   Accepted By: ${data.acceptedBy || 'N/A'}`);
    console.log(`   Signature URL: ${data.signatureUrl || 'No signature'}`);
    console.log(`   Building ID: ${data.buildingId || 'Not linked'}`);
    console.log(`   Sent to Portal: ${data.sentToPortal ? 'Yes' : 'No'}`);
    
    // Check if it needs fixing
    if (data.acceptedAt && data.status !== 'active') {
      console.log('\n⚠️  Issue detected: Agreement was accepted but status is not "active"');
      console.log('🔧 Fixing status...');
      
      await doc.ref.update({
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Status updated to "active"');
    } else if (data.acceptedAt && data.status === 'active') {
      console.log('\n✅ Agreement is properly accepted and active');
    } else {
      console.log('\n⚠️  Agreement has not been accepted yet');
    }
    
    // Check building link
    if (!data.buildingId) {
      console.log('\n⚠️  Warning: Agreement is not linked to a building');
      console.log('   This may be why it\'s not showing on the building page');
      
      // Try to find the building
      const buildingsSnapshot = await db.collection('buildings')
        .where('customerId', '==', data.customerId)
        .get();
      
      if (!buildingsSnapshot.empty) {
        console.log(`\n   Found ${buildingsSnapshot.size} building(s) for this customer:`);
        buildingsSnapshot.forEach(buildingDoc => {
          const building = buildingDoc.data();
          console.log(`   - Building ID: ${buildingDoc.id}`);
          console.log(`     Address: ${building.address}`);
        });
        
        if (buildingsSnapshot.size === 1) {
          const buildingId = buildingsSnapshot.docs[0].id;
          console.log(`\n   Would you like to link this agreement to building ${buildingId}?`);
          console.log('   Run with --fix flag to automatically link');
          
          if (process.argv.includes('--fix')) {
            await doc.ref.update({
              buildingId: buildingId,
              updatedAt: new Date().toISOString(),
            });
            console.log('   ✅ Agreement linked to building');
          }
        }
      } else {
        console.log('\n   ❌ No buildings found for this customer');
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the script
checkAndFixServiceAgreement()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
