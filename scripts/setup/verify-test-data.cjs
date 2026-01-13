#!/usr/bin/env node

/**
 * Verify Database Contents
 * 
 * Quick verification of test data
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    
    const serviceAccountFile = files.find(f => 
      f.startsWith('agritectum-platform-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      throw new Error('Agritectum service account key file not found');
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    if (admin.apps.length > 0) {
      admin.app().delete();
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin initialized\n');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function verifyDatabase() {
  console.log('🔍 VERIFYING DATABASE CONTENTS\n');
  console.log('='.repeat(80));
  
  await initializeFirebase();
  const db = admin.firestore();
  
  // Check each collection
  const collections = [
    { name: 'branches', key: 'name' },
    { name: 'users', key: 'email' },
    { name: 'customers', key: 'name' },
    { name: 'buildings', key: 'address' },
    { name: 'reports', key: 'customerName' },
    { name: 'serviceAgreements', key: 'customerName' },
    { name: 'scheduledVisits', key: 'customerName' },
  ];
  
  for (const collection of collections) {
    console.log(`\n📁 ${collection.name.toUpperCase()}`);
    console.log('─'.repeat(80));
    
    const snapshot = await db.collection(collection.name).get();
    console.log(`   Count: ${snapshot.size}`);
    
    if (!snapshot.empty && snapshot.size <= 15) {
      snapshot.forEach((doc, idx) => {
        const data = doc.data();
        const displayValue = data[collection.key] || doc.id;
        console.log(`   ${idx + 1}. ${displayValue}`);
      });
    }
  }
  
  // Detailed report verification
  console.log('\n\n📄 REPORT DETAILS (Sample)');
  console.log('='.repeat(80));
  
  const reportsSnapshot = await db.collection('reports').limit(3).get();
  reportsSnapshot.forEach((doc, idx) => {
    const data = doc.data();
    console.log(`\n${idx + 1}. Report ID: ${doc.id}`);
    console.log(`   Customer: ${data.customerName}`);
    console.log(`   Building: ${data.buildingAddress}`);
    console.log(`   Roof Type: ${data.roofType} (${data.roofSize}m²)`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Inspector: ${data.createdByName}`);
    console.log(`   Date: ${data.inspectionDate}`);
    console.log(`   Issues: ${data.issuesFound?.length || 0}`);
    console.log(`   Actions: ${data.recommendedActions?.length || 0}`);
  });
  
  console.log('\n\n✅ Verification Complete!\n');
}

verifyDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
