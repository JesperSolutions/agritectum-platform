#!/usr/bin/env node

/**
 * Database Cleanup Script
 * 
 * This script fixes database issues found during cross-check:
 * 1. Removes duplicate users
 * 2. Adds missing createdBy field to reports
 * 3. Fixes invalid branch references
 * 4. Removes/fixes the "test" user
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
    throw new Error('Service account key file not found.');
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

const db = admin.firestore();

async function cleanupDatabase() {
  console.log('🧹 DATABASE CLEANUP\n');
  console.log('='.repeat(80));
  
  const fixes = [];
  const errors = [];
  
  // 1. Remove duplicate users
  console.log('\n📋 1. REMOVING DUPLICATE USERS\n');
  console.log('─'.repeat(80));
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    // Find duplicates by email
    const emailMap = {};
    users.forEach(user => {
      if (user.email) {
        const email = user.email.toLowerCase();
        if (!emailMap[email]) {
          emailMap[email] = [];
        }
        emailMap[email].push(user);
      }
    });
    
    // Remove duplicates (keep the one with proper custom claims)
    for (const [email, userList] of Object.entries(emailMap)) {
      if (userList.length > 1) {
        console.log(`\nFound duplicates for ${email}:`);
        
        // Sort by whether they have proper custom claims (keep those with more complete data)
        userList.sort((a, b) => {
          const aScore = (a.role ? 1 : 0) + (a.permissionLevel !== undefined ? 1 : 0) + (a.branchId ? 1 : 0);
          const bScore = (b.role ? 1 : 0) + (b.permissionLevel !== undefined ? 1 : 0) + (b.branchId ? 1 : 0);
          return bScore - aScore;
        });
        
        // Keep the first one, delete the rest
        const toKeep = userList[0];
        const toDelete = userList.slice(1);
        
        console.log(`  ✅ Keeping: ${toKeep.id} (${toKeep.displayName || 'No name'})`);
        
        for (const user of toDelete) {
          console.log(`  🗑️  Deleting: ${user.id} (${user.displayName || 'No name'})`);
          try {
            await db.collection('users').doc(user.id).delete();
            fixes.push(`Removed duplicate user: ${user.id} (${email})`);
          } catch (error) {
            errors.push(`Failed to delete user ${user.id}: ${error.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    errors.push(`Error removing duplicates: ${error.message}`);
  }
  
  // 2. Remove the "test" user
  console.log('\n📋 2. REMOVING "TEST" USER\n');
  console.log('─'.repeat(80));
  
  try {
    const testUsersSnapshot = await db.collection('users').where('displayName', '==', 'test').get();
    
    if (!testUsersSnapshot.empty) {
      console.log(`Found ${testUsersSnapshot.size} test user(s) to remove:`);
      
      testUsersSnapshot.forEach(async (doc) => {
        console.log(`  🗑️  Deleting: ${doc.id}`);
        try {
          await db.collection('users').doc(doc.id).delete();
          fixes.push(`Removed test user: ${doc.id}`);
        } catch (error) {
          errors.push(`Failed to delete test user ${doc.id}: ${error.message}`);
        }
      });
    } else {
      console.log('  ✅ No test users found');
    }
    
  } catch (error) {
    errors.push(`Error removing test users: ${error.message}`);
  }
  
  // 3. Fix reports missing createdBy field
  console.log('\n📋 3. FIXING REPORTS MISSING createdBy FIELD\n');
  console.log('─'.repeat(80));
  
  try {
    const reportsSnapshot = await db.collection('reports').get();
    let fixedCount = 0;
    
    reportsSnapshot.forEach(async (doc) => {
      const report = doc.data();
      
      if (!report.createdBy) {
        console.log(`  Fixing report: ${doc.id} (${report.customerName || 'Unknown'})`);
        
        // Try to find the creator from the report data
        let createdBy = null;
        
        // Check if there's a createdBy field in the document
        if (report.createdBy) {
          createdBy = report.createdBy;
        } else {
          // Set a default creator (superadmin) for orphaned reports
          const superadminSnapshot = await db.collection('users').where('role', '==', 'superadmin').limit(1).get();
          if (!superadminSnapshot.empty) {
            createdBy = superadminSnapshot.docs[0].id;
          }
        }
        
        if (createdBy) {
          try {
            await db.collection('reports').doc(doc.id).update({
              createdBy: createdBy,
              lastEdited: admin.firestore.FieldValue.serverTimestamp(),
            });
            fixedCount++;
            fixes.push(`Added createdBy to report: ${doc.id}`);
          } catch (error) {
            errors.push(`Failed to update report ${doc.id}: ${error.message}`);
          }
        }
      }
    });
    
    console.log(`  ✅ Fixed ${fixedCount} reports`);
    
  } catch (error) {
    errors.push(`Error fixing reports: ${error.message}`);
  }
  
  // 4. Fix users with invalid branch references
  console.log('\n📋 4. FIXING INVALID BRANCH REFERENCES\n');
  console.log('─'.repeat(80));
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const branchesSnapshot = await db.collection('branches').get();
    
    const branchIds = new Set();
    branchesSnapshot.forEach(doc => {
      branchIds.add(doc.id);
    });
    
    let fixedCount = 0;
    
    usersSnapshot.forEach(async (doc) => {
      const user = doc.data();
      
      if (user.branchId && !branchIds.has(user.branchId)) {
        console.log(`  Fixing user: ${doc.id} (${user.email || 'No email'})`);
        console.log(`    Invalid branchId: ${user.branchId}`);
        
        // Set to "main" branch as default
        try {
          await db.collection('users').doc(doc.id).update({
            branchId: 'main',
          });
          fixedCount++;
          fixes.push(`Fixed branch reference for user: ${doc.id}`);
        } catch (error) {
          errors.push(`Failed to fix user ${doc.id}: ${error.message}`);
        }
      }
    });
    
    console.log(`  ✅ Fixed ${fixedCount} users`);
    
  } catch (error) {
    errors.push(`Error fixing branch references: ${error.message}`);
  }
  
  // 5. Fix reports missing branchId
  console.log('\n📋 5. FIXING REPORTS MISSING branchId FIELD\n');
  console.log('─'.repeat(80));
  
  try {
    const reportsSnapshot = await db.collection('reports').get();
    let fixedCount = 0;
    
    reportsSnapshot.forEach(async (doc) => {
      const report = doc.data();
      
      if (!report.branchId) {
        console.log(`  Fixing report: ${doc.id} (${report.customerName || 'Unknown'})`);
        
        // Try to find branch from createdBy user
        let branchId = 'main'; // Default to main branch
        
        if (report.createdBy) {
          try {
            const userDoc = await db.collection('users').doc(report.createdBy).get();
            if (userDoc.exists() && userDoc.data().branchId) {
              branchId = userDoc.data().branchId;
            }
          } catch (error) {
            console.log(`    Could not get user data: ${error.message}`);
          }
        }
        
        try {
          await db.collection('reports').doc(doc.id).update({
            branchId: branchId,
            lastEdited: admin.firestore.FieldValue.serverTimestamp(),
          });
          fixedCount++;
          fixes.push(`Added branchId to report: ${doc.id}`);
        } catch (error) {
          errors.push(`Failed to update report ${doc.id}: ${error.message}`);
        }
      }
    });
    
    console.log(`  ✅ Fixed ${fixedCount} reports`);
    
  } catch (error) {
    errors.push(`Error fixing report branchIds: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CLEANUP SUMMARY\n');
  console.log('='.repeat(80));
  
  console.log(`\n✅ FIXES APPLIED: ${fixes.length}`);
  if (fixes.length > 0) {
    fixes.slice(0, 10).forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`);
    });
    if (fixes.length > 10) {
      console.log(`  ... and ${fixes.length - 10} more fixes`);
    }
  }
  
  console.log(`\n❌ ERRORS: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('  No errors');
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (errors.length === 0) {
    console.log('\n✅ CLEANUP COMPLETE: All fixes applied successfully!\n');
  } else {
    console.log('\n⚠️  CLEANUP COMPLETE: Some errors occurred during cleanup.\n');
  }
  
  console.log('='.repeat(80));
  
  process.exit(0);
}

// Run the cleanup
cleanupDatabase();

