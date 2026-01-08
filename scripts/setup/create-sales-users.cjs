#!/usr/bin/env node

/**
 * Create Sales User Accounts Script
 * 
 * This script creates user accounts for sales team members and assigns them as branch admins
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    console.error('   Please install it: npm install firebase-admin');
    process.exit(1);
  }
}

// Generate a strong password
function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly to reach 16 characters minimum
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password for randomness
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createSalesUsers() {
  try {
    console.log('👥 Generating sales user credentials...\n');

    // Try to initialize Firebase Admin (optional)
    let db = null;
    let useAdminSDK = false;
    
    try {
      const projectRoot = path.join(__dirname, '..', '..');
      const files = fs.readdirSync(projectRoot);
      const serviceAccountFile = files.find(f => 
        (f.startsWith('taklaget-service-app-firebase-adminsdk-') || f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
        f.endsWith('.json')
      );
      
      if (serviceAccountFile) {
        const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
        
        // Check if already initialized
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        
        db = admin.firestore();
        useAdminSDK = true;
        console.log('✅ Firebase Admin initialized successfully\n');
      } else {
        console.log('⚠️  Firebase Admin SDK not available. Will generate credentials for manual creation.\n');
      }
    } catch (error) {
      console.log('⚠️  Could not initialize Firebase Admin SDK. Will generate credentials for manual creation.\n');
    }

    // Read branch IDs from the JSON file
    const branchesPath = path.join(__dirname, '..', '..', 'sales-test-branches.json');
    let branchesData = {};
    
    if (fs.existsSync(branchesPath)) {
      branchesData = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));
    } else {
      console.error('❌ sales-test-branches.json not found. Please run add-sales-test-branches.cjs first.');
      process.exit(1);
    }

    // Sales users data
    const salesUsers = [
      {
        email: 'flemming.adolfsen@agritectum.com',
        displayName: 'Flemming Adolfsen',
        branchName: 'Sales Test Branch Alpha'
      },
      {
        email: 'leitz@kluthdach.de',
        displayName: 'Marcus Leitz',
        branchName: 'Sales Test Branch Beta'
      },
      {
        email: 'bengt.widstrand@binne.se',
        displayName: 'Bengt Widstrand',
        branchName: 'Sales Test Branch Gamma'
      },
      {
        email: 'mail@monicalund.dk',
        displayName: 'Monica Lund',
        branchName: 'Sales Test Branch Delta'
      }
    ];

    console.log('📋 Creating user accounts...\n');

    const createdUsers = [];

    for (const userData of salesUsers) {
      try {
        // Find the branch ID for this user
        const branch = branchesData.branches?.find(b => 
          b.contactPerson?.email === userData.email || b.email === userData.email
        );

        if (!branch || !branch.id) {
          console.error(`❌ Could not find branch for ${userData.email}`);
          continue;
        }

        const branchId = branch.id;
        const password = generatePassword();

        console.log(`Generating credentials for: ${userData.displayName} (${userData.email})`);
        console.log(`   Branch: ${branch.name} (${branchId})`);

        if (useAdminSDK && db) {
          try {
            // Create Firebase Auth user
            const firebaseUser = await admin.auth().createUser({
              email: userData.email,
              password: password,
              displayName: userData.displayName,
              emailVerified: false,
            });

            console.log(`   ✅ Firebase Auth user created: ${firebaseUser.uid}`);

            // Set custom claims for role and permissions
            const customClaims = {
              role: 'branchAdmin',
              permissionLevel: 1,
              branchId: branchId,
              branchIds: [branchId],
            };

            await admin.auth().setCustomUserClaims(firebaseUser.uid, customClaims);
            console.log(`   ✅ Custom claims set`);

            // Create user document in Firestore
            const userDoc = {
              uid: firebaseUser.uid,
              email: userData.email,
              displayName: userData.displayName,
              role: 'branchAdmin',
              permissionLevel: 1,
              branchId: branchId,
              isActive: true,
              createdAt: new Date().toISOString(),
            };

            await db.collection('users').add(userDoc);
            console.log(`   ✅ Firestore user document created\n`);

            createdUsers.push({
              ...userData,
              password: password,
              branchId: branchId,
              branchName: branch.name,
              uid: firebaseUser.uid,
              created: true
            });
          } catch (error) {
            if (error.code === 'auth/email-already-exists') {
              console.log(`   ⚠️  User ${userData.email} already exists, skipping...\n`);
            } else {
              console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
              // Still add to list with credentials for manual creation
              createdUsers.push({
                ...userData,
                password: password,
                branchId: branchId,
                branchName: branch.name,
                created: false,
                error: error.message
              });
            }
          }
        } else {
          // Just generate credentials without creating
          createdUsers.push({
            ...userData,
            password: password,
            branchId: branchId,
            branchName: branch.name,
            created: false
          });
          console.log(`   ✅ Credentials generated\n`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${userData.email}:`, error.message);
      }
    }

    // Display login credentials
    console.log('\n' + '='.repeat(80));
    console.log('📋 SALES BRANCH LOGIN CREDENTIALS');
    console.log('='.repeat(80) + '\n');

    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Branch: ${user.branchName} (${user.branchId})`);
      console.log(`   Role: Branch Admin`);
      console.log('');
    });

    console.log('='.repeat(80));
    
    if (useAdminSDK) {
      const createdCount = createdUsers.filter(u => u.created).length;
      console.log(`\n✅ ${createdCount} user account(s) created successfully!`);
      if (createdCount < createdUsers.length) {
        console.log(`⚠️  ${createdUsers.length - createdCount} user(s) need to be created manually (see instructions below).`);
      }
    } else {
      console.log('\n📋 Credentials generated! Use the instructions below to create users.');
    }
    
    console.log('\n💡 Save these credentials securely. Users can now log in to the system.');
    
    if (!useAdminSDK || createdUsers.some(u => !u.created)) {
      console.log('\n📝 To create users manually:');
      console.log('1. Log in to the admin panel as a superadmin');
      console.log('2. Go to User Management');
      console.log('3. Click "Add User"');
      console.log('4. For each user above, enter:');
      console.log('   - Email: (from list above)');
      console.log('   - Display Name: (from list above)');
      console.log('   - Password: (from list above)');
      console.log('   - Role: Branch Admin');
      console.log('   - Branch: Select the corresponding branch');
      console.log('5. Save the user');
    }

    // Save credentials to a file
    const credentialsPath = path.join(__dirname, '..', '..', 'sales-user-credentials.json');
    const credentialsData = {
      createdAt: new Date().toISOString(),
      users: createdUsers.map(u => ({
        displayName: u.displayName,
        email: u.email,
        password: u.password,
        branchId: u.branchId,
        branchName: u.branchName,
        role: 'branchAdmin'
      }))
    };
    
    fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
    console.log(`\n📄 Credentials saved to: ${credentialsPath}`);

  } catch (error) {
    console.error('❌ Error creating sales users:', error);
    process.exit(1);
  }
}

// Run the script
createSalesUsers();

