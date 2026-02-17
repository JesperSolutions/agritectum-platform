#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function getArgValue(prefix) {
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const usersFilePath =
  getArgValue('--users=') ||
  process.env.ROOFING_USERS_PATH ||
  path.join(__dirname, '../config/credentials/roofing-users.json');

const credentialsPath =
  getArgValue('--credentials=') ||
  process.env.FIREBASE_ADMIN_SDK_PATH ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  '';

if (!fs.existsSync(usersFilePath)) {
  console.error(`Users file not found: ${usersFilePath}`);
  process.exit(1);
}

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error(
    'Firebase Admin SDK JSON not found. Set --credentials=PATH, FIREBASE_ADMIN_SDK_PATH, or GOOGLE_APPLICATION_CREDENTIALS.'
  );
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
if (!payload.users || !Array.isArray(payload.users)) {
  console.error('Invalid users file: expected { users: [...] }');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(credentialsPath))),
  projectId: payload.projectId || 'agritectum-platform',
});

const db = admin.firestore();
const auth = admin.auth();

async function ensureBranch(companyName, email, country) {
  const branchData = {
    name: companyName,
    address: 'TBD',
    phone: '',
    email,
    country: country || 'DK',
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-script',
  };

  const branchRef = await db.collection('branches').add(branchData);
  return branchRef.id;
}

async function upsertUser(user) {
  const { email, password, displayName, companyName, country } = user;
  if (!email || !password || !companyName) {
    throw new Error('User missing required fields: email, password, companyName');
  }

  const branchId = await ensureBranch(companyName, email, country);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  if (!userRecord) {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || companyName,
      emailVerified: true,
    });
  }

  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'branchAdmin',
    branchId,
    permissionLevel: 1,
  });

  await db.collection('users').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      email,
      displayName: displayName || companyName,
      role: 'branchAdmin',
      branchId,
      isActive: true,
      permissionLevel: 1,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { email, uid: userRecord.uid, branchId };
}

async function main() {
  console.log('\nCreating roofing company admin users...\n');

  for (const user of payload.users) {
    try {
      const result = await upsertUser(user);
      console.log(`✅ ${result.email} -> branch ${result.branchId}`);
    } catch (error) {
      console.error(`❌ Failed for ${user.email}: ${error.message}`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
