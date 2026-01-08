#!/usr/bin/env node

/**
 * Fix Linus Claims - URGENT
 * Updates Linus's custom claims in Firebase Authentication AND Firestore
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

const LINUS_EMAIL = 'linus.hollberg@taklagetentreprenad.se';
const BRANCH_ID = 'jYPEEhrb7iNGqumvV80L';

async function fixLinusClaims() {
  console.log('🔧 Fixing Linus claims in PRODUCTION...\n');
  
  try {
    // 1. Get user from Firebase Auth
    console.log('📧 Looking up user:', LINUS_EMAIL);
    const userRecord = await admin.auth().getUserByEmail(LINUS_EMAIL);
    console.log('✅ User found in Auth:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    console.log('   Display Name:', userRecord.displayName);
    console.log('   Current Claims:', JSON.stringify(userRecord.customClaims || {}, null, 2));
    
    // 2. Set correct claims
    const claims = {
      role: 'branchAdmin',
      permissionLevel: 1,
      branchId: BRANCH_ID,
    };
    
    console.log('\n🔧 Setting custom claims...');
    await admin.auth().setCustomUserClaims(userRecord.uid, claims);
    console.log('✅ Custom claims set:', JSON.stringify(claims, null, 2));
    
    // 3. Get/update Firestore user document
    console.log('\n📄 Checking Firestore user document...');
    const firestoreUserRef = admin.firestore().collection('users').doc(userRecord.uid);
    const firestoreUser = await firestoreUserRef.get();
    
    if (firestoreUser.exists) {
      const existingData = firestoreUser.data();
      console.log('   Existing Firestore data:', JSON.stringify(existingData, null, 2));
    } else {
      console.log('   ⚠️  User document does not exist in Firestore');
    }
    
    // Update Firestore
    await firestoreUserRef.set({
      role: 'branchAdmin',
      permissionLevel: 1,
      branchId: BRANCH_ID,
      email: LINUS_EMAIL,
      displayName: userRecord.displayName || 'Linus Hollberg',
      uid: userRecord.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('✅ Firestore user document updated');
    
    // 4. Verify claims were set
    console.log('\n🔍 Verifying claims...');
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('   Updated Claims:', JSON.stringify(updatedUser.customClaims || {}, null, 2));
    
    // 5. Check Firestore again
    const updatedFirestoreUser = await firestoreUserRef.get();
    console.log('   Updated Firestore data:', JSON.stringify(updatedFirestoreUser.data(), null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ LINUS CLAIMS FIXED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   Email:', LINUS_EMAIL);
    console.log('   UID:', userRecord.uid);
    console.log('   Role: branchAdmin');
    console.log('   Permission Level: 1');
    console.log('   Branch ID:', BRANCH_ID);
    console.log('\n⚠️  IMPORTANT: User must LOG OUT and LOG BACK IN to get new token!');
    console.log('');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run it
fixLinusClaims();
