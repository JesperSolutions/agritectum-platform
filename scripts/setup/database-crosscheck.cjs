#!/usr/bin/env node

/**
 * Database Cross-Check Script
 * 
 * This script checks if the database structure makes sense
 * and if the app uses the databases correctly.
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

async function crossCheckDatabase() {
  console.log('🔍 DATABASE CROSS-CHECK ANALYSIS\n');
  console.log('='.repeat(80));
  
  const issues = [];
  const warnings = [];
  const successes = [];
  
  // 1. Check Users Collection
  console.log('\n📋 1. USERS COLLECTION ANALYSIS\n');
  console.log('─'.repeat(80));
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total users: ${users.length}`);
    
    // Check for duplicates
    const emails = {};
    users.forEach(user => {
      if (user.email) {
        if (emails[user.email]) {
          warnings.push(`Duplicate email: ${user.email} (IDs: ${emails[user.email]}, ${user.id})`);
        } else {
          emails[user.email] = user.id;
        }
      }
    });
    
    // Check for missing required fields
    users.forEach(user => {
      if (!user.role) {
        issues.push(`User ${user.id} (${user.email}) missing 'role' field`);
      }
      if (user.role !== 'superadmin' && !user.branchId) {
        warnings.push(`User ${user.id} (${user.email}) missing 'branchId' field`);
      }
      if (user.permissionLevel === undefined) {
        warnings.push(`User ${user.id} (${user.email}) missing 'permissionLevel' field`);
      }
    });
    
    // Check role distribution
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('Role distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });
    
    successes.push(`Users collection: ${users.length} users found`);
    
  } catch (error) {
    issues.push(`Error checking users: ${error.message}`);
  }
  
  // 2. Check Branches Collection
  console.log('\n📋 2. BRANCHES COLLECTION ANALYSIS\n');
  console.log('─'.repeat(80));
  
  try {
    const branchesSnapshot = await db.collection('branches').get();
    const branches = [];
    
    branchesSnapshot.forEach(doc => {
      branches.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total branches: ${branches.length}`);
    
    // Check for missing required fields
    branches.forEach(branch => {
      if (!branch.name) {
        issues.push(`Branch ${branch.id} missing 'name' field`);
      }
      if (!branch.email) {
        warnings.push(`Branch ${branch.id} missing 'email' field`);
      }
    });
    
    // List branches
    console.log('\nBranches:');
    branches.forEach(branch => {
      console.log(`  • ${branch.name} (ID: ${branch.id})`);
    });
    
    successes.push(`Branches collection: ${branches.length} branches found`);
    
  } catch (error) {
    issues.push(`Error checking branches: ${error.message}`);
  }
  
  // 3. Check Reports Collection
  console.log('\n📋 3. REPORTS COLLECTION ANALYSIS\n');
  console.log('─'.repeat(80));
  
  try {
    const reportsSnapshot = await db.collection('reports').get();
    const reports = [];
    
    reportsSnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total reports: ${reports.length}`);
    
    // Check for missing branchId
    const reportsWithoutBranch = reports.filter(r => !r.branchId);
    if (reportsWithoutBranch.length > 0) {
      issues.push(`${reportsWithoutBranch.length} reports missing 'branchId' field`);
      console.log(`⚠️  ${reportsWithoutBranch.length} reports missing branchId:`);
      reportsWithoutBranch.slice(0, 5).forEach(r => {
        console.log(`    - ${r.id}: ${r.customerName || 'Unknown customer'}`);
      });
    }
    
    // Check for missing createdBy
    const reportsWithoutCreator = reports.filter(r => !r.createdBy);
    if (reportsWithoutCreator.length > 0) {
      issues.push(`${reportsWithoutCreator.length} reports missing 'createdBy' field`);
    }
    
    // Check status distribution
    const statusCounts = {};
    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    console.log('\nStatus distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} reports`);
    });
    
    successes.push(`Reports collection: ${reports.length} reports found`);
    
  } catch (error) {
    issues.push(`Error checking reports: ${error.message}`);
  }
  
  // 4. Check Customers Collection
  console.log('\n📋 4. CUSTOMERS COLLECTION ANALYSIS\n');
  console.log('─'.repeat(80));
  
  try {
    const customersSnapshot = await db.collection('customers').get();
    const customers = [];
    
    customersSnapshot.forEach(doc => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total customers: ${customers.length}`);
    
    // Check for missing required fields
    customers.forEach(customer => {
      if (!customer.name) {
        issues.push(`Customer ${customer.id} missing 'name' field`);
      }
      if (!customer.branchId) {
        warnings.push(`Customer ${customer.id} (${customer.name}) missing 'branchId' field`);
      }
    });
    
    successes.push(`Customers collection: ${customers.length} customers found`);
    
  } catch (error) {
    issues.push(`Error checking customers: ${error.message}`);
  }
  
  // 5. Check Appointments Collection
  console.log('\n📋 5. APPOINTMENTS COLLECTION ANALYSIS\n');
  console.log('─'.repeat(80));
  
  try {
    const appointmentsSnapshot = await db.collection('appointments').get();
    const appointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Total appointments: ${appointments.length}`);
    
    if (appointments.length === 0) {
      warnings.push('No appointments found - schedule feature not being used');
    }
    
    successes.push(`Appointments collection: ${appointments.length} appointments found`);
    
  } catch (error) {
    issues.push(`Error checking appointments: ${error.message}`);
  }
  
  // 6. Check for orphaned data
  console.log('\n📋 6. DATA INTEGRITY CHECK\n');
  console.log('─'.repeat(80));
  
  try {
    // Check if reports reference valid customers
    const reportsSnapshot = await db.collection('reports').get();
    const customersSnapshot = await db.collection('customers').get();
    
    const customerEmails = new Set();
    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      if (customer.email) {
        customerEmails.add(customer.email.toLowerCase());
      }
    });
    
    let orphanedReports = 0;
    reportsSnapshot.forEach(doc => {
      const report = doc.data();
      if (report.customerEmail && !customerEmails.has(report.customerEmail.toLowerCase())) {
        orphanedReports++;
      }
    });
    
    if (orphanedReports > 0) {
      warnings.push(`${orphanedReports} reports reference customers not in customers collection`);
    }
    
    // Check if users reference valid branches
    const usersSnapshot = await db.collection('users').get();
    const branchesSnapshot = await db.collection('branches').get();
    
    const branchIds = new Set();
    branchesSnapshot.forEach(doc => {
      branchIds.add(doc.id);
    });
    
    let invalidBranchReferences = 0;
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.branchId && !branchIds.has(user.branchId)) {
        invalidBranchReferences++;
      }
    });
    
    if (invalidBranchReferences > 0) {
      issues.push(`${invalidBranchReferences} users reference non-existent branches`);
    }
    
    successes.push('Data integrity check completed');
    
  } catch (error) {
    issues.push(`Error checking data integrity: ${error.message}`);
  }
  
  // 7. Check Firestore Security Rules
  console.log('\n📋 7. SECURITY RULES CHECK\n');
  console.log('─'.repeat(80));
  
  try {
    const rulesFile = path.join(__dirname, '..', 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesFile, 'utf8');
    
    // Check if rules exist
    if (!rulesContent) {
      issues.push('Firestore rules file is empty');
    } else {
      // Check for key rules
      const hasUsersRule = rulesContent.includes('match /users/{userId}');
      const hasReportsRule = rulesContent.includes('match /reports/{reportId}');
      const hasBranchesRule = rulesContent.includes('match /branches/{branchId}');
      const hasCustomersRule = rulesContent.includes('match /customers/{customerId}');
      
      if (!hasUsersRule) issues.push('Missing users collection rules');
      if (!hasReportsRule) issues.push('Missing reports collection rules');
      if (!hasBranchesRule) issues.push('Missing branches collection rules');
      if (!hasCustomersRule) issues.push('Missing customers collection rules');
      
      // Check for custom claims usage
      const hasCustomClaims = rulesContent.includes('request.auth.token');
      if (!hasCustomClaims) {
        warnings.push('Security rules may not be using custom claims');
      }
      
      successes.push('Security rules file exists and contains collection rules');
    }
    
  } catch (error) {
    issues.push(`Error checking security rules: ${error.message}`);
  }
  
  // 8. Check for subcollections
  console.log('\n📋 8. SUBCOLLECTIONS CHECK\n');
  console.log('─'.repeat(80));
  
  try {
    const branchesSnapshot = await db.collection('branches').limit(5).get();
    
    if (!branchesSnapshot.empty) {
      console.log('Checking branches subcollections...');
      
      for (const branchDoc of branchesSnapshot.docs) {
        const employeesSnapshot = await db.collection('branches').doc(branchDoc.id).collection('employees').get();
        
        if (!employeesSnapshot.empty) {
          console.log(`  ✅ branches/${branchDoc.id}/employees: ${employeesSnapshot.size} employees`);
        }
      }
    }
    
    successes.push('Subcollections check completed');
    
  } catch (error) {
    issues.push(`Error checking subcollections: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CROSS-CHECK SUMMARY\n');
  console.log('='.repeat(80));
  
  console.log(`\n✅ SUCCESSES: ${successes.length}`);
  successes.forEach((success, index) => {
    console.log(`  ${index + 1}. ${success}`);
  });
  
  console.log(`\n⚠️  WARNINGS: ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  } else {
    console.log('  No warnings');
  }
  
  console.log(`\n❌ ISSUES: ${issues.length}`);
  if (issues.length > 0) {
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log('  No critical issues found');
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Overall assessment
  console.log('\n🎯 OVERALL ASSESSMENT\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ EXCELLENT: Database structure is clean and well-organized!');
  } else if (issues.length === 0) {
    console.log('✅ GOOD: Database structure is mostly correct with minor warnings.');
  } else if (issues.length < 5) {
    console.log('⚠️  NEEDS ATTENTION: Some issues found that should be addressed.');
  } else {
    console.log('❌ CRITICAL: Multiple issues found that need immediate attention.');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Cross-check complete!\n');
  
  process.exit(0);
}

// Run the cross-check
crossCheckDatabase();

