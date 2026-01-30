#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkCustomerIds() {
  const snapshot = await db.collection('customers').get();
  let correct = 0;
  let missing = 0;
  
  snapshot.docs.forEach(doc => {
    if (doc.data().id === doc.id) {
      correct++;
    } else {
      missing++;
      console.log(`Missing id: ${doc.id}`);
    }
  });
  
  console.log(`\nCustomer ID Field Status:`);
  console.log(`  ✅ Correct: ${correct}/${snapshot.docs.length}`);
  console.log(`  ❌ Missing: ${missing}/${snapshot.docs.length}`);
  
  process.exit(0);
}

checkCustomerIds().catch(e => {
  console.error(e);
  process.exit(1);
});
