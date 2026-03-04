import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateMarcusEmail() {
  try {
    const uid = 'AQfaZgI4Dsh4xqtJacQzCxrWsXw1';
    const oldEmail = 'marcus@agritectum.de';
    const newEmail = 'marcusleitz@me.com';
    
    console.log('📧 Updating Marcus email...\n');
    console.log(`UID: ${uid}`);
    console.log(`Old Email: ${oldEmail}`);
    console.log(`New Email: ${newEmail}\n`);
    
    // Update Firebase Auth
    try {
      await admin.auth().updateUser(uid, {
        email: newEmail
      });
      console.log('✅ Firebase Auth email updated');
    } catch (authError) {
      console.log(`⚠️  Firebase Auth update: ${authError.message}`);
    }
    
    // Update Firestore
    await db.collection('users').doc(uid).update({
      email: newEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firestore email updated');
    
    // Verify the change
    const updatedDoc = await db.collection('users').doc(uid).get();
    const updatedData = updatedDoc.data();
    
    console.log('\n✅ Email updated successfully!');
    console.log(`New email in Firestore: ${updatedData.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateMarcusEmail();
