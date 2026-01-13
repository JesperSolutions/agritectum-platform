#!/usr/bin/env node

/**
 * Create QA Branch Manager Account
 */

import admin from 'firebase-admin';
import fs from 'fs';

// Load service account
const serviceAccountPath = 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// QA Branch Manager
const qaBranchManager = {
  uid: 'qa-branch-manager-001',
  email: 'qa.manager@agritectum.dk',
  password: 'QAManager2026!',
  displayName: 'QA Branch Manager',
  role: 'branchAdmin',
  permissionLevel: 1,
  branchId: 'qa-test-branch',
};

async function createQABranchManager() {
  try {
    console.log('🧪 Creating QA Branch Manager Account...\n');

    // Delete if exists
    try {
      await auth.deleteUser(qaBranchManager.uid);
      console.log('⚠️  Deleted existing user');
    } catch (e) { /* User doesn't exist */ }
    
    // Create user
    await auth.createUser({
      uid: qaBranchManager.uid,
      email: qaBranchManager.email,
      password: qaBranchManager.password,
      displayName: qaBranchManager.displayName,
    });
    
    // Set custom claims
    await auth.setCustomUserClaims(qaBranchManager.uid, {
      role: qaBranchManager.role,
      permissionLevel: qaBranchManager.permissionLevel,
      branchId: qaBranchManager.branchId,
    });
    
    // Create Firestore user document
    await db.collection('users').doc(qaBranchManager.uid).set({
      uid: qaBranchManager.uid,
      email: qaBranchManager.email,
      displayName: qaBranchManager.displayName,
      role: qaBranchManager.role,
      permissionLevel: qaBranchManager.permissionLevel,
      branchId: qaBranchManager.branchId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log('✅ QA Branch Manager created!\n');
    console.log('='.repeat(50));
    console.log('\n📋 QA BRANCH MANAGER ACCOUNT:');
    console.log('─'.repeat(40));
    console.log(`   URL: https://agritectum-platform.web.app/login`);
    console.log(`   Email: ${qaBranchManager.email}`);
    console.log(`   Password: ${qaBranchManager.password}`);
    console.log(`   Role: Branch Manager`);
    console.log(`   Branch: QA Test Branch`);
    console.log('\n' + '='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createQABranchManager();
