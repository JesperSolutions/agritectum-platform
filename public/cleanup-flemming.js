/**
 * Cleanup Script for Flemming's Test Data
 * 
 * HOW TO USE:
 * 1. Open Firebase Console: https://console.firebase.google.com
 * 2. Go to Firestore Database
 * 3. Open the browser console (F12)
 * 4. Copy and paste the code below
 * 5. Run: cleanupFlemmingData()
 * 
 * This will delete all data created by: flemming.adolfsen@agritectum.dk
 */

// Make sure you're authenticated and have Firestore initialized
const flemmingEmail = 'flemming.adolfsen@agritectum.dk';

async function cleanupFlemmingData() {
  const db = firebase.firestore();
  
  console.log('🔍 Starting cleanup of Flemming\'s data...\n');
  
  if (!confirm(`⚠️ WARNING: This will DELETE all data created by ${flemmingEmail}\n\nContinue?`)) {
    console.log('❌ Cleanup cancelled');
    return;
  }
  
  let buildingsDeleted = 0;
  let customersDeleted = 0;
  let reportsDeleted = 0;
  let errorsEncountered = 0;

  try {
    // Delete buildings
    console.log('📦 Deleting buildings...');
    const buildingsSnapshot = await db.collection('buildings')
      .where('createdBy', '==', flemmingEmail)
      .get();

    console.log(`Found ${buildingsSnapshot.docs.length} buildings to delete`);
    
    for (const doc of buildingsSnapshot.docs) {
      try {
        await doc.ref.delete();
        buildingsDeleted++;
        console.log(`✓ Deleted building: ${doc.id}`);
      } catch (error) {
        console.error(`✗ Error deleting building ${doc.id}:`, error.message);
        errorsEncountered++;
      }
    }

    // Delete customers
    console.log('\n👥 Deleting customers...');
    const customersSnapshot = await db.collection('customers')
      .where('createdBy', '==', flemmingEmail)
      .get();

    console.log(`Found ${customersSnapshot.docs.length} customers to delete`);
    
    for (const doc of customersSnapshot.docs) {
      try {
        await doc.ref.delete();
        customersDeleted++;
        console.log(`✓ Deleted customer: ${doc.id} (${doc.data().name})`);
      } catch (error) {
        console.error(`✗ Error deleting customer ${doc.id}:`, error.message);
        errorsEncountered++;
      }
    }

    // Delete reports
    console.log('\n📄 Deleting reports...');
    const reportsSnapshot = await db.collection('reports')
      .where('createdBy', '==', flemmingEmail)
      .get();

    console.log(`Found ${reportsSnapshot.docs.length} reports to delete`);
    
    for (const doc of reportsSnapshot.docs) {
      try {
        await doc.ref.delete();
        reportsDeleted++;
        console.log(`✓ Deleted report: ${doc.id}`);
      } catch (error) {
        console.error(`✗ Error deleting report ${doc.id}:`, error.message);
        errorsEncountered++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`✓ Buildings deleted:  ${buildingsDeleted}`);
    console.log(`✓ Customers deleted:  ${customersDeleted}`);
    console.log(`✓ Reports deleted:    ${reportsDeleted}`);
    console.log(`⚠️ Errors encountered: ${errorsEncountered}`);
    console.log('='.repeat(60));

    if (errorsEncountered === 0) {
      console.log('\n✨ All of Flemming\'s data has been cleaned successfully!');
      console.log('You can now create new test data with proper customer linking.');
    } else {
      console.log(`\n⚠️ Some errors occurred. Check the logs above.`);
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
  }
}

// Run the cleanup
console.log('Running cleanupFlemmingData()...');
cleanupFlemmingData();
