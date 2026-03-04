import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findMarcus() {
  try {
    console.log('🔍 Searching for Marcus with email marcusleitz@me.com...\n');
    
    // Search in users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'marcusleitz@me.com')
      .get();
    
    if (!usersSnapshot.empty) {
      console.log('✅ Found Marcus in users collection:');
      usersSnapshot.forEach(doc => {
        console.log(`\nUser ID: ${doc.id}`);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('❌ Not found in users collection with that email.');
      
      // Try searching by name
      console.log('\n🔍 Searching by name "marcus"...\n');
      const nameSearch = await db.collection('users').get();
      
      nameSearch.forEach(doc => {
        const data = doc.data();
        const name = (data.name || data.displayName || '').toLowerCase();
        if (name.includes('marcus')) {
          console.log(`\n✅ Found: ${doc.id}`);
          console.log('Data:', JSON.stringify(data, null, 2));
        }
      });
    }
    
    // Also check Firebase Auth
    try {
      const authUser = await admin.auth().getUserByEmail('marcusleitz@me.com');
      console.log('\n✅ Found Marcus in Firebase Auth:');
      console.log(`UID: ${authUser.uid}`);
      console.log(`Email: ${authUser.email}`);
      console.log(`Display Name: ${authUser.displayName}`);
    } catch (authError) {
      console.log('\n❌ Not found in Firebase Auth with that email.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findMarcus();
