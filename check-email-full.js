import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkEmailFull() {
  try {
    const emailId = 'KxEyb9PgQm8zHNa9BFgl';
    const doc = await db.collection('mail').doc(emailId).get();
    const data = doc.data();
    
    console.log('\n📧 FULL EMAIL DOCUMENT:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.log('\n❌ ERROR FOUND:');
      console.log(data.error);
    }
    
    if (data.delivery) {
      console.log('\n✅ DELIVERY INFO:');
      console.log(JSON.stringify(data.delivery, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmailFull();
