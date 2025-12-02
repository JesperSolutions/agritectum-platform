# Firebase Admin SDK Setup

This document explains how to set up Firebase Admin SDK for user management and custom claims in the TagLacket application.

## Prerequisites

1. Node.js installed on your system
2. Firebase project created
3. Service account key downloaded from Firebase Console

## Setup Steps

### 1. Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### 2. Download Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in your project root
4. **IMPORTANT**: Add this file to `.gitignore` to keep it secure

### 3. Create Admin Scripts

Create a `scripts` folder in your project root and add the following files:

#### scripts/admin-setup.js

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com',
});

const db = admin.firestore();

// Create initial superadmin user
async function createSuperAdmin() {
  try {
    const email = 'admin@taklaget.se';
    const password = 'TempPassword123!';

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: 'Super Admin',
      emailVerified: true,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      branchIds: [], // Superadmin can access all branches
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: 'Super Admin',
      role: 'superadmin',
      branchIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    console.log('Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', userRecord.uid);
    console.log('\nIMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

// Create initial branch
async function createInitialBranch() {
  try {
    const branchData = {
      name: 'TagLacket Småland',
      address: 'Växjö, Småland, Sweden',
      phone: '+46 470 123 456',
      email: 'smaland@taklaget.se',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const branchRef = await db.collection('branches').add(branchData);
    console.log('Initial branch created with ID:', branchRef.id);

    return branchRef.id;
  } catch (error) {
    console.error('Error creating initial branch:', error);
  }
}

// Create branch admin user
async function createBranchAdmin(branchId) {
  try {
    const email = 'admin.smaland@taklaget.se';
    const password = 'TempPassword123!';

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: 'Branch Admin Småland',
      emailVerified: true,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'branchAdmin',
      branchId: branchId,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: 'Branch Admin Småland',
      role: 'branchAdmin',
      branchId: branchId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    // Create employee record in branch
    await db.collection('branches').doc(branchId).collection('employees').add({
      uid: userRecord.uid,
      email: email,
      displayName: 'Branch Admin Småland',
      role: 'branchAdmin',
      branchId: branchId,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    console.log('Branch admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', userRecord.uid);
    console.log('Branch ID:', branchId);
  } catch (error) {
    console.error('Error creating branch admin:', error);
  }
}

// Create inspector user
async function createInspector(branchId) {
  try {
    const email = 'inspector.smaland@taklaget.se';
    const password = 'TempPassword123!';

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: 'Inspector Småland',
      emailVerified: true,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'inspector',
      branchId: branchId,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: 'Inspector Småland',
      role: 'inspector',
      branchId: branchId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    // Create employee record in branch
    await db.collection('branches').doc(branchId).collection('employees').add({
      uid: userRecord.uid,
      email: email,
      displayName: 'Inspector Småland',
      role: 'inspector',
      branchId: branchId,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    console.log('Inspector created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', userRecord.uid);
    console.log('Branch ID:', branchId);
  } catch (error) {
    console.error('Error creating inspector:', error);
  }
}

// Main setup function
async function setup() {
  console.log('Starting Firebase Admin setup...\n');

  // Create super admin
  await createSuperAdmin();
  console.log('\n---\n');

  // Create initial branch
  const branchId = await createInitialBranch();
  console.log('\n---\n');

  // Create branch admin
  await createBranchAdmin(branchId);
  console.log('\n---\n');

  // Create inspector
  await createInspector(branchId);
  console.log('\n---\n');

  console.log('Setup completed! You can now log in with any of the created accounts.');
  console.log('Remember to change all passwords after first login!');

  process.exit(0);
}

// Run setup
setup().catch(console.error);
```

#### scripts/create-user.js

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const readline = require('readline');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com',
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  try {
    console.log('Create New User\n');

    const email = await question('Email: ');
    const password = await question('Password: ');
    const displayName = await question('Display Name: ');
    const role = await question('Role (inspector/branchAdmin/superadmin): ');
    const branchId = await question('Branch ID (leave empty for superadmin): ');

    // Create user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true,
    });

    // Set custom claims
    const claims = { role: role };
    if (role === 'superadmin') {
      claims.branchIds = [];
    } else if (branchId) {
      claims.branchId = branchId;
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, claims);

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    };

    if (role === 'superadmin') {
      userData.branchIds = [];
    } else if (branchId) {
      userData.branchId = branchId;
    }

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Create employee record in branch if not superadmin
    if (role !== 'superadmin' && branchId) {
      await db.collection('branches').doc(branchId).collection('employees').add({
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        role: role,
        branchId: branchId,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
      });
    }

    console.log('\nUser created successfully!');
    console.log('UID:', userRecord.uid);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    rl.close();
  }
}

createUser();
```

#### scripts/update-user-claims.js

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com',
});

async function updateUserClaims(uid, claims) {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log('User claims updated successfully!');
  } catch (error) {
    console.error('Error updating user claims:', error);
  }
}

// Example usage
const uid = process.argv[2];
const role = process.argv[3];
const branchId = process.argv[4];

if (!uid || !role) {
  console.log('Usage: node update-user-claims.js <uid> <role> [branchId]');
  process.exit(1);
}

const claims = { role: role };
if (role === 'superadmin') {
  claims.branchIds = [];
} else if (branchId) {
  claims.branchId = branchId;
}

updateUserClaims(uid, claims).then(() => process.exit(0));
```

### 4. Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "setup-firebase": "node scripts/admin-setup.js",
    "create-user": "node scripts/create-user.js",
    "update-claims": "node scripts/update-user-claims.js"
  }
}
```

### 5. Security Rules

Make sure your Firestore security rules are properly configured. The rules should be in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role;
    }

    function getUserBranchId() {
      return request.auth.token.branchId;
    }

    function isSuperadmin() {
      return isAuthenticated() && getUserRole() == 'superadmin';
    }

    function isBranchAdmin() {
      return isAuthenticated() && getUserRole() == 'branchAdmin';
    }

    function isInspector() {
      return isAuthenticated() && getUserRole() == 'inspector';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId ||
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
      allow write: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
    }

    // Branches collection
    match /branches/{branchId} {
      allow read: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && getUserBranchId() == branchId)
      );
      allow write: if isSuperadmin();

      // Employees subcollection
      match /employees/{employeeId} {
        allow read: if isAuthenticated() && (
          isSuperadmin() ||
          (isBranchAdmin() && getUserBranchId() == branchId)
        );
        allow write: if isAuthenticated() && (
          isSuperadmin() ||
          (isBranchAdmin() && getUserBranchId() == branchId)
        );
      }
    }

    // Reports collection
    match /reports/{reportId} {
      allow read: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.createdBy == request.auth.uid && resource.data.branchId == getUserBranchId())
      );
      allow create: if isAuthenticated() && (
        (isInspector() || isBranchAdmin()) &&
        request.resource.data.branchId == getUserBranchId() &&
        request.resource.data.createdBy == request.auth.uid
      );
      allow update: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId()) ||
        (isInspector() && resource.data.createdBy == request.auth.uid && resource.data.branchId == getUserBranchId())
      );
      allow delete: if isAuthenticated() && (
        isSuperadmin() ||
        (isBranchAdmin() && resource.data.branchId == getUserBranchId())
      );
    }
  }
}
```

## Usage

### Initial Setup

1. Run the setup script to create initial users and branches:

```bash
npm run setup-firebase
```

2. Log in to the application with the created accounts
3. Change all passwords immediately

### Creating New Users

```bash
npm run create-user
```

### Updating User Claims

```bash
npm run update-claims <uid> <role> [branchId]
```

## Security Notes

1. **Never commit the service account key to version control**
2. **Change all default passwords immediately**
3. **Use strong passwords for production**
4. **Regularly rotate service account keys**
5. **Monitor user access and permissions**

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check Firestore security rules
2. **"User not found" errors**: Verify the user exists in Firebase Auth
3. **"Invalid custom claims" errors**: Check the claims structure

### Debugging

Enable debug logging:

```javascript
admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com',
  },
  'admin'
);

// Enable debug logging
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

## Production Considerations

1. Use environment variables for sensitive data
2. Implement proper error handling and logging
3. Set up monitoring and alerts
4. Regular security audits
5. Backup user data regularly
