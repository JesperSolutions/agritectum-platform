#!/usr/bin/env node

/**
 * Create Test Super Admin Account
 * 
 * Creates a super admin account in the test Firebase project (taklaget-service-app-test)
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
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

async function createTestAdmin() {
  try {
    console.log('🔧 Creating Test Super Admin Account\n');
    console.log('Project: taklaget-service-app-test\n');

    // Find test project service account key
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    const serviceAccountFile = files.find(f => 
      f.startsWith('taklaget-service-app-test-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      console.error('❌ Test project service account key not found!');
      console.error('   Expected file pattern: taklaget-service-app-test-firebase-adminsdk-*.json');
      console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    // Initialize Firebase Admin with test project
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // If already initialized, check if it's the test project
      const currentProject = admin.app().options.projectId;
      if (currentProject !== 'taklaget-service-app-test') {
        console.log('⚠️  Reinitializing with test project...');
        admin.app().delete();
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    
    const db = admin.firestore();
    const auth = admin.auth();
    
    console.log('✅ Firebase Admin initialized for test project\n');

    // Super admin account details
    const adminEmail = 'admin@taklaget.onmicrosoft.com';
    const adminName = 'Taklaget Test Super Administrator';
    const password = generatePassword();
    const branchId = 'main';
    const permissionLevel = 2; // Super admin

    console.log('📋 Creating super admin account...\n');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Permission Level: ${permissionLevel} (Super Admin)`);
    console.log(`   Branch: ${branchId}\n`);

    let userRecord;
    let uid;

    // Check if user already exists
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      uid = userRecord.uid;
      console.log(`⚠️  User already exists with UID: ${uid}`);
      console.log('   Updating user...\n');
      
      // Update existing user
      await auth.updateUser(uid, {
        displayName: adminName,
        email: adminEmail,
        emailVerified: true,
      });
      
      // Update password
      await auth.updateUser(uid, {
        password: password,
      });
      
      console.log('✅ User updated with new password\n');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: adminEmail,
          password: password,
          displayName: adminName,
          emailVerified: true,
        });
        uid = userRecord.uid;
        console.log(`✅ User created with UID: ${uid}\n`);
      } else {
        throw error;
      }
    }

    // Set custom claims (super admin)
    await auth.setCustomUserClaims(uid, {
      role: 'superadmin',
      permissionLevel: permissionLevel,
      branchId: branchId,
    });
    console.log('✅ Custom claims set (superadmin, permissionLevel: 2)\n');

    // Create/update Firestore user document
    const userDoc = {
      uid: uid,
      email: adminEmail,
      displayName: adminName,
      role: 'superadmin',
      permissionLevel: permissionLevel,
      branchId: branchId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    };

    await db.collection('users').doc(uid).set(userDoc, { merge: true });
    console.log('✅ Firestore user document created/updated\n');

    console.log('='.repeat(60));
    console.log('✅ Test Super Admin Account Created Successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${password}\n`);
    console.log('⚠️  IMPORTANT: Save this password securely!');
    console.log('   User must change password after first login.\n');
    console.log('🔗 Test Environment Login:');
    console.log('   https://taklaget-service-app-test.web.app/login\n');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error creating test admin account:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createTestAdmin();

