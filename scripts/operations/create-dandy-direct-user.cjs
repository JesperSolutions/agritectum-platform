/**
 * Directly create DANDY Business Park portal user (no invitation flow)
 * - Deletes existing invitations for the customer
 * - Creates Firebase Auth user with password
 * - Sets custom claims and Firestore user document
 * - Links user to customer and branch
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../..', 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Config
const CUSTOMER_ID = '1nsxKOqbucZbGHA1Zd9l';
const BRANCH_ID = 'test-agritectum-zh0q0b';
const EMAIL = 'kontakt@dandybusinesspark.dk';
const PASSWORD = 'Dandy2026!'; // Strong temp password; share with customer securely
const DISPLAY_NAME = 'DANDY Business Park';

async function deleteInvitations() {
  const snap = await db.collection('customerInvitations').where('customerId', '==', CUSTOMER_ID).get();
  let deleted = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    deleted++;
  }
  console.log(`🗑️ Deleted ${deleted} invitation(s) for customer ${CUSTOMER_ID}`);
}

async function ensureAuthUser() {
  // Remove existing user by email if present (to avoid email collision)
  try {
    const existing = await auth.getUserByEmail(EMAIL);
    console.log('ℹ️ Existing auth user found, deleting:', existing.uid);
    await auth.deleteUser(existing.uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      throw err;
    }
  }

  const userRecord = await auth.createUser({
    email: EMAIL,
    password: PASSWORD,
    displayName: DISPLAY_NAME,
    emailVerified: true,
  });
  console.log('✅ Created auth user:', userRecord.uid);

  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'customer',
    userType: 'customer',
    permissionLevel: -1,
    branchId: BRANCH_ID,
    customerId: CUSTOMER_ID,
  });

  return userRecord.uid;
}

async function writeUserDoc(uid) {
  const userDoc = {
    uid,
    email: EMAIL,
    displayName: DISPLAY_NAME,
    role: 'customer',
    userType: 'customer',
    permissionLevel: -1,
    branchId: BRANCH_ID,
    customerId: CUSTOMER_ID,
    companyId: CUSTOMER_ID,
    phone: '+45 21 44 04 30',
    address: 'Lysholt Allé 10, 7100 Vejle',
    cvr: '36199512',
    createdAt: new Date().toISOString(),
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log('✅ Firestore user document written for', uid);
}

async function linkCustomer(uid) {
  await db.collection('customers').doc(CUSTOMER_ID).set(
    {
      primaryUserId: uid,
      email: EMAIL,
      phone: '+45 21 44 04 30',
      contactPerson: DISPLAY_NAME,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log('🔗 Linked customer to user', uid);
}

async function main() {
  try {
    await deleteInvitations();
    const uid = await ensureAuthUser();
    await writeUserDoc(uid);
    await linkCustomer(uid);

    console.log('\n🎯 DONE. Login credentials ready:');
    console.log('Email:', EMAIL);
    console.log('Password:', PASSWORD);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
