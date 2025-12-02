#!/usr/bin/env node

/**
 * Database Inspector Script
 * 
 * This script inspects the current Firebase Firestore database
 * and shows you what data exists in each collection.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => f.startsWith('agritectum-platform-firebase-adminsdk-fbsvc-') && f.endsWith('.json'));
  
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

const db = admin.firestore();

async function inspectCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(10).get();
    
    if (snapshot.empty) {
      console.log(`   📭 No documents found`);
      return 0;
    }
    
    console.log(`   📄 Found ${snapshot.size} document(s):`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   ${index + 1}. Document ID: ${doc.id}`);
      
      // Show key fields (limit to first 5 fields to avoid clutter)
      const entries = Object.entries(data).slice(0, 5);
      entries.forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          console.log(`      ${key}: [Object]`);
        } else if (typeof value === 'string' && value.length > 50) {
          console.log(`      ${key}: ${value.substring(0, 50)}...`);
        } else {
          console.log(`      ${key}: ${value}`);
        }
      });
      
      if (Object.keys(data).length > 5) {
        console.log(`      ... and ${Object.keys(data).length - 5} more fields`);
      }
    });
    
    return snapshot.size;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return 0;
  }
}

async function inspectDatabase() {
  console.log('🔍 Inspecting Firebase Firestore Database...\n');
  console.log('='.repeat(80));
  
  // Collections to inspect
  const collections = [
    'users',
    'branches',
    'reports',
    'customers',
    'appointments',
    'notifications',
    'emailLogs',
    'mail',
    'mail-templates',
    'mail-suppressions',
    'mail-events',
    'reportAccessLogs',
  ];
  
  const results = {};
  
  for (const collectionName of collections) {
    console.log(`\n📁 Collection: ${collectionName}`);
    console.log('─'.repeat(80));
    
    const count = await inspectCollection(collectionName);
    results[collectionName] = count;
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 DATABASE SUMMARY\n');
  
  const totalDocs = Object.values(results).reduce((sum, count) => sum + count, 0);
  
  console.log(`Total Documents: ${totalDocs}\n`);
  
  console.log('Collections:');
  Object.entries(results).forEach(([collection, count]) => {
    const status = count > 0 ? '✅' : '📭';
    console.log(`  ${status} ${collection.padEnd(25)} ${count} documents`);
  });
  
  // Check for subcollections
  console.log('\n🔍 Checking for subcollections...\n');
  
  try {
    // Check branches/{branchId}/employees
    const branchesSnapshot = await db.collection('branches').limit(3).get();
    if (!branchesSnapshot.empty) {
      console.log('📁 Subcollections under branches:');
      for (const branchDoc of branchesSnapshot.docs) {
        const employeesSnapshot = await db.collection('branches').doc(branchDoc.id).collection('employees').get();
        if (!employeesSnapshot.empty) {
          console.log(`   ✅ branches/${branchDoc.id}/employees: ${employeesSnapshot.size} documents`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error checking subcollections: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Database inspection complete!\n');
  
  process.exit(0);
}

// Run the inspection
inspectDatabase();

