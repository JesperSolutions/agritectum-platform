/**
 * Move DANDY Business Park to Danish branch (agritectum-danmark)
 * - Updates customer branch linkage
 * - Updates user doc branch/customer/company
 * - Updates auth custom claims
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

const CUSTOMER_ID = '1nsxKOqbucZbGHA1Zd9l';
const USER_UID = 'FVG569gVmHOnwGbwpjqMwrpixvF2';
const BRANCH_ID = 'agritectum-danmark';
const EMAIL = 'kontakt@dandybusinesspark.dk';
const DISPLAY_NAME = 'DANDY Business Park';

async function ensureBranch() {
  const branchRef = db.collection('branches').doc(BRANCH_ID);
  const snap = await branchRef.get();
  if (!snap.exists) {
    console.log('⚠️ Branch missing, creating minimal placeholder');
    await branchRef.set({
      id: BRANCH_ID,
      name: 'Agritectum Danmark',
      isActive: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }
}

async function updateCustomer() {
  await db.collection('customers').doc(CUSTOMER_ID).set({
    branchId: BRANCH_ID,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('✅ Customer branch set to', BRANCH_ID);
}

async function updateUserDoc() {
  await db.collection('users').doc(USER_UID).set({
    branchId: BRANCH_ID,
    customerId: CUSTOMER_ID,
    companyId: CUSTOMER_ID,
    email: EMAIL,
    displayName: DISPLAY_NAME,
    role: 'customer',
    userType: 'customer',
    permissionLevel: -1,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✅ User doc updated for', USER_UID);
}

async function updateAuthClaims() {
  await auth.setCustomUserClaims(USER_UID, {
    role: 'customer',
    userType: 'customer',
    permissionLevel: -1,
    branchId: BRANCH_ID,
    customerId: CUSTOMER_ID,
  });
  console.log('✅ Auth claims updated');
}

async function main() {
  try {
    await ensureBranch();
    await updateCustomer();
    await updateUserDoc();
    await updateAuthClaims();
    console.log('\n🎯 Done. Customer is now on branch', BRANCH_ID);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
