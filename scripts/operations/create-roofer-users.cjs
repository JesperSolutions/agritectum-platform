#!/usr/bin/env node

/**
 * Create Roofer Users
 * 
 * Creates two roofer user accounts in the production Firebase project
 * Users: Carl Jarsenholt and Kasper Fern
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

async function createRooferUsers() {
  try {
    console.log('🔧 Creating Roofer User Accounts\n');
    console.log('Project: taklaget-service-app (Production)\n');

    // Find production service account key
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    const serviceAccountFile = files.find(f => 
      f.startsWith('taklaget-service-app-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      console.error('❌ Production service account key not found!');
      console.error('   Expected file pattern: taklaget-service-app-firebase-adminsdk-*.json');
      console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    // Initialize Firebase Admin with production project
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // If already initialized, check if it's the production project
      const currentProject = admin.app().options.projectId;
      if (currentProject !== 'taklaget-service-app') {
        console.log('⚠️  Reinitializing with production project...');
        admin.app().delete();
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    
    const db = admin.firestore();
    const auth = admin.auth();
    
    console.log('✅ Firebase Admin initialized for production project\n');

    // First, list available branches
    console.log('📋 Fetching available branches...\n');
    const branchesSnapshot = await db.collection('branches').get();
    const branches = branchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (branches.length === 0) {
      console.error('❌ No branches found in Firestore!');
      console.error('   Please create at least one branch before creating users.');
      process.exit(1);
    }
    
    console.log('Available branches:');
    branches.forEach(branch => {
      console.log(`   • ${branch.name} (ID: ${branch.id})`);
    });
    console.log('');
    
    // Use the first branch as default, or you can specify
    // For now, we'll use the first active branch, or just the first one
    const defaultBranch = branches.find(b => b.isActive !== false) || branches[0];
    const branchId = defaultBranch.id;
    console.log(`📌 Using branch: ${defaultBranch.name} (${branchId})\n`);

    // User data
    const users = [
      {
        email: 'carl.jarsenholt@taklagetentreprenad.se',
        password: 'huGsUdJHPnS6',
        displayName: 'Carl Jarsenholt',
        role: 'inspector',
        permissionLevel: 0,
        department: 'roofers',
        organization: 'Taglaget Entreprenad'
      },
      {
        email: 'kasper.fern98@gmail.com',
        password: '$qMT5O^HqBGK',
        displayName: 'Kasper Fern',
        role: 'inspector',
        permissionLevel: 0,
        department: 'roofers',
        organization: 'Taglaget Entreprenad'
      }
    ];

    console.log('📋 Creating user accounts...\n');

    for (const userData of users) {
      try {
        console.log(`Creating user: ${userData.displayName}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Role: ${userData.role} (Permission Level: ${userData.permissionLevel})`);
        console.log(`   Branch: ${defaultBranch.name} (${branchId})\n`);

        let userRecord;
        let uid;

        // Check if user already exists
        try {
          userRecord = await auth.getUserByEmail(userData.email);
          uid = userRecord.uid;
          console.log(`   ⚠️  User already exists with UID: ${uid}`);
          console.log('   Updating user...\n');
          
          // Update existing user
          await auth.updateUser(uid, {
            displayName: userData.displayName,
            email: userData.email,
            emailVerified: true,
          });
          
          // Update password
          await auth.updateUser(uid, {
            password: userData.password,
          });
          
          console.log('   ✅ User updated with new password\n');
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new user
            userRecord = await auth.createUser({
              email: userData.email,
              password: userData.password,
              displayName: userData.displayName,
              emailVerified: true,
            });
            uid = userRecord.uid;
            console.log(`   ✅ User created with UID: ${uid}\n`);
          } else {
            throw error;
          }
        }

        // Set custom claims (inspector)
        await auth.setCustomUserClaims(uid, {
          role: userData.role,
          permissionLevel: userData.permissionLevel,
          branchId: branchId,
        });
        console.log(`   ✅ Custom claims set (${userData.role}, permissionLevel: ${userData.permissionLevel}, branchId: ${branchId})\n`);

        // Create/update Firestore user document
        const userDoc = {
          uid: uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          permissionLevel: userData.permissionLevel,
          branchId: branchId,
          isActive: true,
          department: userData.department,
          organization: userData.organization,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null,
        };

        await db.collection('users').doc(uid).set(userDoc, { merge: true });
        console.log('   ✅ Firestore user document created/updated\n');
        console.log('   ' + '='.repeat(50) + '\n');

      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.displayName}:`, error.message);
        if (error.stack) {
          console.error('   Stack trace:', error.stack);
        }
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log('✅ Roofer User Accounts Created Successfully!\n');
    console.log('📧 Login Credentials:\n');
    users.forEach(user => {
      console.log(`   ${user.displayName}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: Inspector (Permission Level: 0)`);
      console.log(`   Branch: ${defaultBranch.name} (${branchId})`);
      console.log('');
    });
    console.log('⚠️  IMPORTANT: Users should change password after first login.\n');
    console.log('🔗 Production Login:');
    console.log('   https://taklaget-service-app.web.app/login\n');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error creating roofer user accounts:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createRooferUsers();









