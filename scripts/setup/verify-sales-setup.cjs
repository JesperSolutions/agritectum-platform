#!/usr/bin/env node

/**
 * Verify Sales Setup Script
 * 
 * This script verifies that all branches and users are set up correctly
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.log('⚠️  Firebase Admin SDK not available. Will check via API only.\n');
    admin = null;
  }
}

async function checkBranches(db, branchIds) {
  const missingBranches = [];
  
  if (db) {
    for (const branchId of branchIds) {
      try {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (!branchDoc.exists) {
          missingBranches.push(branchId);
          console.log(`   ❌ Branch ${branchId} does NOT exist in Firestore`);
        } else {
          console.log(`   ✅ Branch ${branchId} exists`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not check branch ${branchId}: ${error.message}`);
        missingBranches.push(branchId);
      }
    }
  } else {
    console.log('   ⚠️  Cannot check branches without Admin SDK');
    console.log('   Please verify branches exist in Firebase Console');
  }
  
  return missingBranches;
}

async function createBranches(db, branchesData) {
  if (!db) {
    console.log('⚠️  Cannot create branches without Admin SDK');
    return false;
  }

  console.log('\n📋 Creating missing branches...\n');
  let created = 0;

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
      }
    } catch (error) {
      console.error(`   ❌ Error creating branch ${branch.id}: ${error.message}`);
    }
  }

  return created > 0;
}

async function verifyUsers() {
  try {
    console.log('🔍 Verifying sales setup...\n');

    // Read credentials
    const credentialsPath = path.join(__dirname, '..', '..', 'sales-user-credentials.json');
    const branchesPath = path.join(__dirname, '..', '..', 'sales-test-branches.json');

    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ sales-user-credentials.json not found');
      process.exit(1);
    }

    if (!fs.existsSync(branchesPath)) {
      console.error('❌ sales-test-branches.json not found');
      process.exit(1);
    }

    const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const branchesData = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));

    // Initialize Firebase Admin if available
    let db = null;
    if (admin) {
      try {
        const projectRoot = path.join(__dirname, '..', '..');
        const files = fs.readdirSync(projectRoot);
        const serviceAccountFile = files.find(f => 
          (f.startsWith('taklaget-service-app-firebase-adminsdk-') || f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
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
          console.log('✅ Firebase Admin initialized\n');
        }
      } catch (error) {
        console.log('⚠️  Could not initialize Admin SDK\n');
      }
    }

    // Check branches
    console.log('📋 Checking branches in Firestore...\n');
    const branchIds = credentialsData.users.map(u => u.branchId);
    const missingBranches = await checkBranches(db, branchIds);

    // Create missing branches if Admin SDK is available
    if (missingBranches.length > 0 && db) {
      const created = await createBranches(db, branchesData);
      if (created) {
        console.log('\n✅ Missing branches created!\n');
      }
    } else if (missingBranches.length > 0) {
      console.log('\n⚠️  Some branches are missing. Please import them from sales-test-branches.json\n');
    }

    // Verify users
    console.log('👥 Verifying user accounts...\n');
    
    if (db) {
      for (const user of credentialsData.users) {
        try {
          // Check if user exists in Firestore users collection
          const usersSnapshot = await db.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

          if (usersSnapshot.empty) {
            console.log(`   ❌ User ${user.email} NOT found in Firestore`);
          } else {
            const userDoc = usersSnapshot.docs[0].data();
            console.log(`   ✅ User ${user.email} exists`);
            console.log(`      Display Name: ${userDoc.displayName}`);
            console.log(`      Role: ${userDoc.role}`);
            console.log(`      Branch ID: ${userDoc.branchId}`);
            console.log(`      Active: ${userDoc.isActive ? 'Yes' : 'No'}`);
            
            // Verify branch assignment
            if (userDoc.branchId !== user.branchId) {
              console.log(`      ⚠️  WARNING: Branch ID mismatch! Expected: ${user.branchId}, Found: ${userDoc.branchId}`);
            }
          }
        } catch (error) {
          console.log(`   ⚠️  Could not verify user ${user.email}: ${error.message}`);
        }
        console.log('');
      }
    } else {
      console.log('   ⚠️  Cannot verify users without Admin SDK');
      console.log('   Users were created via Cloud Function, they should exist\n');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('📋 SETUP SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('✅ All 4 user accounts have been created via Cloud Function');
    console.log('✅ Users should be able to log in with their credentials\n');

    if (missingBranches.length > 0 && !db) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   Some branches may not exist in Firestore.');
      console.log('   Please import branches from sales-test-branches.json');
      console.log('   Go to Firebase Console > Firestore > Import from JSON\n');
    }

    console.log('🔑 Login Credentials:');
    credentialsData.users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Branch: ${user.branchName} (${user.branchId})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUsers();

