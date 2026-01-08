#!/usr/bin/env node

/**
 * Remove Test User Script
 * 
 * This script removes the "test" user that's missing required fields.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-') && f.endsWith('.json'));
  
  if (!serviceAccountFile) {
    throw new Error('Service account key file not found.');
  }
  
  const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function removeTestUser() {
  console.log('🗑️  REMOVING TEST USER\n');
  console.log('='.repeat(80));
  
  try {
    // Find all users without proper role
    const usersSnapshot = await db.collection('users').get();
    
    let removedCount = 0;
    
    usersSnapshot.forEach(async (doc) => {
      const user = doc.data();
      
      // Remove users that are clearly test/invalid
      if (!user.role || user.displayName === 'test' || user.email === 'test@test.com') {
        console.log(`\n🗑️  Removing user: ${doc.id}`);
        console.log(`   Display Name: ${user.displayName || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'MISSING'}`);
        
        try {
          await db.collection('users').doc(doc.id).delete();
          removedCount++;
          console.log(`   ✅ Removed successfully`);
        } catch (error) {
          console.log(`   ❌ Failed to remove: ${error.message}`);
        }
      }
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n✅ Removed ${removedCount} test/invalid user(s)\n`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
  }
  
  process.exit(0);
}

// Run the cleanup
removeTestUser();

