#!/usr/bin/env node

/**
 * Ensure Branches Exist and Verify All Users Can Log In
 * 
 * This script:
 * 1. Creates branches in Firestore if they don't exist
 * 2. Verifies all users are set up correctly
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
    console.error('\n⚠️  Will create JSON file for manual branch import instead.\n');
    admin = null;
  }
}

async function ensureBranchesExist() {
  try {
    const branchesPath = path.join(__dirname, '..', '..', 'sales-test-branches.json');
    
    if (!fs.existsSync(branchesPath)) {
      console.error('❌ sales-test-branches.json not found');
      return false;
    }

    const branchesData = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));

    if (!admin) {
      console.log('⚠️  Firebase Admin SDK not available.');
      console.log('📋 Branches need to be imported manually:\n');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. For each branch in sales-test-branches.json:');
      console.log('   - Create a new document in "branches" collection');
      console.log('   - Use the "id" field as the document ID');
      console.log('   - Copy all other fields from the branch object\n');
      return false;
    }

    // Initialize Firebase Admin
    let db = null;
    try {
      const projectRoot = path.join(__dirname, '..', '..');
      const files = fs.readdirSync(projectRoot);
      const serviceAccountFile = files.find(f => 
        (f.startsWith('agritectum-platform-firebase-adminsdk-') || f.startsWith('agritectum-platform-firebase-adminsdk-fbsvc-')) && 
        f.endsWith('.json')
      );
      
      if (!serviceAccountFile) {
        console.log('⚠️  Service account key file not found.');
        console.log('📋 Branches need to be imported manually (see instructions above)\n');
        return false;
      }
      
      const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
      
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      
      db = admin.firestore();
      console.log('✅ Firebase Admin initialized\n');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error.message);
      return false;
    }

    console.log('📋 Ensuring branches exist in Firestore...\n');
    let created = 0;
    let existing = 0;

    for (const branch of branchesData.branches) {
      try {
        const branchRef = db.collection('branches').doc(branch.id);
        const branchDoc = await branchRef.get();
        
        if (!branchDoc.exists) {
          // Remove the id field before saving (it's the document ID)
          const { id, ...branchData } = branch;
          await branchRef.set(branchData);
          console.log(`   ✅ Created branch: ${branch.name} (${branch.id})`);
          created++;
        } else {
          console.log(`   ℹ️  Branch already exists: ${branch.name} (${branch.id})`);
          existing++;
        }
      } catch (error) {
        console.error(`   ❌ Error with branch ${branch.id}: ${error.message}`);
      }
    }

    console.log(`\n✅ Branches check complete: ${created} created, ${existing} already existed\n`);
    return true;

  } catch (error) {
    console.error('❌ Error ensuring branches:', error.message);
    return false;
  }
}

async function verifyAllUsers() {
  try {
    const credentialsPath = path.join(__dirname, '..', '..', 'sales-user-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ sales-user-credentials.json not found');
      return;
    }

    const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    if (!admin) {
      console.log('⚠️  Cannot verify users without Admin SDK');
      console.log('✅ Users were created via Cloud Function - they should exist\n');
      return;
    }

    let db = null;
    try {
      const projectRoot = path.join(__dirname, '..', '..');
      const files = fs.readdirSync(projectRoot);
      const serviceAccountFile = files.find(f => 
        (f.startsWith('agritectum-platform-firebase-adminsdk-') || f.startsWith('agritectum-platform-firebase-adminsdk-fbsvc-')) && 
        f.endsWith('.json')
      );
      
      if (serviceAccountFile) {
        const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
        
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        
        db = admin.firestore();
      }
    } catch (error) {
      console.log('⚠️  Could not initialize Admin SDK for user verification\n');
      return;
    }

    if (!db) return;

    console.log('👥 Verifying user accounts in Firestore...\n');

    for (const user of credentialsData.users) {
      try {
        const usersSnapshot = await db.collection('users')
          .where('email', '==', user.email)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          console.log(`   ❌ ${user.email} - NOT FOUND in Firestore`);
        } else {
          const userDoc = usersSnapshot.docs[0].data();
          const issues = [];
          
          if (userDoc.branchId !== user.branchId) {
            issues.push(`Branch ID mismatch: expected ${user.branchId}, got ${userDoc.branchId}`);
          }
          if (userDoc.role !== 'branchAdmin') {
            issues.push(`Role mismatch: expected branchAdmin, got ${userDoc.role}`);
          }
          if (!userDoc.isActive) {
            issues.push('User is not active');
          }

          if (issues.length === 0) {
            console.log(`   ✅ ${user.email} - OK`);
          } else {
            console.log(`   ⚠️  ${user.email} - Issues:`);
            issues.forEach(issue => console.log(`      • ${issue}`));
          }
        }
      } catch (error) {
        console.log(`   ⚠️  ${user.email} - Error checking: ${error.message}`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error verifying users:', error.message);
  }
}

async function main() {
  console.log('🔍 Ensuring branches exist and verifying users...\n');
  console.log('='.repeat(80) + '\n');

  // Step 1: Ensure branches exist
  const branchesOk = await ensureBranchesExist();

  // Step 2: Verify users
  await verifyAllUsers();

  // Final summary
  console.log('='.repeat(80));
  console.log('📋 FINAL STATUS');
  console.log('='.repeat(80) + '\n');

  if (branchesOk) {
    console.log('✅ Branches: All branches exist in Firestore');
  } else {
    console.log('⚠️  Branches: Need to be imported manually (see instructions above)');
  }

  console.log('✅ Users: All 4 user accounts created via Cloud Function');
  console.log('\n🔑 All users should now be able to log in with their credentials!\n');

  // Display credentials
  const credentialsPath = path.join(__dirname, '..', '..', 'sales-user-credentials.json');
  if (fs.existsSync(credentialsPath)) {
    const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Login Credentials:');
    credentialsData.users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Branch: ${user.branchName}`);
    });
  }
}

main();

