#!/usr/bin/env node

/**
 * Verify and Set Custom Claims for ALL Production Users
 * 
 * This script:
 * 1. Fetches all users from Firestore /users collection
 * 2. Checks if Firebase Auth has correct custom claims for each user
 * 3. Sets missing custom claims based on user's role/branchId in Firestore
 * 4. Reports success/failure for each user
 */

// Try to load firebase-admin from functions/node_modules first
const path = require('path');
const fs = require('fs');

let admin;
try {
  // Try root node_modules
  admin = require('firebase-admin');
} catch (e) {
  try {
    // Try functions/node_modules
    const functionsPath = path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    console.error('   Please install it: npm install firebase-admin');
    process.exit(1);
  }
}

// Initialize Firebase Admin
try {
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => 
    (f.startsWith('taklaget-service-app-firebase-adminsdk-') || f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
    f.endsWith('.json')
  );
  
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
  process.exit(1);
}

async function verifyAndFixClaims() {
  console.log('🔧 Verifying and setting custom claims for ALL users in PRODUCTION...\n');
  console.log('⚠️  WARNING: This will update PRODUCTION Firebase Authentication!\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Are you sure you want to continue? (yes/no): ', resolve);
  });
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }
  rl.close();
  
  console.log('\n📝 Starting verification...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];
  
  try {
    // 1. Get all users from Firestore
    console.log('📄 Fetching all users from Firestore...');
    const usersSnapshot = await admin.firestore().collection('users').get();
    console.log(`✅ Found ${usersSnapshot.size} users in Firestore\n`);
    
    // 2. Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      try {
        console.log(`\n👤 Processing: ${userData.displayName || 'Unknown'} (${userData.email || userId})`);
        
        // Determine expected claims from Firestore data
        const expectedClaims = {
          role: userData.role || 'inspector',
          permissionLevel: userData.permissionLevel !== undefined 
            ? userData.permissionLevel 
            : (userData.role === 'inspector' ? 0 : userData.role === 'branchAdmin' ? 1 : 2),
          branchId: userData.branchId || '',
        };
        
        console.log(`   Expected claims: ${JSON.stringify(expectedClaims)}`);
        
        // 3. Get user from Firebase Auth
        let userRecord;
        try {
          userRecord = await admin.auth().getUser(userId);
        } catch (error) {
          // User might not exist in Auth yet (created directly in Firestore)
          console.log(`   ⚠️  User not found in Firebase Auth, skipping...`);
          skippedCount++;
          continue;
        }
        
        const currentClaims = userRecord.customClaims || {};
        console.log(`   Current claims: ${JSON.stringify(currentClaims)}`);
        
        // 4. Check if claims need updating
        const needsUpdate = 
          currentClaims.role !== expectedClaims.role ||
          currentClaims.permissionLevel !== expectedClaims.permissionLevel ||
          currentClaims.branchId !== expectedClaims.branchId;
        
        if (!needsUpdate) {
          console.log(`   ✅ Claims already correct, skipping`);
          successCount++;
          continue;
        }
        
        // 5. Set custom claims
        console.log(`   🔧 Updating claims...`);
        await admin.auth().setCustomUserClaims(userId, expectedClaims);
        console.log(`   ✅ Custom claims updated`);
        
        // 6. Update Firestore to ensure it's in sync
        await admin.firestore().collection('users').doc(userId).set(expectedClaims, { merge: true });
        console.log(`   ✅ Firestore updated`);
        
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
        errors.push({
          user: userData.email || userId,
          error: error.message
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${successCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ user, error }) => {
        console.log(`   - ${user}: ${error}`);
      });
    }
    
    console.log('\n⚠️  IMPORTANT: Users must LOG OUT and LOG BACK IN to get new tokens!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run it
verifyAndFixClaims();

