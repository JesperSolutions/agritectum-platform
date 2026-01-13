/**
 * Debug Auth Claims - Check actual custom claims for a user
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

async function checkClaims() {
  try {
    const email = 'branch.manager@agritectum.se';
    const user = await auth.getUserByEmail(email);
    
    console.log(`\n🔍 Checking claims for: ${email}`);
    console.log(`UID: ${user.uid}\n`);
    
    console.log('Custom Claims:');
    console.log(JSON.stringify(user.customClaims, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

checkClaims();
