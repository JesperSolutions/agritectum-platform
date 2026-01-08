#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const projectRoot = path.join(__dirname, '..');
const files = fs.readdirSync(projectRoot);
const serviceAccountFile = files.find(f => f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-') && f.endsWith('.json'));
const serviceAccount = require(path.join(projectRoot, serviceAccountFile));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

(async () => {
  console.log('🔍 Finding users without role...\n');
  
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    
    if (!user.role) {
      console.log(`Found user without role:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Display Name: ${user.displayName || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Role: ${user.role || 'MISSING'}`);
      console.log(`  Deleting...`);
      
      await db.collection('users').doc(doc.id).delete();
      console.log(`  ✅ Deleted\n`);
    }
  }
  
  console.log('✅ Done!\n');
  process.exit(0);
})();

