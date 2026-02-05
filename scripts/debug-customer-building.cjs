const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function checkCustomerSetup() {
  try {
    // Check customer
    const userRecord = await auth.getUserByEmail('leitz@kluthdach.de');
    const userUid = userRecord.uid;
    
    console.log(`\nChecking customer: ${userRecord.displayName} (${userUid})`);
    
    const userRef = db.collection('users').doc(userUid);
    const userSnap = await userRef.get();
    
    if (userSnap.exists) {
      const userData = userSnap.data();
      console.log(`\nUser document:`);
      console.log(JSON.stringify(userData, null, 2));
    } else {
      console.log('\n❌ User document not found!');
    }
    
    // Check building
    const buildingSnap = await db.collection('buildings').doc('boxcGweJAnWpW3YTO5AS').get();
    if (buildingSnap.exists) {
      const buildingData = buildingSnap.data();
      console.log(`\nBuilding document:`);
      console.log(`  customerId: ${buildingData.customerId}`);
      console.log(`  branchId: ${buildingData.branchId}`);
      console.log(`  address: ${buildingData.address}`);
      
      if (userSnap.exists) {
        const userBranchId = userSnap.data().branchId;
        console.log(`\n⚠️  MISMATCH CHECK:`);
        console.log(`  User's branchId: ${userBranchId}`);
        console.log(`  Building's branchId: ${buildingData.branchId}`);
        if (userBranchId === buildingData.branchId) {
          console.log(`  ✓ Branches match`);
        } else {
          console.log(`  ❌ Branches DON'T match - this is why the query fails!`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    admin.app().delete();
  }
}

checkCustomerSetup();
