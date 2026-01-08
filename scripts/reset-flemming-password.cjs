#!/usr/bin/env node

/**
 * Reset Password for Flemming Adolfsen (Sales Account)
 * 
 * This script resets the password for the sales account flemming.adolfsen@agritectum.com
 * Tries test project first, then production if not found.
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    console.error('   Please install it: npm install firebase-admin');
    process.exit(1);
  }
}

// Generate a strong password
function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly to reach 16 characters minimum
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password for randomness
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

const FLEMMING_EMAIL = 'flemming.adolfsen@agritectum.com';

async function resetFlemmingPassword() {
  try {
    console.log('🔐 Resetting password for Flemming Adolfsen...\n');
    console.log(`📧 Email: ${FLEMMING_EMAIL}\n`);

    const projectRoot = path.join(__dirname, '..');
    const files = fs.readdirSync(projectRoot);
    
    // Find both service account files
    const testServiceAccountFile = files.find(f => 
      f.startsWith('taklaget-service-app-test-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    const prodServiceAccountFile = files.find(f => 
      (f.startsWith('taklaget-service-app-firebase-adminsdk-') || 
       f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
      f.endsWith('.json')
    );
    
    if (!testServiceAccountFile && !prodServiceAccountFile) {
      console.error('❌ Service account file not found!');
      console.error('   Expected one of:');
      console.error('   - taklaget-service-app-test-firebase-adminsdk-*.json (test)');
      console.error('   - taklaget-service-app-firebase-adminsdk-*.json (production)');
      console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
    
    // Generate new password
    const newPassword = generatePassword();
    
    // Try test project first
    const projectsToTry = [];
    if (testServiceAccountFile) {
      projectsToTry.push({
        file: testServiceAccountFile,
        projectId: 'taklaget-service-app-test',
        projectName: 'TEST'
      });
    }
    if (prodServiceAccountFile) {
      projectsToTry.push({
        file: prodServiceAccountFile,
        projectId: 'taklaget-service-app',
        projectName: 'PRODUCTION'
      });
    }
    
    let userFound = false;
    
    for (const project of projectsToTry) {
      try {
        // Initialize Firebase Admin for this project
        if (admin.apps.length > 0) {
          admin.app().delete();
        }
        
        const serviceAccount = require(path.join(projectRoot, project.file));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: project.projectId
        });
        
        console.log(`🔍 Checking ${project.projectName} project...`);
        
        // Try to get user by email
        const userRecord = await admin.auth().getUserByEmail(FLEMMING_EMAIL);
        
        // User found! Reset password
        console.log(`   ✅ User found: ${userRecord.displayName || userRecord.email}`);
        console.log(`   📋 UID: ${userRecord.uid}`);
        console.log(`🔄 Resetting password...`);
        
        // Update password
        await admin.auth().updateUser(userRecord.uid, {
          password: newPassword
        });
        
        console.log(`\n✅ Successfully reset password!\n`);
        console.log('='.repeat(80));
        console.log('🔑 NEW LOGIN CREDENTIALS');
        console.log('='.repeat(80));
        console.log(`   Email: ${FLEMMING_EMAIL}`);
        console.log(`   Password: ${newPassword}`);
        console.log(`   Project: ${project.projectName} (${project.projectId})`);
        console.log('='.repeat(80));
        console.log('\n💡 Save these credentials securely. The user can now log in with the new password.');
        
        // Update sales-user-credentials.json if it exists
        const credentialsPath = path.join(projectRoot, 'sales-user-credentials.json');
        if (fs.existsSync(credentialsPath)) {
          try {
            const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            const userIndex = credentialsData.users?.findIndex(u => u.email === FLEMMING_EMAIL);
            
            if (userIndex !== undefined && userIndex !== -1) {
              credentialsData.users[userIndex].password = newPassword;
              credentialsData.lastUpdated = new Date().toISOString();
              fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
              console.log(`\n📄 Updated sales-user-credentials.json with new password`);
            }
          } catch (error) {
            console.log(`\n⚠️  Could not update sales-user-credentials.json: ${error.message}`);
          }
        }
        
        userFound = true;
        break; // Exit loop once user is found and password is reset
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`   ⚠️  User not found in ${project.projectName} project`);
          // Continue to next project
        } else {
          console.error(`   ❌ Error checking ${project.projectName} project: ${error.message}`);
          // Continue to next project
        }
      }
    }
    
    if (!userFound) {
      console.error(`\n❌ User ${FLEMMING_EMAIL} not found in any project`);
      console.error('   Please check if the email is correct.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
resetFlemmingPassword();

