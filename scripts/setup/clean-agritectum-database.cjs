#!/usr/bin/env node

/**
 * Agritectum Database Cleanup Script
 * 
 * Cleans the Agritectum database while preserving the super admin account.
 * Deletes all other users, branches, and all data collections.
 * 
 * Usage: node scripts/setup/clean-agritectum-database.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin for Agritectum project
async function initializeFirebase() {
  try {
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    
    // Look for Agritectum service account key
    const serviceAccountFile = files.find(f => 
      f.startsWith('agritectum-platform-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      throw new Error('Agritectum service account key file not found. Expected: agritectum-platform-firebase-adminsdk-*.json');
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    // Initialize or reinitialize Firebase Admin
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

let db;
let auth;

async function cleanDatabase() {
  console.log('🧹 AGRITECTUM DATABASE CLEANUP\n');
  console.log('='.repeat(80));
  console.log('⚠️  WARNING: This will delete ALL data except super admin account!\n');
  console.log('='.repeat(80));
  
  const deleted = {
    users: 0,
    branches: 0,
    customers: 0,
    reports: 0,
    offers: 0,
    appointments: 0,
    scheduledVisits: 0,
    serviceAgreements: 0,
    buildings: 0,
    companies: 0,
    notifications: 0,
    emailLogs: 0,
  };
  
  const errors = [];
  let superAdminUid = null;
  let superAdminBranchId = null;
  
  try {
    // Step 1: Identify and preserve super admin
    console.log('\n📋 STEP 1: IDENTIFYING SUPER ADMIN\n');
    console.log('─'.repeat(80));
    
    const usersSnapshot = await db.collection('users').get();
    const superAdmins = [];
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.permissionLevel >= 2 || user.role === 'superadmin') {
        superAdmins.push({ id: doc.id, ...user });
      }
    });
    
    if (superAdmins.length === 0) {
      console.log('⚠️  No super admin found! Creating one...');
      // We'll create one in the test data script
    } else {
      const superAdmin = superAdmins[0];
      superAdminUid = superAdmin.id;
      superAdminBranchId = superAdmin.branchId;
      console.log(`✅ Found super admin: ${superAdmin.email} (${superAdminUid})`);
      if (superAdminBranchId) {
        console.log(`   Branch ID: ${superAdminBranchId}`);
      }
    }
    
    // Step 2: Delete all users except super admin
    console.log('\n📋 STEP 2: DELETING USERS (except super admin)\n');
    console.log('─'.repeat(80));
    
    const allUsersSnapshot = await db.collection('users').get();
    const deletePromises = [];
    
    allUsersSnapshot.forEach(doc => {
      if (doc.id !== superAdminUid) {
        deletePromises.push(
          db.collection('users').doc(doc.id).delete()
            .then(() => {
              deleted.users++;
              console.log(`  🗑️  Deleted user: ${doc.id}`);
            })
            .catch(err => {
              errors.push(`Failed to delete user ${doc.id}: ${err.message}`);
            })
        );
      } else {
        console.log(`  ✅ Preserved super admin: ${doc.id}`);
      }
    });
    
    await Promise.all(deletePromises);
    console.log(`\n✅ Deleted ${deleted.users} users`);
    
    // Step 3: Delete all branches except super admin's branch
    console.log('\n📋 STEP 3: DELETING BRANCHES (except super admin branch)\n');
    console.log('─'.repeat(80));
    
    const branchesSnapshot = await db.collection('branches').get();
    const branchDeletePromises = [];
    
    branchesSnapshot.forEach(doc => {
      if (superAdminBranchId && doc.id === superAdminBranchId) {
        console.log(`  ✅ Preserved super admin branch: ${doc.id}`);
      } else {
        branchDeletePromises.push(
          db.collection('branches').doc(doc.id).delete()
            .then(() => {
              deleted.branches++;
              console.log(`  🗑️  Deleted branch: ${doc.id}`);
            })
            .catch(err => {
              errors.push(`Failed to delete branch ${doc.id}: ${err.message}`);
            })
        );
      }
    });
    
    await Promise.all(branchDeletePromises);
    console.log(`\n✅ Deleted ${deleted.branches} branches`);
    
    // Step 4: Delete all data collections
    const collectionsToDelete = [
      { name: 'customers', key: 'customers' },
      { name: 'reports', key: 'reports' },
      { name: 'offers', key: 'offers' },
      { name: 'appointments', key: 'appointments' },
      { name: 'scheduledVisits', key: 'scheduledVisits' },
      { name: 'serviceAgreements', key: 'serviceAgreements' },
      { name: 'buildings', key: 'buildings' },
      { name: 'companies', key: 'companies' },
      { name: 'notifications', key: 'notifications' },
      { name: 'emailLogs', key: 'emailLogs' },
    ];
    
    for (const collection of collectionsToDelete) {
      console.log(`\n📋 STEP ${4 + collectionsToDelete.indexOf(collection)}: DELETING ${collection.name.toUpperCase()}\n`);
      console.log('─'.repeat(80));
      
      try {
        const snapshot = await db.collection(collection.name).get();
        const deletePromises = [];
        
        snapshot.forEach(doc => {
          deletePromises.push(
            db.collection(collection.name).doc(doc.id).delete()
              .catch(err => {
                errors.push(`Failed to delete ${collection.name} ${doc.id}: ${err.message}`);
              })
          );
        });
        
        await Promise.all(deletePromises);
        deleted[collection.key] = snapshot.size;
        console.log(`✅ Deleted ${snapshot.size} ${collection.name} documents`);
      } catch (error) {
        errors.push(`Error deleting ${collection.name}: ${error.message}`);
        console.log(`⚠️  Error deleting ${collection.name}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 CLEANUP SUMMARY\n');
    console.log('='.repeat(80));
    
    console.log('\n✅ DELETED:');
    console.log(`  Users: ${deleted.users}`);
    console.log(`  Branches: ${deleted.branches}`);
    console.log(`  Customers: ${deleted.customers}`);
    console.log(`  Reports: ${deleted.reports}`);
    console.log(`  Offers: ${deleted.offers}`);
    console.log(`  Appointments: ${deleted.appointments}`);
    console.log(`  Scheduled Visits: ${deleted.scheduledVisits}`);
    console.log(`  Service Agreements: ${deleted.serviceAgreements}`);
    console.log(`  Buildings: ${deleted.buildings}`);
    console.log(`  Companies: ${deleted.companies}`);
    console.log(`  Notifications: ${deleted.notifications}`);
    console.log(`  Email Logs: ${deleted.emailLogs}`);
    
    if (superAdminUid) {
      console.log(`\n✅ PRESERVED: Super admin (${superAdminUid})`);
      if (superAdminBranchId) {
        console.log(`   Branch: ${superAdminBranchId}`);
      }
    }
    
    console.log(`\n❌ ERRORS: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (errors.length === 0) {
      console.log('\n✅ CLEANUP COMPLETE: Database cleaned successfully!\n');
    } else {
      console.log('\n⚠️  CLEANUP COMPLETE: Some errors occurred during cleanup.\n');
    }
    
    console.log('='.repeat(80));
    
    return { superAdminUid, superAdminBranchId };
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await initializeFirebase();
    // Initialize services after app init
    db = admin.firestore();
    auth = admin.auth();
    await cleanDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
})();

