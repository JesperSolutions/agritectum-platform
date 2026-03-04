#!/usr/bin/env node

/**
 * Script to set custom claims for existing users
 * Run this to fix users that don't have proper custom claims set
 * 
 * Usage:
 *   node scripts/fixUserClaims.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'agritectum-platform',
  });
}

const db = admin.firestore();

async function fixUserClaims() {
  console.log('🔧 Starting user claims fix...\n');

  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📋 Found ${usersSnapshot.size} users in Firestore\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      try {
        // Get current custom claims
        const userRecord = await admin.auth().getUser(userId);
        const currentClaims = userRecord.customClaims || {};

        // Prepare new claims based on user document
        const newClaims = {
          role: userData.role || 'inspector',
          permissionLevel: userData.permissionLevel !== undefined ? userData.permissionLevel : 0,
          userType: userData.userType || (userData.role === 'customer' ? 'customer' : 'internal'),
          email: userData.email || userRecord.email,
          branchId: userData.branchId || null,
          companyId: userData.companyId || null,
        };

        // Check if claims need updating
        const needsUpdate =
          currentClaims.role !== newClaims.role ||
          currentClaims.permissionLevel !== newClaims.permissionLevel ||
          currentClaims.userType !== newClaims.userType ||
          currentClaims.branchId !== newClaims.branchId ||
          currentClaims.companyId !== newClaims.companyId;

        if (needsUpdate) {
          await admin.auth().setCustomUserClaims(userId, newClaims);
          console.log(`✅ Fixed claims for ${userData.email} (${userId})`);
          console.log(`   Role: ${newClaims.role}, Permission: ${newClaims.permissionLevel}, Type: ${newClaims.userType}`);
          fixed++;
        } else {
          console.log(`⏭️  Skipped ${userData.email} (claims already correct)`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
fixUserClaims();
