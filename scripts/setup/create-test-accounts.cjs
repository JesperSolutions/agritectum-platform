#!/usr/bin/env node

/**
 * Create Test Accounts for Agritectum Platform
 * 
 * Creates:
 * - Super Admin
 * - Branch Manager (Branch Admin)
 * - Roofer (Inspector)
 * - Customer User
 */

const path = require('path');
const fs = require('fs');

// Try to resolve firebase-admin from functions directory
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  // Try loading from functions directory
  const functionsPath = path.join(__dirname, '../../functions/node_modules/firebase-admin');
  if (fs.existsSync(functionsPath)) {
    admin = require(functionsPath);
  } else {
    console.error('❌ firebase-admin not found!');
    console.error('   Please run: cd functions && npm install firebase-admin');
    process.exit(1);
  }
}

const readline = require('readline');

// Initialize Firebase Admin
// Try multiple paths for service account
const possiblePaths = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  './serviceAccountKey.json',
  './agritectum-platform-firebase-adminsdk-fbsvc-8ca0569d6e.json',
  './agritectum-platform-firebase-adminsdk.json',
  path.join(__dirname, '../../serviceAccountKey.json'),
  path.join(__dirname, '../../agritectum-platform-firebase-adminsdk-fbsvc-8ca0569d6e.json'),
  path.join(__dirname, '../../agritectum-platform-firebase-adminsdk.json')
].filter(Boolean);

let serviceAccountPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    serviceAccountPath = path.resolve(possiblePath);
    break;
  }
}

if (!serviceAccountPath) {
  console.error('❌ Service account key not found!');
  console.error('   Please:');
  console.error('   1. Download service account key from Firebase Console');
  console.error('   2. Save as serviceAccountKey.json in project root');
  console.error('   3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.error('\n   Or run from functions directory:');
  console.error('   cd functions && node ../scripts/setup/create-test-accounts.cjs');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'agritectum-platform'
  });
  console.log(`✅ Initialized Firebase Admin with: ${serviceAccountPath}`);
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Default password for all test accounts
const DEFAULT_PASSWORD = 'Test1234!';

// Test accounts to create
const testAccounts = [
  {
    email: 'admin@agritectum-platform.web.app',
    displayName: 'Super Admin',
    role: 'superadmin',
    permissionLevel: 2,
    branchId: null,
    description: 'Full system access - can manage everything'
  },
  {
    email: 'branch.manager@agritectum-platform.web.app',
    displayName: 'Branch Manager',
    role: 'branchAdmin',
    permissionLevel: 1,
    branchId: 'main', // Will need to create or use existing branch
    description: 'Branch-level management - can manage their branch'
  },
  {
    email: 'roofer@agritectum-platform.web.app',
    displayName: 'Roofer Inspector',
    role: 'inspector',
    permissionLevel: 0,
    branchId: 'main', // Will need to create or use existing branch
    description: 'Field inspector - can create and edit reports'
  },
  {
    email: 'customer@agritectum-platform.web.app',
    displayName: 'Test Customer',
    role: 'customer',
    permissionLevel: -1,
    branchId: null,
    description: 'Customer user - can view their buildings, offers, and agreements'
  }
];

async function createBranchIfNeeded() {
  try {
    // Check if 'main' branch exists
    const branchesRef = db.collection('branches');
    const mainBranchQuery = await branchesRef.where('name', '==', 'Main Branch').limit(1).get();
    
    if (mainBranchQuery.empty) {
      // Create main branch
      const branchData = {
        name: 'Main Branch',
        address: 'Stockholm, Sweden',
        phone: '+46 123 456 789',
        email: 'main@agritectum-platform.web.app',
        country: 'Sweden',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const branchRef = await branchesRef.add(branchData);
      console.log('✅ Created Main Branch with ID:', branchRef.id);
      return branchRef.id;
    } else {
      const branchId = mainBranchQuery.docs[0].id;
      console.log('✅ Main Branch already exists with ID:', branchId);
      return branchId;
    }
  } catch (error) {
    console.error('❌ Error creating/checking branch:', error);
    throw error;
  }
}

async function createUserAccount(userData, branchId) {
  try {
    console.log(`\n📝 Creating ${userData.role}: ${userData.displayName}`);
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(userData.email);
      console.log(`   ⚠️  User already exists: ${userData.email}`);
      console.log(`   🔄 Updating existing user...`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: userData.email,
          password: DEFAULT_PASSWORD,
          displayName: userData.displayName,
          emailVerified: true
        });
        console.log(`   ✅ Created Firebase Auth user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Set custom claims
    const customClaims = {
      role: userData.role,
      permissionLevel: userData.permissionLevel
    };

    if (userData.branchId) {
      customClaims.branchId = branchId || userData.branchId;
      customClaims.branchIds = [branchId || userData.branchId];
    } else if (userData.role === 'superadmin') {
      customClaims.branchIds = [];
    }

    if (userData.role === 'customer') {
      // For customer, we'll need to create customer record first
      // For now, we'll set a placeholder customerId
      customClaims.customerId = userRecord.uid; // Temporary, will be updated when customer record is created
    }

    await auth.setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`   ✅ Set custom claims`);

    // Create/update user document in Firestore
    const userDocData = {
      uid: userRecord.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      permissionLevel: userData.permissionLevel,
      lastLogin: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (userData.role === 'superadmin') {
      userDocData.branchIds = [];
    } else if (userData.branchId) {
      userDocData.branchId = branchId || userData.branchId;
    }

    if (userData.role === 'customer') {
      userDocData.customerId = userRecord.uid; // Temporary
    }

    // Check if user document exists
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.update(userDocData);
      console.log(`   ✅ Updated Firestore user document`);
    } else {
      userDocData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userDocRef.set(userDocData);
      console.log(`   ✅ Created Firestore user document`);
    }

    // For customer, create customer record
    if (userData.role === 'customer') {
      const customersRef = db.collection('customers');
      const existingCustomer = await customersRef.where('email', '==', userData.email).limit(1).get();
      
      if (existingCustomer.empty) {
        const customerData = {
          name: userData.displayName,
          email: userData.email,
          customerType: 'individual',
          uid: userRecord.uid,
          userId: userRecord.uid,
          isRegistered: true,
          totalReports: 0,
          totalRevenue: 0,
          buildings: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: userRecord.uid
        };
        
        const customerRef = await customersRef.add(customerData);
        console.log(`   ✅ Created customer record: ${customerRef.id}`);
        
        // Update user document with customerId
        await userDocRef.update({ customerId: customerRef.id });
        
        // Update custom claims with customerId
        await auth.setCustomUserClaims(userRecord.uid, {
          ...customClaims,
          customerId: customerRef.id
        });
      } else {
        const customerId = existingCustomer.docs[0].id;
        await existingCustomer.docs[0].ref.update({
          uid: userRecord.uid,
          userId: userRecord.uid,
          isRegistered: true
        });
        await userDocRef.update({ customerId });
        await auth.setCustomUserClaims(userRecord.uid, {
          ...customClaims,
          customerId
        });
        console.log(`   ✅ Updated existing customer record: ${customerId}`);
      }
    }

    // For non-superadmin, create employee record in branch
    if (userData.role !== 'superadmin' && userData.role !== 'customer' && branchId) {
      const employeesRef = db.collection('branches').doc(branchId).collection('employees');
      const existingEmployee = await employeesRef.where('uid', '==', userRecord.uid).limit(1).get();
      
      if (existingEmployee.empty) {
        await employeesRef.add({
          uid: userRecord.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          permissionLevel: userData.permissionLevel,
          branchId: branchId,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null
        });
        console.log(`   ✅ Created employee record in branch`);
      } else {
        await existingEmployee.docs[0].ref.update({
          isActive: true,
          role: userData.role,
          permissionLevel: userData.permissionLevel
        });
        console.log(`   ✅ Updated employee record in branch`);
      }
    }

    return {
      email: userData.email,
      password: DEFAULT_PASSWORD,
      role: userData.role,
      uid: userRecord.uid
    };
  } catch (error) {
    console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Creating Test Accounts for Agritectum Platform\n');
    console.log('=' .repeat(60));

    // Create or get main branch
    const branchId = await createBranchIfNeeded();
    
    // Update branch IDs for users that need them
    testAccounts.forEach(account => {
      if (account.branchId === 'main') {
        account.branchId = branchId;
      }
    });

    const createdAccounts = [];

    // Create all test accounts
    for (const account of testAccounts) {
      try {
        const result = await createUserAccount(account, branchId);
        createdAccounts.push(result);
      } catch (error) {
        console.error(`Failed to create ${account.email}:`, error.message);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Accounts Created Successfully!\n');
    console.log('📋 Login Credentials:\n');
    
    createdAccounts.forEach(account => {
      const accountData = testAccounts.find(a => a.email === account.email);
      console.log(`👤 ${accountData.displayName} (${accountData.role})`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   ${accountData.description}`);
      console.log('');
    });

    console.log('🔐 All accounts use the same password:', DEFAULT_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!');
    console.log('\n🌐 Login URL: https://agritectum-platform.web.app/login');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

