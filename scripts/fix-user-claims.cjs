/**
 * Fix User Custom Claims
 * 
 * This script ensures all users have proper custom claims set for Firestore security rules.
 * Run this after creating test data or when users have permission issues.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

/**
 * Sync user custom claims from Firestore data
 */
async function fixUserClaims() {
  try {
    console.log('🔧 Starting user claims fix...\n');

    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No users found in Firestore');
      return;
    }

    console.log(`📋 Found ${usersSnapshot.size} users in Firestore\n`);

    let fixed = 0;
    let errors = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      try {
        // Get current auth user
        const authUser = await auth.getUser(userId);
        
        // Prepare custom claims based on user data
        const customClaims = {
          permissionLevel: userData.permissionLevel ?? 0,
          branchId: userData.branchId || '',
          userType: userData.userType || 'internal',
          role: userData.role || 'inspector',
          email: userData.email || authUser.email || ''
        };

        // Add companyId if it exists
        if (userData.companyId) {
          customClaims.companyId = userData.companyId;
        }

        // Set custom claims
        await auth.setCustomUserClaims(userId, customClaims);

        console.log(`✅ Fixed claims for: ${userData.email || userId}`);
        console.log(`   - Role: ${customClaims.role}`);
        console.log(`   - Permission Level: ${customClaims.permissionLevel}`);
        console.log(`   - Branch ID: ${customClaims.branchId}`);
        console.log(`   - User Type: ${customClaims.userType}`);
        
        fixed++;
      } catch (error) {
        console.error(`❌ Error fixing user ${userId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} users`);
    if (errors > 0) {
      console.log(`⚠️ ${errors} errors encountered`);
    }

    // List all auth users and their claims
    console.log('\n📋 Current Auth Users with Claims:\n');
    const listUsersResult = await auth.listUsers();
    
    for (const user of listUsersResult.users) {
      const claims = user.customClaims || {};
      console.log(`👤 ${user.email || user.uid}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Role: ${claims.role || 'NOT SET'}`);
      console.log(`   Permission Level: ${claims.permissionLevel ?? 'NOT SET'}`);
      console.log(`   Branch ID: ${claims.branchId || 'NOT SET'}`);
      console.log(`   User Type: ${claims.userType || 'NOT SET'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the script
fixUserClaims()
  .then(() => {
    console.log('\n✅ User claims fix complete!');
    console.log('\n⚠️ IMPORTANT: Users need to log out and log back in for claims to take effect!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
