// Get full document details
const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getFullMailDoc() {
  try {
    const doc = await db.collection('mail').doc('RMzgsePmzJhBvTzikt0t').get();
    
    if (!doc.exists) {
      console.log('❌ Document not found');
      return;
    }

    console.log('📧 Full email document:\n');
    console.log(JSON.stringify(doc.data(), null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getFullMailDoc();
