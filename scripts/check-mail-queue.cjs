// Check mail queue in Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMailQueue() {
  try {
    console.log('📬 Checking mail queue in Firestore...\n');
    
    // Get recent mail documents
    const mailSnapshot = await db.collection('mail')
      .orderBy('metadata.sentAt', 'desc')
      .limit(5)
      .get();

    if (mailSnapshot.empty) {
      console.log('❌ No emails found in queue');
      return;
    }

    console.log(`✅ Found ${mailSnapshot.size} email(s) in queue:\n`);
    
    mailSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Document ID: ${doc.id}`);
      console.log(`📨 To: ${data.to}`);
      console.log(`📋 Template: ${data.template?.name}`);
      console.log(`👤 Customer: ${data.template?.data?.customerName || 'N/A'}`);
      console.log(`💰 Amount: ${data.template?.data?.totalAmount || 'N/A'} ${data.template?.data?.currency || ''}`);
      
      // Check delivery status
      if (data.delivery) {
        console.log(`✅ Delivery Status:`, data.delivery);
      } else {
        console.log(`⏳ Status: Pending (waiting for Trigger Email extension)`);
      }
      
      if (data.error) {
        console.log(`❌ Error:`, data.error);
      }
      
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking mail queue:', error);
    process.exit(1);
  }
}

checkMailQueue();
