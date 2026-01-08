#!/usr/bin/env node

/**
 * Verify Branch Admins Script
 * 
 * This script verifies that all branch admins have:
 * - Correct departments/branches assigned
 * - Correct custom claims
 * - Proper permissions
 * - Valid user data
 * 
 * Usage: node scripts/verify-branch-admins.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  const fs = require('fs');
  
  // Find the service account key file
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => 
    f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-') && 
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

/**
 * Main verification function
 */
async function verifyBranchAdmins() {
  console.log('🔍 Verifying Branch Admins Configuration\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Get all branches
    console.log('\n📁 Step 1: Fetching all branches...');
    const branchesSnapshot = await admin.firestore().collection('branches').get();
    const branches = branchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`   ✅ Found ${branches.length} branches\n`);
    
    // Display branches
    branches.forEach(branch => {
      console.log(`   📍 ${branch.name}`);
      console.log(`      ID: ${branch.id}`);
      console.log(`      Email: ${branch.email || 'N/A'}`);
      console.log(`      Active: ${branch.isActive !== false ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // 2. Get all users
    console.log('👥 Step 2: Fetching all users...');
    const usersSnapshot = await admin.firestore().collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    console.log(`   ✅ Found ${users.length} users\n`);
    
    // 3. Get all Firebase Auth users
    console.log('🔐 Step 3: Fetching Firebase Auth users...');
    const authUsers = await admin.auth().listUsers();
    console.log(`   ✅ Found ${authUsers.users.length} Firebase Auth users\n`);
    
    // 4. Analyze branch admins
    console.log('👔 Step 4: Analyzing Branch Admins...\n');
    
    const branchAdmins = users.filter(u => u.role === 'branchAdmin');
    const superAdmins = users.filter(u => u.role === 'superadmin');
    const inspectors = users.filter(u => u.role === 'inspector');
    
    console.log(`   📊 User Distribution:`);
    console.log(`      • Super Admins: ${superAdmins.length}`);
    console.log(`      • Branch Admins: ${branchAdmins.length}`);
    console.log(`      • Inspectors: ${inspectors.length}`);
    console.log('');
    
    // 5. Verify each branch admin
    console.log('🔍 Step 5: Verifying Branch Admin Configurations...\n');
    
    const issues = [];
    const warnings = [];
    
    for (const admin of branchAdmins) {
      console.log(`   👤 ${admin.displayName || admin.email}`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      UID: ${admin.uid}`);
      console.log(`      Role: ${admin.role}`);
      console.log(`      Permission Level: ${admin.permissionLevel}`);
      console.log(`      Branch ID: ${admin.branchId || 'NOT SET'}`);
      
      // Check if branch exists
      if (admin.branchId) {
        const branch = branches.find(b => b.id === admin.branchId);
        if (branch) {
          console.log(`      ✅ Branch: ${branch.name}`);
        } else {
          console.log(`      ❌ Branch NOT FOUND: ${admin.branchId}`);
          issues.push({
            user: admin.email,
            issue: 'Branch ID does not exist',
            branchId: admin.branchId
          });
        }
      } else {
        console.log(`      ❌ Branch ID NOT SET`);
        issues.push({
          user: admin.email,
          issue: 'Branch ID not set',
          branchId: null
        });
      }
      
      // Check Firebase Auth user
      const authUser = authUsers.users.find(u => u.email === admin.email);
      if (authUser) {
        console.log(`      ✅ Firebase Auth user exists`);
        
        // Check custom claims
        if (authUser.customClaims) {
          console.log(`      ✅ Custom claims present`);
          console.log(`         Role: ${authUser.customClaims.role}`);
          console.log(`         Permission Level: ${authUser.customClaims.permissionLevel}`);
          console.log(`         Branch ID: ${authUser.customClaims.branchId || 'NOT SET'}`);
          
          // Verify claims match Firestore
          if (authUser.customClaims.role !== admin.role) {
            warnings.push({
              user: admin.email,
              issue: 'Role mismatch between Auth and Firestore',
              authRole: authUser.customClaims.role,
              firestoreRole: admin.role
            });
          }
          
          if (authUser.customClaims.permissionLevel !== admin.permissionLevel) {
            warnings.push({
              user: admin.email,
              issue: 'Permission level mismatch',
              authLevel: authUser.customClaims.permissionLevel,
              firestoreLevel: admin.permissionLevel
            });
          }
          
          if (authUser.customClaims.branchId !== admin.branchId) {
            warnings.push({
              user: admin.email,
              issue: 'Branch ID mismatch',
              authBranchId: authUser.customClaims.branchId,
              firestoreBranchId: admin.branchId
            });
          }
        } else {
          console.log(`      ❌ No custom claims set`);
          issues.push({
            user: admin.email,
            issue: 'Custom claims not set in Firebase Auth'
          });
        }
      } else {
        console.log(`      ❌ Firebase Auth user NOT FOUND`);
        issues.push({
          user: admin.email,
          issue: 'User not found in Firebase Auth'
        });
      }
      
      console.log('');
    }
    
    // 6. Check for branches without admins
    console.log('📋 Step 6: Checking for branches without admins...\n');
    
    const branchesWithoutAdmins = branches.filter(branch => {
      return !branchAdmins.some(admin => admin.branchId === branch.id);
    });
    
    if (branchesWithoutAdmins.length > 0) {
      console.log(`   ⚠️  ${branchesWithoutAdmins.length} branch(es) without admins:\n`);
      branchesWithoutAdmins.forEach(branch => {
        console.log(`      • ${branch.name} (ID: ${branch.id})`);
        warnings.push({
          branch: branch.name,
          issue: 'No branch admin assigned'
        });
      });
      console.log('');
    } else {
      console.log(`   ✅ All branches have at least one admin\n`);
    }
    
    // 7. Summary Report
    console.log('='.repeat(80));
    console.log('\n📊 VERIFICATION SUMMARY\n');
    
    console.log(`   Total Branches: ${branches.length}`);
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Branch Admins: ${branchAdmins.length}`);
    console.log(`   Super Admins: ${superAdmins.length}`);
    console.log(`   Inspectors: ${inspectors.length}`);
    console.log('');
    
    if (issues.length > 0) {
      console.log(`   ❌ CRITICAL ISSUES: ${issues.length}\n`);
      issues.forEach((issue, index) => {
        console.log(`      ${index + 1}. ${issue.user || issue.branch}`);
        console.log(`         Issue: ${issue.issue}`);
        if (issue.branchId) console.log(`         Branch ID: ${issue.branchId}`);
        if (issue.authRole) console.log(`         Auth Role: ${issue.authRole}`);
        if (issue.firestoreRole) console.log(`         Firestore Role: ${issue.firestoreRole}`);
        console.log('');
      });
    } else {
      console.log(`   ✅ No critical issues found\n`);
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  WARNINGS: ${warnings.length}\n`);
      warnings.forEach((warning, index) => {
        console.log(`      ${index + 1}. ${warning.user || warning.branch}`);
        console.log(`         Warning: ${warning.issue}`);
        if (warning.branchId) console.log(`         Branch ID: ${warning.branchId}`);
        if (warning.authBranchId) console.log(`         Auth Branch ID: ${warning.authBranchId}`);
        if (warning.firestoreBranchId) console.log(`         Firestore Branch ID: ${warning.firestoreBranchId}`);
        console.log('');
      });
    } else {
      console.log(`   ✅ No warnings\n`);
    }
    
    // 8. Recommendations
    console.log('💡 RECOMMENDATIONS\n');
    
    if (issues.length > 0) {
      console.log('   Critical actions needed:');
      console.log('   1. Fix users without branch IDs');
      console.log('   2. Set custom claims for users missing them');
      console.log('   3. Verify all branch IDs exist\n');
    }
    
    if (warnings.length > 0) {
      console.log('   Recommended actions:');
      console.log('   1. Assign branch admins to branches without them');
      console.log('   2. Sync custom claims between Auth and Firestore');
      console.log('   3. Review permission levels\n');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('   ✅ All branch admins are properly configured!\n');
    }
    
    // 9. Export detailed report
    const report = {
      timestamp: new Date().toISOString(),
      branches: branches.length,
      users: users.length,
      branchAdmins: branchAdmins.length,
      superAdmins: superAdmins.length,
      inspectors: inspectors.length,
      issues,
      warnings,
      branchAdmins: branchAdmins.map(admin => ({
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissionLevel: admin.permissionLevel,
        branchId: admin.branchId,
        branchName: branches.find(b => b.id === admin.branchId)?.name || 'NOT FOUND'
      }))
    };
    
    const fs = require('fs');
    const reportPath = path.join(__dirname, '..', 'branch-admin-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Detailed report saved to: branch-admin-verification-report.json\n`);
    
    console.log('='.repeat(80));
    console.log('\n✅ Verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
verifyBranchAdmins();

