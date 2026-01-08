#!/usr/bin/env node

/**
 * Diagnose Linus Access Issues
 * 
 * This script does a comprehensive check of Linus's account:
 * 1. Firebase Auth custom claims
 * 2. Firestore user document
 * 3. All collections he should have access to
 * 4. Firestore rules evaluation
 */

const path = require('path');
const fs = require('fs');

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    process.exit(1);
  }
}

try {
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => 
    (f.startsWith('taklaget-service-app-firebase-adminsdk-') || f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
    f.endsWith('.json')
  );
  
  if (!serviceAccountFile) {
    throw new Error('Service account key file not found');
  }
  
  const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const LINUS_EMAIL = 'linus.hollberg@taklagetentreprenad.se';

async function diagnoseAccess() {
  console.log('🔍 COMPREHENSIVE LINUS ACCESS DIAGNOSIS\n');
  console.log('=' .repeat(80) + '\n');
  
  try {
    // 1. Firebase Auth
    console.log('📋 1. FIREBASE AUTH');
    console.log('-'.repeat(80));
    const userRecord = await admin.auth().getUserByEmail(LINUS_EMAIL);
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    console.log('Display Name:', userRecord.displayName);
    console.log('Email Verified:', userRecord.emailVerified);
    console.log('Disabled:', userRecord.disabled);
    console.log('\nCustom Claims:');
    console.log(JSON.stringify(userRecord.customClaims || {}, null, 2));
    
    if (!userRecord.customClaims) {
      console.log('\n⚠️  WARNING: NO CUSTOM CLAIMS!');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 2. Firestore User Document
    console.log('📋 2. FIRESTORE USER DOCUMENT');
    console.log('-'.repeat(80));
    const firestoreUserRef = admin.firestore().collection('users').doc(userRecord.uid);
    const firestoreUser = await firestoreUserRef.get();
    
    if (!firestoreUser.exists) {
      console.log('❌ USER DOCUMENT DOES NOT EXIST IN FIRESTORE!');
    } else {
      console.log('✅ User document exists');
      console.log('\nDocument Data:');
      console.log(JSON.stringify(firestoreUser.data(), null, 2));
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 3. Check access to different collections
    console.log('📋 3. COLLECTION ACCESS TEST');
    console.log('-'.repeat(80));
    
    const role = userRecord.customClaims?.role || firestoreUser.data()?.role;
    const permissionLevel = userRecord.customClaims?.permissionLevel || firestoreUser.data()?.permissionLevel;
    const branchId = userRecord.customClaims?.branchId || firestoreUser.data()?.branchId;
    
    console.log(`Role: ${role}`);
    console.log(`Permission Level: ${permissionLevel}`);
    console.log(`Branch ID: ${branchId}`);
    console.log('');
    
    // Test read access to customers
    console.log('Testing CUSTOMERS collection access...');
    try {
      const customersRef = admin.firestore().collection('customers');
      const customersSnapshot = await customersRef.where('branchId', '==', branchId).limit(5).get();
      console.log(`✅ Can read customers: ${customersSnapshot.size} found`);
    } catch (error) {
      console.log(`❌ Cannot read customers: ${error.message}`);
    }
    
    // Test read access to users
    console.log('Testing USERS collection access...');
    try {
      const usersRef = admin.firestore().collection('users');
      const usersSnapshot = await usersRef.where('branchId', '==', branchId).limit(5).get();
      console.log(`✅ Can read users: ${usersSnapshot.size} found`);
    } catch (error) {
      console.log(`❌ Cannot read users: ${error.message}`);
    }
    
    // Test read access to reports
    console.log('Testing REPORTS collection access...');
    try {
      const reportsRef = admin.firestore().collection('reports');
      const reportsSnapshot = await reportsRef.where('branchId', '==', branchId).limit(5).get();
      console.log(`✅ Can read reports: ${reportsSnapshot.size} found`);
    } catch (error) {
      console.log(`❌ Cannot read reports: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 4. Check specific customer he's trying to delete
    console.log('📋 4. TARGET CUSTOMER ANALYSIS');
    console.log('-'.repeat(80));
    const targetCustomerId = 'RSivk7YwRyFdMWIjA8nG'; // From error logs
    const targetCustomerRef = admin.firestore().collection('customers').doc(targetCustomerId);
    const targetCustomer = await targetCustomerRef.get();
    
    if (targetCustomer.exists) {
      const customerData = targetCustomer.data();
      console.log('Customer exists:');
      console.log(JSON.stringify(customerData, null, 2));
      console.log('\nBranch Match:', customerData?.branchId === branchId);
      console.log('Should have access:', customerData?.branchId === branchId ? 'YES' : 'NO');
    } else {
      console.log('❌ Customer does not exist');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 5. Firestore Rules Analysis
    console.log('📋 5. FIRESTORE RULES ANALYSIS');
    console.log('-'.repeat(80));
    console.log('\nCustomers delete rule:');
    console.log('  allow delete: if isAuthenticated();');
    console.log('\nThis SHOULD work for ANY authenticated user.');
    console.log('\nUser is authenticated:', userRecord ? 'YES' : 'NO');
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 6. Recommendations
    console.log('📋 6. RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    const issues = [];
    
    if (!userRecord.customClaims) {
      issues.push('❌ Missing custom claims in Firebase Auth');
    }
    
    if (!firestoreUser.exists) {
      issues.push('❌ Missing user document in Firestore');
    }
    
    if (role !== 'branchAdmin') {
      issues.push(`⚠️  Unexpected role: ${role} (expected branchAdmin)`);
    }
    
    if (permissionLevel !== 1) {
      issues.push(`⚠️  Unexpected permission level: ${permissionLevel} (expected 1)`);
    }
    
    if (issues.length === 0) {
      console.log('✅ Everything looks correct!');
      console.log('\nIf deletion still fails, the issue is likely:');
      console.log('1. Token not refreshed after login');
      console.log('2. Browser cache serving old JavaScript');
      console.log('3. Service Worker cache');
      console.log('\nFix: Hard refresh (Ctrl+Shift+R) and logout/login');
    } else {
      console.log('Issues found:\n');
      issues.forEach(issue => console.log(issue));
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

diagnoseAccess();

