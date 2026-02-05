const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkMismatch() {
  const buildingId = 'boxcGweJAnWpW3YTO5AS';
  
  try {
    const buildingSnap = await db.collection('buildings').doc(buildingId).get();
    const building = buildingSnap.data();
    
    console.log('\n⚠️  CRITICAL ISSUE FOUND:\n');
    console.log(`Building URL/ID (not user UID): ${buildingId}`);
    console.log(`Building's createdBy (actual owner): ${building.createdBy}`);
    console.log(`Building's customerId: ${building.customerId}`);
    console.log(`\n❌ You are logged in as: boxcGweJAnWpW3YTO5AS`);
    console.log(`✓  But the building was created by: ${building.createdBy}\n`);
    
    console.log('EXPLANATION:');
    console.log('- The building ID in the URL (boxcGweJAnWpW3YTO5AS) is NOT your user UID');
    console.log('- It\'s just the building\'s document ID');
    console.log('- You cannot edit this building because you didn\'t create it');
    console.log('- The actual owner is: ' + building.createdBy);
    
    // Check if there's a user doc for the building creator
    const userSnap = await db.collection('users').doc(building.createdBy).get();
    if (userSnap.exists) {
      console.log('\nBuilding owner user doc exists:');
      console.log(JSON.stringify(userSnap.data(), null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    admin.app().delete();
  }
}

checkMismatch();
