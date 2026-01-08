#!/usr/bin/env node

/**
 * Reset Inspector Passwords in Production
 * 
 * This script resets passwords for all inspector accounts in the production Firebase database.
 * Requires Firebase Admin SDK service account key.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found!');
  console.error('   Expected: taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json');
  console.error('   Make sure the Firebase Admin SDK service account key is in the project root.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'taklaget-service-app'
});

const NEW_PASSWORD = 'Inspector123!';

// Inspector emails from the users.json file
const inspectorEmails = [
  'petra.petersson@taklaget.se',
  'anders.andersson@taklaget.se', 
  'lars.larsson@taklaget.se',
  'erik.andersson@taklaget.se',
  'karin.karlsson@taklaget.se',
  'sofia.johansson@taklaget.se'
];

async function resetProductionInspectorPasswords() {
  try {
    console.log('🔐 Resetting inspector passwords in PRODUCTION...\n');
    console.log('⚠️  WARNING: This will change passwords in the live Firebase database!');
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (const email of inspectorEmails) {
      try {
        console.log(`🔄 Resetting password for ${email}...`);
        
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Update password
        await admin.auth().updateUser(userRecord.uid, {
          password: NEW_PASSWORD
        });

        console.log(`✅ Successfully reset password for ${email}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`⚠️  User ${email} not found in production database`);
        } else {
          console.log(`❌ Failed to reset password for ${email}: ${error.message}`);
        }
        errorCount++;
      }
    }

    console.log('\n🎉 Password reset complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} accounts`);
    console.log(`   ❌ Errors/not found: ${errorCount} accounts`);
    console.log(`   🔑 New password for all inspectors: ${NEW_PASSWORD}`);
    
    if (successCount > 0) {
      console.log(`\n🔑 Updated Inspector Login Credentials:`);
      inspectorEmails.forEach(email => {
        console.log(`   • ${email} / ${NEW_PASSWORD}`);
      });
    }

  } catch (error) {
    console.error('❌ Error resetting inspector passwords:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
resetProductionInspectorPasswords();

