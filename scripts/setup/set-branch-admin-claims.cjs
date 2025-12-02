#!/usr/bin/env node

/**
 * Set Custom Claims for Branch Admin Users
 * 
 * This script sets custom claims for branch admin users in PRODUCTION Firebase Authentication.
 * 
 * Usage: node scripts/set-branch-admin-claims.js
 * 
 * Prerequisites:
 * - Firebase CLI installed and logged in
 * - Firebase Functions deployed
 * - Service account key available
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
try {
  const path = require('path');
  const fs = require('fs');
  
  // Find the service account key file (it has a unique suffix)
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => f.startsWith('agritectum-platform-firebase-adminsdk-fbsvc-') && f.endsWith('.json'));
  
  if (!serviceAccountFile) {
    throw new Error('Service account key file not found. Please download it from Firebase Console.');
  }
  
  const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.error('\nMake sure you have the service account key file in the project root.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Branch admin users to update
const branchAdmins = [
  {
    email: 'linus.hollberg@taklagetentreprenad.se',
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: 'jYPEEhrb7iNGqumvV80L',
    displayName: 'Linus Hollberg',
  },
  {
    email: 'Bengt.widstrand@binne.se',
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: 'bengt-branch-id', // TODO: Update with actual branch ID
    displayName: 'Bengt Widstrand',
  },
  {
    email: 'Magnus.eriksson@binne.se',
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: 'jYPEEhrb7iNGqumvV80L', // Same as Linus
    displayName: 'Magnus Eriksson',
  },
];

async function setCustomClaims() {
  console.log('🔧 Setting custom claims for branch admin users...\n');
  console.log('⚠️  WARNING: This will update PRODUCTION Firebase Authentication!\n');

  rl.question('Are you sure you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled.');
      rl.close();
      return;
    }

    console.log('\n📝 Starting to set custom claims...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const branchAdmin of branchAdmins) {
      try {
        console.log(`\n👤 Processing: ${branchAdmin.displayName} (${branchAdmin.email})`);
        
        // Find user by email
        const userRecord = await admin.auth().getUserByEmail(branchAdmin.email);
        console.log(`   ✅ User found: ${userRecord.uid}`);

        // Set custom claims
        const claims = {
          role: branchAdmin.role,
          permissionLevel: branchAdmin.permissionLevel,
          branchId: branchAdmin.branchId,
        };

        await admin.auth().setCustomUserClaims(userRecord.uid, claims);
        console.log(`   ✅ Custom claims set successfully`);

        // Update user document in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
          ...claims,
          email: branchAdmin.email,
          displayName: branchAdmin.displayName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`   ✅ Firestore user document updated`);

        successCount++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log('\n🎉 Custom claims update complete!\n');

    rl.close();
    process.exit(0);
  });
}

// Run the script
setCustomClaims();

