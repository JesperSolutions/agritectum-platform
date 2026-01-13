import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function deleteTestUser() {
  try {
    console.log('🗑️  Deleting old test user...');
    
    // Delete Firebase Auth user
    try {
      await auth.deleteUser('test-user-dk-001');
      console.log('✅ Firebase Auth user deleted');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️  Auth user already deleted');
      } else {
        throw error;
      }
    }
    
    // Delete Firestore user document
    try {
      await db.collection('users').doc('test-user-dk-001').delete();
      console.log('✅ Firestore user document deleted');
    } catch (error) {
      console.log('⚠️  Firestore user document deletion error:', error.message);
    }
    
    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteTestUser();
