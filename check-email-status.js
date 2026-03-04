import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkEmailStatus() {
  try {
    const emailId = 'KxEyb9PgQm8zHNa9BFgl';
    
    // Wait for extension to process
    await new Promise(r => setTimeout(r, 5000));

    const doc = await db.collection('mail').doc(emailId).get();
    const data = doc.data();
    
    console.log('\n📨 EMAIL STATUS UPDATE:');
    console.log('==================\n');
    console.log(`Document: ${emailId}`);
    console.log(`To: ${data.to[0]}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Status: ${data.delivery?.state || 'PENDING'}`);
    
    if (data.delivery) {
      console.log(`\n✅ DELIVERY STATUS: ${data.delivery.state}`);
      if (data.delivery.leaseExpireTime) {
        console.log(`Processed at: ${new Date(data.delivery.leaseExpireTime._seconds * 1000).toLocaleString()}`);
      }
    } else if (data.error) {
      console.log(`\n❌ ERROR: ${data.error}`);
    } else {
      console.log('\n⏳ Still processing... The extension is working on it.');
    }
    
    console.log('\n📬 Check fake inbox at:');
    console.log('   https://mailinator.com/inbox/fake-customer-2025\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmailStatus();
