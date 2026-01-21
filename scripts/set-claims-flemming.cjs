/*
 * Set custom claims and Firestore profile for Flemming Adolfsen
 */
const admin = require('firebase-admin');

const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const AUTH_EMAIL = 'flemming.adolfsen@agritectum.dk';
const CLAIMS = {
  role: 'branchAdmin',
  branchId: 'agritectum-danmark',
  permissionLevel: 1,
};

async function run() {
  try {
    console.log('🔎 Fetching user by email:', AUTH_EMAIL);
    const userRecord = await admin.auth().getUserByEmail(AUTH_EMAIL);
    console.log('✅ User found:', userRecord.uid);

    console.log('🔐 Setting custom claims:', CLAIMS);
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      ...(userRecord.customClaims || {}),
      ...CLAIMS,
    });

    console.log('📝 Updating Firestore user profile');
    const userRef = admin.firestore().collection('users').doc(userRecord.uid);
    await userRef.set(
      {
        email: AUTH_EMAIL,
        displayName: userRecord.displayName || 'Flemming Adolfsen',
        role: CLAIMS.role,
        branchId: CLAIMS.branchId,
        permissionLevel: CLAIMS.permissionLevel,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log('🎉 Done. Claims and profile updated.');
  } catch (err) {
    console.error('❌ Error updating claims/profile:', err);
    process.exit(1);
  }
}

run().then(() => process.exit(0));
