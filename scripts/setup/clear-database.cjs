#!/usr/bin/env node

/**
 * Clear Database Script
 * 
 * This script clears all test data from the database:
 * - Reports
 * - Buildings
 * - Customers
 * - Service Agreements
 * - Scheduled Visits
 * - Appointments
 * - Rejected Orders
 * 
 * ⚠️ WARNING: This will delete ALL data in these collections!
 * 
 * Usage: node scripts/setup/clear-database.cjs
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
      throw new Error('Agritectum service account key file not found. Expected: agritectum-platform-firebase-adminsdk-*.json');
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    if (admin.apps.length > 0) {
      admin.app().delete();
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin initialized for Agritectum Platform\n');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

// Delete all documents in a collection
async function deleteCollection(db, collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   ℹ️  ${collectionName}: No documents to delete`);
    return 0;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`   ✅ ${collectionName}: Deleted ${count} documents`);
  return count;
}

// Delete collection in batches (for large collections)
async function deleteCollectionInBatches(db, collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  let deletedCount = 0;
  
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    
    if (snapshot.empty) {
      break;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += snapshot.docs.length;
    console.log(`   📦 ${collectionName}: Deleted batch of ${snapshot.docs.length} documents (total: ${deletedCount})`);
  }
  
  if (deletedCount > 0) {
    console.log(`   ✅ ${collectionName}: Deleted ${deletedCount} documents total`);
  } else {
    console.log(`   ℹ️  ${collectionName}: No documents to delete`);
  }
  
  return deletedCount;
}

async function clearDatabase() {
  console.log('🧹 CLEARING DATABASE\n');
  console.log('='.repeat(80));
  console.log('⚠️  WARNING: This will delete ALL data in the following collections:');
  console.log('   - reports');
  console.log('   - buildings');
  console.log('   - customers');
  console.log('   - serviceAgreements');
  console.log('   - scheduledVisits');
  console.log('   - appointments');
  console.log('   - rejectedOrders');
  console.log('='.repeat(80));
  console.log('');
  
  await initializeFirebase();
  const db = admin.firestore();
  
  const collections = [
    'reports',
    'buildings',
    'customers',
    'serviceAgreements',
    'scheduledVisits',
    'appointments',
    'rejectedOrders',
  ];
  
  let totalDeleted = 0;
  
  for (const collectionName of collections) {
    try {
      console.log(`🗑️  Deleting ${collectionName}...`);
      const deleted = await deleteCollectionInBatches(db, collectionName);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`   ❌ Error deleting ${collectionName}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Database cleared! Total documents deleted: ${totalDeleted}`);
  console.log('='.repeat(80));
  console.log('\n💡 You can now run the generate-test-data script to create new test data.\n');
}

// Run the script
clearDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
